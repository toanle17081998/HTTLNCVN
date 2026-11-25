import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { MediaService } from './media.service';
import type { MediaGalleryResponseDto, MediaUploadDto, UploadedMediaFile } from './media.types';

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
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFolder(@Param('name') name: string): Promise<void> {
    return this.mediaService.deleteFolder(decodeURIComponent(name));
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Patch('images/move')
  moveImages(@Body() body: { filenames: string[]; folder: string }): Promise<{ moved: number }> {
    return this.mediaService.moveImages(body?.filenames ?? [], body?.folder ?? '');
  }

  @Permissions(...MEDIA_PERMISSIONS)
  @Delete('images/:filename')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteImage(@Param('filename') filename: string): Promise<void> {
    return this.mediaService.deleteImage(decodeURIComponent(filename));
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
      limits: { fileSize: 250 * 1024 * 1024 },
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
