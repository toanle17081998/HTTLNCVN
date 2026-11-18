import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { Permissions } from '../../common/decorators/permissions.decorator';
import { MediaService } from './media.service';
import type { MediaUploadDto, UploadedMediaFile } from './media.types';

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

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Permissions(
    { action: 'create', resource: 'article' },
    { action: 'create', resource: 'course' },
    { action: 'create', resource: 'event' },
    { action: 'update', resource: 'landing_page' },
  )
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
  ): Promise<MediaUploadDto> {
    if (!file) {
      throw new BadRequestException('A media file is required.');
    }

    return this.mediaService.process(file);
  }
}
