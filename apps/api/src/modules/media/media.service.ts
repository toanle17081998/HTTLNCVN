import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import ffmpegPath from 'ffmpeg-static';
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

import type {
  MediaGalleryItemDto,
  MediaGalleryResponseDto,
  MediaUploadDto,
  UploadedMediaFile,
} from './media.types';

const imageDirectory = resolve(process.cwd(), 'uploads', 'images');
const videoDirectory = resolve(process.cwd(), 'uploads', 'videos');
const galleryIndexPath = resolve(imageDirectory, '.gallery.json');

const IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);

type GalleryIndexItem = {
  folder: string;
  height?: number;
  originalName?: string;
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
  private indexWriteChain: Promise<void> = Promise.resolve();

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

  async process(file: UploadedMediaFile, rawFolder?: string): Promise<MediaUploadDto> {
    try {
      if (file.mimetype.startsWith('image/') && file.size > 25 * 1024 * 1024) {
        throw new BadRequestException('Images must be 25 MB or smaller.');
      }
      return file.mimetype.startsWith('image/')
        ? await this.processImage(file, rawFolder)
        : await this.processVideo(file);
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
    await mkdir(imageDirectory, { recursive: true });
    const [index, entries] = await Promise.all([
      this.readIndex(),
      readdir(imageDirectory, { withFileTypes: true }),
    ]);

    const imageFiles = entries
      .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
      .map((entry) => entry.name);

    const statResults = await Promise.all(
      imageFiles.map(async (filename): Promise<MediaGalleryItemDto | null> => {
        try {
          const info = await stat(resolve(imageDirectory, filename));
          const meta = index.items[filename];
          return {
            filename,
            folder: meta?.folder ?? '',
            height: meta?.height,
            originalName: meta?.originalName || filename,
            size: info.size,
            updatedAt: info.mtime.toISOString(),
            url: `/uploads/images/${filename}`,
            width: meta?.width,
          };
        } catch {
          return null;
        }
      }),
    );

    const allItems = statResults
      .filter((item): item is MediaGalleryItemDto => item !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

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

    const search = q?.trim().toLowerCase();
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

  async deleteImage(rawFilename: string): Promise<void> {
    const filename = sanitizeFilename(rawFilename);
    const targetPath = resolve(imageDirectory, filename);
    await unlink(targetPath).catch(() => undefined);
    await this.mutateIndex((index) => {
      delete index.items[filename];
    });
  }

  private async processVideo(file: UploadedMediaFile): Promise<MediaUploadDto> {
    if (typeof ffmpegPath !== 'string') {
      throw new InternalServerErrorException('Video processing is unavailable.');
    }
    const binaryPath = ffmpegPath;

    await mkdir(videoDirectory, { recursive: true });
    const filename = `${randomUUID()}.webm`;
    const outputPath = resolve(videoDirectory, filename);

    await new Promise<void>((resolvePromise, rejectPromise) => {
      const ffmpegProcess = spawn(binaryPath, [
        '-i', file.path,
        '-map_metadata', '-1',
        '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
        '-c:v', 'libvpx-vp9',
        '-crf', '32',
        '-b:v', '0',
        '-deadline', 'good',
        '-cpu-used', '4',
        '-c:a', 'libopus',
        '-b:a', '96k',
        '-movflags', '+faststart',
        '-y', outputPath,
      ], { stdio: ['ignore', 'ignore', 'pipe'] });
      let errorOutput = '';

      ffmpegProcess.stderr.on('data', (chunk: Buffer) => {
        errorOutput = `${errorOutput}${chunk.toString()}`.slice(-2000);
      });
      ffmpegProcess.on('error', rejectPromise);
      ffmpegProcess.on('close', (code: number | null) => {
        if (code === 0) resolvePromise();
        else rejectPromise(new Error(errorOutput || `ffmpeg exited with code ${code ?? 'unknown'}.`));
      });
    }).catch(async () => {
      await unlink(outputPath).catch(() => undefined);
      throw new BadRequestException('Video compression failed. Ensure the file uses a supported video codec.');
    });

    return {
      mimeType: 'video/webm',
      originalName: file.originalname,
      size: (await stat(outputPath)).size,
      url: `/uploads/videos/${filename}`,
    };
  }
}
