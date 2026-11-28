import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import ffmpegPath from 'ffmpeg-static';
import { randomUUID } from 'node:crypto';
import { chmod, copyFile, mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

import { PrismaService } from '../../database/prisma.service';
import { trimSearchQuery } from '../../database/search-query';

import type {
  MediaGalleryItemDto,
  MediaGalleryResponseDto,
  MediaStorageUsageDto,
  MediaUploadDto,
  UploadedMediaFile,
} from './media.types';

const uploadsDirectory = resolve(process.cwd(), 'uploads');
const imageDirectory = resolve(uploadsDirectory, 'images');
const videoDirectory = resolve(uploadsDirectory, 'videos');
const galleryIndexPath = resolve(imageDirectory, '.gallery.json');
const STORAGE_WARNING_LIMIT_BYTES = 1024 * 1024 * 1024;
const DRIVE_FETCH_ERROR = 'Can not get the image/video';

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.m4v', '.mov', '.mp4', '.webm']);

function extractGoogleDriveFileId(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    if (host !== 'drive.google.com' && host !== 'drive.usercontent.google.com') {
      return null;
    }
    const pathMatch = parsed.pathname.match(/\/(?:file\/d|d)\/([a-zA-Z0-9_-]{10,})/);
    if (pathMatch?.[1]) return pathMatch[1];
    const queryId = parsed.searchParams.get('id');
    if (queryId && /^[a-zA-Z0-9_-]{10,}$/.test(queryId)) return queryId;
    return null;
  } catch {
    return null;
  }
}

function detectMimeFromBuffer(header: Buffer, contentType: string | null): string | null {
  const normalized = (contentType ?? '').split(';')[0]?.trim().toLowerCase() ?? '';
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp' ||
    normalized === 'image/gif' ||
    normalized === 'image/avif' ||
    normalized === 'video/mp4' ||
    normalized === 'video/webm' ||
    normalized === 'video/quicktime'
  ) {
    return normalized;
  }
  if (header.length >= 3 && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) {
    return 'image/jpeg';
  }
  if (header.length >= 4 && header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) {
    return 'image/png';
  }
  if (
    header.length >= 12 &&
    header.subarray(0, 4).toString('ascii') === 'RIFF' &&
    header.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (header.length >= 4 && header.subarray(0, 4).toString('ascii') === 'GIF8') {
    return 'image/gif';
  }
  if (header.length >= 4 && header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
    return 'video/webm';
  }
  if (header.length >= 12 && header.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = header.subarray(8, 12).toString('ascii');
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
    if (brand === 'qt  ') return 'video/quicktime';
    return 'video/mp4';
  }
  return null;
}

async function calculateDirectoryBytes(dir: string): Promise<number> {
  let total = 0;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  await Promise.all(
    entries.map(async (entry) => {
      if (entry.name === '.tmp') return;
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        total += await calculateDirectoryBytes(fullPath);
      } else if (entry.isFile()) {
        const info = await stat(fullPath).catch(() => null);
        if (info) total += info.size;
      }
    }),
  );
  return total;
}

type GalleryIndexItem = {
  externalUrl?: string;
  folder: string;
  height?: number;
  originalName?: string;
  size?: number;
  updatedAt?: string;
  width?: number;
};

type GalleryIndex = {
  folders: string[];
  items: Record<string, GalleryIndexItem>;
};

function normalizeFolderName(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = raw.trim().replace(/[\\/]+/g, ' ').replace(/\s+/g, ' ');
  if (cleaned.length > 80) {
    throw new BadRequestException('Folder name must be 80 characters or fewer.');
  }
  return cleaned;
}

function sanitizeFilename(filename: string): string {
  const safe = basename(filename);
  if (!safe || safe !== filename || safe.startsWith('.')) {
    throw new BadRequestException('Invalid image filename.');
  }
  return safe;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private indexWriteChain: Promise<void> = Promise.resolve();
  private storageUsageCache: { expiresAt: number; value: MediaStorageUsageDto } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async readIndex(): Promise<GalleryIndex> {
    try {
      const raw = await readFile(galleryIndexPath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<GalleryIndex>;
      return {
        folders: Array.isArray(parsed.folders)
          ? [...new Set(parsed.folders.filter((f): f is string => typeof f === 'string' && Boolean(f.trim())))]
          : [],
        items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
      };
    } catch {
      return { folders: [], items: {} };
    }
  }

  private async mutateIndex<T>(mutator: (index: GalleryIndex) => Promise<T> | T): Promise<T> {
    let result!: T;
    const run = async () => {
      await mkdir(imageDirectory, { recursive: true });
      const index = await this.readIndex();
      result = await mutator(index);
      const tmpPath = `${galleryIndexPath}.${randomUUID()}.tmp`;
      await writeFile(tmpPath, JSON.stringify(index, null, 2), 'utf8');
      await rename(tmpPath, galleryIndexPath);
    };
    const next = this.indexWriteChain.then(run, run);
    this.indexWriteChain = next.then(() => undefined, () => undefined);
    await next;
    return result;
  }

  async getStorageUsage(): Promise<MediaStorageUsageDto> {
    if (this.storageUsageCache && this.storageUsageCache.expiresAt > Date.now()) {
      return this.storageUsageCache.value;
    }
    const totalBytes = await calculateDirectoryBytes(uploadsDirectory);
    const value: MediaStorageUsageDto = {
      exceedsLimit: totalBytes > STORAGE_WARNING_LIMIT_BYTES,
      limitBytes: STORAGE_WARNING_LIMIT_BYTES,
      totalBytes,
    };
    this.storageUsageCache = {
      expiresAt: Date.now() + 5 * 60 * 1000,
      value,
    };
    return value;
  }

  async importFromGoogleDrive(rawUrl: string, rawFolder?: string): Promise<MediaUploadDto> {
    const fileId = extractGoogleDriveFileId(rawUrl);
    if (!fileId) {
      throw new BadRequestException(DRIVE_FETCH_ERROR);
    }

    const folder = normalizeFolderName(rawFolder);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const downloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
      const response = await fetch(downloadUrl, {
        headers: {
          Range: 'bytes=0-31',
          'User-Agent': 'Mozilla/5.0',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      if ((!response.ok && response.status !== 206) || !response.body) {
        throw new BadRequestException(DRIVE_FETCH_ERROR);
      }

      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let readBytes = 0;
      while (readBytes < 32) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(Buffer.from(value));
          readBytes += value.byteLength;
        }
      }
      await reader.cancel().catch(() => undefined);

      const header = Buffer.concat(chunks).subarray(0, 32);
      if (header.length === 0) {
        throw new BadRequestException(DRIVE_FETCH_ERROR);
      }

      const mimetype = detectMimeFromBuffer(header, response.headers.get('content-type'));
      if (!mimetype) {
        throw new BadRequestException(DRIVE_FETCH_ERROR);
      }

      const contentRange = response.headers.get('content-range') ?? '';
      const rangeTotalMatch = contentRange.match(/\/(\d+)$/);
      const remoteSize = rangeTotalMatch?.[1]
        ? Number(rangeTotalMatch[1])
        : Number(response.headers.get('content-length') ?? '0');

      const disposition = response.headers.get('content-disposition') ?? '';
      const nameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";\r\n]+)"?/i);
      const originalName = nameMatch?.[1] ? decodeURIComponent(nameMatch[1]) : `drive-${fileId}`;

      const isVideo = mimetype.startsWith('video/');
      const url = isVideo
        ? `/api/media/drive/${encodeURIComponent(fileId)}.mp4`
        : `https://lh3.googleusercontent.com/d/${encodeURIComponent(fileId)}`;
      const filename = isVideo ? `drive-${fileId}.mp4` : `drive-${fileId}.webp`;
      const nowIso = new Date().toISOString();

      await this.mutateIndex((index) => {
        if (folder && !index.folders.includes(folder)) {
          index.folders.push(folder);
        }
        index.items[filename] = {
          externalUrl: url,
          folder,
          originalName,
          size: Number.isFinite(remoteSize) ? remoteSize : 0,
          updatedAt: nowIso,
        };
      });

      return {
        filename,
        folder,
        mimeType: isVideo ? 'video/mp4' : 'image/webp',
        originalName,
        size: Number.isFinite(remoteSize) ? remoteSize : 0,
        url,
      };
    } catch (error) {
      this.logger.warn(
        `Google Drive media link failed: ${error instanceof Error ? error.message.slice(0, 200) : String(error)}`,
      );
      throw new BadRequestException(DRIVE_FETCH_ERROR);
    } finally {
      clearTimeout(timeout);
    }
  }

  async process(file: UploadedMediaFile, rawFolder?: string): Promise<MediaUploadDto> {
    try {
      if (file.size > 20 * 1024 * 1024) {
        throw new BadRequestException('Files must be 20 MB or smaller.');
      }
      const result = file.mimetype.startsWith('image/')
        ? await this.processImage(file, rawFolder)
        : await this.processVideo(file, rawFolder);
      this.storageUsageCache = null;
      return result;
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  private async processImage(file: UploadedMediaFile, rawFolder?: string): Promise<MediaUploadDto> {
    await mkdir(imageDirectory, { recursive: true });
    const folder = normalizeFolderName(rawFolder);
    const filename = `${randomUUID()}.webp`;
    const outputPath = resolve(imageDirectory, filename);

    const { height, size, width } = await sharp(file.path, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({
        fit: 'inside',
        height: 1920,
        width: 1920,
        withoutEnlargement: true,
      })
      .webp({ effort: 4, quality: 82, smartSubsample: true })
      .toFile(outputPath);

    await this.mutateIndex((index) => {
      if (folder && !index.folders.includes(folder)) {
        index.folders.push(folder);
      }
      index.items[filename] = {
        folder,
        height,
        originalName: file.originalname,
        width,
      };
    });

    return {
      filename,
      folder,
      height,
      mimeType: 'image/webp',
      originalName: file.originalname,
      size,
      url: `/uploads/images/${filename}`,
      width,
    };
  }

  async listGallery(folderFilter?: string, q?: string): Promise<MediaGalleryResponseDto> {
    await Promise.all([
      mkdir(imageDirectory, { recursive: true }),
      mkdir(videoDirectory, { recursive: true }),
    ]);
    const [index, imageEntries, videoEntries] = await Promise.all([
      this.readIndex(),
      readdir(imageDirectory, { withFileTypes: true }),
      readdir(videoDirectory, { withFileTypes: true }),
    ]);

    const mediaFiles: Array<{ dir: string; filename: string; urlPrefix: string }> = [
      ...imageEntries
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
        .map((entry) => ({ dir: imageDirectory, filename: entry.name, urlPrefix: '/uploads/images' })),
      ...videoEntries
        .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && VIDEO_EXTENSIONS.has(extname(entry.name).toLowerCase()))
        .map((entry) => ({ dir: videoDirectory, filename: entry.name, urlPrefix: '/uploads/videos' })),
    ];

    const statResults = await Promise.all(
      mediaFiles.map(async ({ dir, filename, urlPrefix }): Promise<MediaGalleryItemDto | null> => {
        try {
          const info = await stat(resolve(dir, filename));
          const meta = index.items[filename];
          return {
            filename,
            folder: meta?.folder ?? '',
            height: meta?.height,
            originalName: meta?.originalName || filename,
            size: info.size,
            updatedAt: info.mtime.toISOString(),
            url: `${urlPrefix}/${filename}`,
            width: meta?.width,
          };
        } catch {
          return null;
        }
      }),
    );

    const externalItems: MediaGalleryItemDto[] = Object.entries(index.items)
      .filter(([, meta]) => Boolean(meta.externalUrl))
      .map(([filename, meta]) => ({
        filename,
        folder: meta.folder ?? '',
        height: meta.height,
        originalName: meta.originalName || filename,
        size: meta.size ?? 0,
        updatedAt: meta.updatedAt || new Date(0).toISOString(),
        url: meta.externalUrl!,
        width: meta.width,
      }));

    const allItems = [
      ...statResults.filter((item): item is MediaGalleryItemDto => item !== null),
      ...externalItems,
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const folderCounts = new Map<string, number>();
    for (const folder of index.folders) {
      folderCounts.set(folder, 0);
    }
    let uncategorizedCount = 0;
    for (const item of allItems) {
      if (!item.folder) {
        uncategorizedCount += 1;
      } else {
        folderCounts.set(item.folder, (folderCounts.get(item.folder) ?? 0) + 1);
      }
    }

    const search = trimSearchQuery(q)?.toLowerCase();
    let filtered = allItems;
    if (folderFilter !== undefined) {
      if (folderFilter === '__uncategorized__') {
        filtered = filtered.filter((item) => !item.folder);
      } else if (folderFilter !== '' && folderFilter !== '__all__') {
        filtered = filtered.filter((item) => item.folder === folderFilter);
      }
    }
    if (search) {
      filtered = filtered.filter(
        (item) =>
          item.originalName.toLowerCase().includes(search) ||
          item.filename.toLowerCase().includes(search) ||
          item.folder.toLowerCase().includes(search),
      );
    }

    const folders = [...folderCounts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, count]) => ({ count, name }));

    return {
      folders,
      items: filtered,
      totalCount: allItems.length,
      uncategorizedCount,
    };
  }

  async createFolder(rawName: string): Promise<{ name: string }> {
    const name = normalizeFolderName(rawName);
    if (!name) {
      throw new BadRequestException('Folder name is required.');
    }

    await this.mutateIndex((index) => {
      if (!index.folders.includes(name)) {
        index.folders.push(name);
      }
    });

    return { name };
  }

  async renameFolder(rawOldName: string, rawNewName: string): Promise<{ name: string }> {
    const oldName = normalizeFolderName(rawOldName);
    const newName = normalizeFolderName(rawNewName);
    if (!oldName || !newName) {
      throw new BadRequestException('Both current and new folder names are required.');
    }

    await this.mutateIndex((index) => {
      if (!index.folders.includes(oldName)) {
        throw new NotFoundException('Folder not found.');
      }
      index.folders = [...new Set(index.folders.map((f) => (f === oldName ? newName : f)))];
      for (const item of Object.values(index.items)) {
        if (item.folder === oldName) {
          item.folder = newName;
        }
      }
    });

    return { name: newName };
  }

  async deleteFolder(rawName: string): Promise<void> {
    const name = normalizeFolderName(rawName);
    if (!name) {
      throw new BadRequestException('Folder name is required.');
    }

    await this.mutateIndex((index) => {
      index.folders = index.folders.filter((f) => f !== name);
      for (const item of Object.values(index.items)) {
        if (item.folder === name) {
          item.folder = '';
        }
      }
    });
  }

  async moveImages(filenames: string[], rawFolder: string): Promise<{ moved: number }> {
    if (!Array.isArray(filenames) || filenames.length === 0) {
      throw new BadRequestException('At least one image filename is required.');
    }
    const safeNames = [...new Set(filenames.map(sanitizeFilename))];
    const folder = normalizeFolderName(rawFolder);

    await this.mutateIndex((index) => {
      if (folder && !index.folders.includes(folder)) {
        index.folders.push(folder);
      }
      for (const filename of safeNames) {
        const existing = index.items[filename] ?? { folder: '' };
        index.items[filename] = { ...existing, folder };
      }
    });

    return { moved: safeNames.length };
  }

  private async findAssetUsages(filename: string): Promise<string[]> {
    const [pages, articles, courses, lessons, events, eventSeries, profiles, evidenceCount] = await Promise.all([
      this.prisma.page.findMany({
        where: { deleted_at: null },
        select: {
          content_json_en: true,
          content_json_vi: true,
          route_path: true,
          slug: true,
          title_en: true,
          title_vi: true,
        },
      }),
      this.prisma.article.findMany({
        where: {
          deleted_at: null,
          OR: [
            { cover_image_url: { contains: filename } },
            { content_markdown_en: { contains: filename } },
            { content_markdown_vi: { contains: filename } },
          ],
        },
        select: { slug: true, title_en: true, title_vi: true },
        take: 10,
      }),
      this.prisma.course.findMany({
        where: { deleted_at: null, cover_image_url: { contains: filename } },
        select: { slug: true, title_en: true, title_vi: true },
        take: 10,
      }),
      this.prisma.lesson.findMany({
        where: {
          OR: [
            { content_markdown_en: { contains: filename } },
            { content_markdown_vi: { contains: filename } },
          ],
        },
        select: {
          course: { select: { title_en: true, title_vi: true } },
          title_en: true,
          title_vi: true,
        },
        take: 10,
      }),
      this.prisma.event.findMany({
        where: { cover_image_url: { contains: filename } },
        select: { title: true },
        take: 10,
      }),
      this.prisma.eventSeries.findMany({
        where: { cover_image_url: { contains: filename } },
        select: { title: true },
        take: 10,
      }),
      this.prisma.profile.findMany({
        where: { avatar_url: { contains: filename } },
        select: { first_name: true, last_name: true },
        take: 5,
      }),
      this.prisma.activityEvidence.count({
        where: { image_url: { contains: filename } },
      }),
    ]);

    const usages: string[] = [];

    for (const page of pages) {
      const contentEn = typeof page.content_json_en === 'string' ? page.content_json_en : JSON.stringify(page.content_json_en ?? '');
      const contentVi = typeof page.content_json_vi === 'string' ? page.content_json_vi : JSON.stringify(page.content_json_vi ?? '');
      if (contentEn.includes(filename) || contentVi.includes(filename)) {
        if (page.slug === 'site-navigation' || page.route_path.includes('site-navigation')) {
          usages.push('navigation:/admin/navigation');
        } else {
          const title = page.title_vi || page.title_en || page.slug;
          usages.push(`page:${title} (${page.route_path})`);
        }
      }
    }

    for (const article of articles) {
      const title = article.title_vi || article.title_en || article.slug;
      usages.push(`article:${title} (/article/${article.slug})`);
    }

    for (const course of courses) {
      const title = course.title_vi || course.title_en || course.slug;
      usages.push(`course:${title} (/course/${course.slug})`);
    }

    for (const lesson of lessons) {
      const title = lesson.title_vi || lesson.title_en;
      const courseTitle = lesson.course?.title_vi || lesson.course?.title_en;
      usages.push(courseTitle ? `lesson:${title} (${courseTitle})` : `lesson:${title}`);
    }

    for (const event of events) {
      usages.push(`event:${event.title}`);
    }

    for (const series of eventSeries) {
      usages.push(`eventSeries:${series.title}`);
    }

    for (const profile of profiles) {
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
      usages.push(`profile:${name}`);
    }

    if (evidenceCount > 0) {
      usages.push(`evidence:${evidenceCount}`);
    }

    return usages;
  }

  async deleteImage(rawFilename: string): Promise<void> {
    const filename = sanitizeFilename(rawFilename);
    const driveMatch = filename.match(/^drive-([a-zA-Z0-9_-]{10,})\.[a-z0-9]+$/i);
    const usageNeedle = driveMatch?.[1] ?? filename;
    const usages = await this.findAssetUsages(usageNeedle);
    if (usages.length > 0) {
      throw new ConflictException({
        code: 'MEDIA_IN_USE',
        message: usages.join(' || '),
      });
    }
    await Promise.all([
      unlink(resolve(imageDirectory, filename)).catch(() => undefined),
      unlink(resolve(videoDirectory, filename)).catch(() => undefined),
    ]);
    await this.mutateIndex((index) => {
      delete index.items[filename];
    });
    this.storageUsageCache = null;
  }

  private async processVideo(file: UploadedMediaFile, rawFolder?: string): Promise<MediaUploadDto> {
    await mkdir(videoDirectory, { recursive: true });
    const folder = normalizeFolderName(rawFolder);

    const registerVideo = async (filename: string) => {
      await this.mutateIndex((index) => {
        if (folder && !index.folders.includes(folder)) {
          index.folders.push(folder);
        }
        index.items[filename] = {
          folder,
          originalName: file.originalname,
        };
      });
    };

    const fallbackToOriginal = async (): Promise<MediaUploadDto | null> => {
      if (file.mimetype !== 'video/mp4' && file.mimetype !== 'video/webm') {
        return null;
      }
      const ext = file.mimetype === 'video/webm' ? '.webm' : '.mp4';
      const fallbackFilename = `${randomUUID()}${ext}`;
      const fallbackPath = resolve(videoDirectory, fallbackFilename);
      await copyFile(file.path, fallbackPath);
      await registerVideo(fallbackFilename);
      return {
        filename: fallbackFilename,
        folder,
        mimeType: file.mimetype,
        originalName: file.originalname,
        size: (await stat(fallbackPath)).size,
        url: `/uploads/videos/${fallbackFilename}`,
      };
    };

    if (typeof ffmpegPath !== 'string') {
      const fallback = await fallbackToOriginal();
      if (fallback) return fallback;
      throw new InternalServerErrorException('Video processing is unavailable.');
    }

    const binaryPath = ffmpegPath;
    await chmod(binaryPath, 0o755).catch(() => undefined);

    const filename = `${randomUUID()}.mp4`;
    const outputPath = resolve(videoDirectory, filename);

    try {
      await new Promise<void>((resolvePromise, rejectPromise) => {
        const ffmpegProcess = spawn(
          binaryPath,
          [
            '-i', file.path,
            '-map_metadata', '-1',
            '-vf', 'scale=min(1920\\,iw):min(1080\\,ih):force_original_aspect_ratio=decrease:force_divisible_by=2',
            '-pix_fmt', 'yuv420p',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '26',
            '-profile:v', 'main',
            '-level', '4.0',
            '-threads', '2',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-y', outputPath,
          ],
          { stdio: ['ignore', 'ignore', 'pipe'] },
        );
        let errorOutput = '';

        ffmpegProcess.stderr.on('data', (chunk: Buffer) => {
          errorOutput = `${errorOutput}${chunk.toString()}`.slice(-2000);
        });
        ffmpegProcess.on('error', rejectPromise);
        ffmpegProcess.on('close', (code: number | null) => {
          if (code === 0) resolvePromise();
          else rejectPromise(new Error(errorOutput || `ffmpeg exited with code ${code ?? 'unknown'}.`));
        });
      });

      await registerVideo(filename);
      return {
        filename,
        folder,
        mimeType: 'video/mp4',
        originalName: file.originalname,
        size: (await stat(outputPath)).size,
        url: `/uploads/videos/${filename}`,
      };
    } catch (error) {
      await unlink(outputPath).catch(() => undefined);
      this.logger.warn(
        `ffmpeg compression failed (${error instanceof Error ? error.message.slice(0, 300) : String(error)})`,
      );
      const fallback = await fallbackToOriginal();
      if (fallback) return fallback;
      throw new BadRequestException('Video compression failed. Ensure the file uses a supported video codec.');
    }
  }
}
