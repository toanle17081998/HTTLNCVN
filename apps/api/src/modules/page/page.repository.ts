import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { PageDto } from './page.types';

const PAGE_SLUGS = new Set(['home', 'about', 'contact', 'terms', 'privacy']);

@Injectable()
export class PageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(slug: string): Promise<PageDto | null> {
    if (!PAGE_SLUGS.has(slug)) return null;

    const a = await this.prisma.article.findUnique({
      where: { slug, deleted_at: null },
    });

    if (!a || a.status !== 'published') return null;

    return {
      content_markdown_en: a.content_markdown_en,
      content_markdown_vi: a.content_markdown_vi,
      cover_image_url: a.cover_image_url,
      id: a.id,
      slug: a.slug,
      title_en: a.title_en,
      title_vi: a.title_vi,
      updated_at: a.updated_at.toISOString(),
    };
  }
}
