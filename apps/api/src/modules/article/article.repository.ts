import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  ArticleDto,
  ArticleListDto,
  ArticleListResult,
  CreateArticleDto,
  UpdateArticleDto,
} from './article.types';

@Injectable()
export class ArticleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: { category_id?: number; status?: string },
    skip: number,
    take: number,
  ): Promise<ArticleListResult> {
    const where = {
      deleted_at: null,
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.category_id !== undefined && { category_id: filters.category_id }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        include: { category: true, creator: true },
        orderBy: { published_at: 'desc' },
        skip,
        take,
        where,
      }),
      this.prisma.article.count({ where }),
    ]);

    return {
      items: items.map(
        (a): ArticleListDto => ({
          category: a.category ? { id: a.category.id, name: a.category.name } : null,
          cover_image_url: a.cover_image_url,
          creator: { id: a.creator.id, username: a.creator.username },
          id: a.id,
          published_at: a.published_at?.toISOString() ?? null,
          slug: a.slug,
          status: a.status,
          title_en: a.title_en,
          title_vi: a.title_vi,
        }),
      ),
      total,
    };
  }

  async findBySlug(slug: string): Promise<ArticleDto | null> {
    const a = await this.prisma.article.findUnique({
      include: { category: true, creator: true },
      where: { slug, deleted_at: null },
    });

    if (!a) return null;

    return {
      category: a.category ? { id: a.category.id, name: a.category.name } : null,
      content_markdown_en: a.content_markdown_en,
      content_markdown_vi: a.content_markdown_vi,
      cover_image_url: a.cover_image_url,
      created_at: a.created_at.toISOString(),
      creator: { id: a.creator.id, username: a.creator.username },
      id: a.id,
      published_at: a.published_at?.toISOString() ?? null,
      slug: a.slug,
      status: a.status,
      title_en: a.title_en,
      title_vi: a.title_vi,
      updated_at: a.updated_at.toISOString(),
    };
  }

  async create(dto: CreateArticleDto, creatorId: string): Promise<ArticleDto> {
    const a = await this.prisma.article.create({
      data: {
        category_id: dto.category_id,
        content_markdown_en: dto.content_markdown_en,
        content_markdown_vi: dto.content_markdown_vi,
        cover_image_url: dto.cover_image_url,
        created_by: creatorId,
        slug: dto.slug,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
      include: { category: true, creator: true },
    });

    return {
      category: a.category ? { id: a.category.id, name: a.category.name } : null,
      content_markdown_en: a.content_markdown_en,
      content_markdown_vi: a.content_markdown_vi,
      cover_image_url: a.cover_image_url,
      created_at: a.created_at.toISOString(),
      creator: { id: a.creator.id, username: a.creator.username },
      id: a.id,
      published_at: a.published_at?.toISOString() ?? null,
      slug: a.slug,
      status: a.status,
      title_en: a.title_en,
      title_vi: a.title_vi,
      updated_at: a.updated_at.toISOString(),
    };
  }

  async update(slug: string, dto: UpdateArticleDto): Promise<ArticleDto | null> {
    const a = await this.prisma.article.update({
      data: {
        ...dto,
        ...(dto.status === 'published' && { published_at: new Date() }),
      },
      include: { category: true, creator: true },
      where: { slug },
    });

    return {
      category: a.category ? { id: a.category.id, name: a.category.name } : null,
      content_markdown_en: a.content_markdown_en,
      content_markdown_vi: a.content_markdown_vi,
      cover_image_url: a.cover_image_url,
      created_at: a.created_at.toISOString(),
      creator: { id: a.creator.id, username: a.creator.username },
      id: a.id,
      published_at: a.published_at?.toISOString() ?? null,
      slug: a.slug,
      status: a.status,
      title_en: a.title_en,
      title_vi: a.title_vi,
      updated_at: a.updated_at.toISOString(),
    };
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.article.update({
      data: { deleted_at: new Date() },
      where: { slug },
    });
  }

  async findCategories(): Promise<{ id: number; name: string }[]> {
    return this.prisma.articleCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
