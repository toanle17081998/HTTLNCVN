import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import ffmpegPath from 'ffmpeg-static';
import { randomUUID } from 'node:crypto';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

import type { MediaUploadDto, UploadedMediaFile } from './media.types';

const imageDirectory = resolve(process.cwd(), 'uploads', 'images');
const videoDirectory = resolve(process.cwd(), 'uploads', 'videos');

@Injectable()
export class MediaService {
  async process(file: UploadedMediaFile): Promise<MediaUploadDto> {
    try {
      if (file.mimetype.startsWith('image/') && file.size > 25 * 1024 * 1024) {
        throw new BadRequestException('Images must be 25 MB or smaller.');
      }
      return file.mimetype.startsWith('image/')
        ? await this.processImage(file)
        : await this.processVideo(file);
    } finally {
      await unlink(file.path).catch(() => undefined);
    }
  }

  private async processImage(file: UploadedMediaFile): Promise<MediaUploadDto> {
    await mkdir(imageDirectory, { recursive: true });
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

    return {
      height,
      mimeType: 'image/webp',
      originalName: file.originalname,
      size,
      url: `/uploads/images/${filename}`,
      width,
    };
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
