import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { MediaService } from './media.service';
import type {
  MediaGalleryResponseDto,
  MediaStorageUsageDto,
  MediaUploadDto,
  UploadedMediaFile,
} from './media.types';

const tempDirectory = resolve(process.cwd(), 'uploads', '.tmp');
mkdirSync(tempDirectory, { recursive: true });

const acceptedMediaTypes = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/webm',
  'video/x-msvideo',
]);

const MEDIA_PERMISSIONS = [
  { action: 'create', resource: 'article' },
  { action: 'update', resource: 'article' },
  { action: 'create', resource: 'course' },
  { action: 'update', resource: 'course' },
  { action: 'create', resource: 'event' },
  { action: 'update', resource: 'event' },
  { action: 'update', resource: 'landing_page' },
] as const;

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Public()
  @Get('drive/:fileId')
  async streamDriveMedia(
    @Param('fileId') rawFileId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cleanId = rawFileId.replace(/\.[a-z0-9]+$/i, '');
    if (!/^[a-zA-Z0-9_-]{10,}$/.test(cleanId)) {
      res.status(400).send('Invalid Drive file id.');
      return;
    }

    const downloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(cleanId)}&export=download&confirm=t`;
    const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' };
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const controller = new AbortController();
    const onClose = () => controller.abort();
    req.once('close', onClose);

    try {
      const upstream = await fetch(downloadUrl, {
        headers,
        redirect: 'follow',
        signal: controller.signal,
      });
      if ((!upstream.ok && upstream.status !== 206) || !upstream.body) {
        req.off('close', onClose);
        res.status(404).send('Can not get the image/video');
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'video/mp4';
      if (contentType.includes('text/html')) {
        req.off('close', onClose);
        res.status(404).send('Can not get the image/video');
        return;
      }

      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);

      const stream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      stream.on('error', () => {
        if (!res.writableEnded) res.end();
      });
      res.once('finish', () => req.off('close', onClose));
      stream.pipe(res);
    } catch {
      req.off('close', onClose);
      if (!res.headersSent) {
        res.status(502).send('Can not get the image/video');
      } else if (!res.writableEnded) {
        res.end();
      }
    }
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Get('storage')
  getStorageUsage(): Promise<MediaStorageUsageDto> {
    return this.mediaService.getStorageUsage();
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Post('import-drive')
  importFromDrive(
    @Body() body: { folder?: string; url?: string },
  ): Promise<MediaUploadDto> {
    return this.mediaService.importFromGoogleDrive(body?.url ?? '', body?.folder);
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Get('gallery')
  listGallery(
    @Query('folder') folder?: string,
    @Query('q') q?: string,
  ): Promise<MediaGalleryResponseDto> {
    return this.mediaService.listGallery(folder, q);
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Post('folders')
  createFolder(@Body() body: { name: string }): Promise<{ name: string }> {
    return this.mediaService.createFolder(body?.name ?? '');
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Patch('folders/:name')
  renameFolder(
    @Param('name') name: string,
    @Body() body: { newName: string },
  ): Promise<{ name: string }> {
    return this.mediaService.renameFolder(decodeURIComponent(name), body?.newName ?? '');
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Delete('folders/:name')
  async deleteFolder(@Param('name') name: string): Promise<{ deleted: true }> {
    await this.mediaService.deleteFolder(decodeURIComponent(name));
    return { deleted: true };
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Patch('images/move')
  moveImages(@Body() body: { filenames: string[]; folder: string }): Promise<{ moved: number }> {
    return this.mediaService.moveImages(body?.filenames ?? [], body?.folder ?? '');
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Delete('images/:filename')
  async deleteImage(@Param('filename') filename: string): Promise<{ deleted: true }> {
    await this.mediaService.deleteImage(decodeURIComponent(filename));
    return { deleted: true };
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: tempDirectory,
      fileFilter: (_request, file, callback) => {
        callback(
          acceptedMediaTypes.has(file.mimetype)
            ? null
            : new BadRequestException('Only supported image and video files can be uploaded.'),
          acceptedMediaTypes.has(file.mimetype),
        );
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: UploadedMediaFile | undefined,
    @Body('folder') bodyFolder?: string,
    @Query('folder') queryFolder?: string,
  ): Promise<MediaUploadDto> {
    if (!file) {
      throw new BadRequestException('A media file is required.');
    }

    return this.mediaService.process(file, bodyFolder ?? queryFolder);
  }
}
