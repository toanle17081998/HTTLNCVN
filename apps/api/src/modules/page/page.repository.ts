import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  CreatePageDto,
  PageDto,
  PageListDto,
  PageListResult,
  UpdatePageDto,
} from './page.types';

@Injectable()
export class PageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string): Promise<PageListResult> {
    const items = await this.prisma.page.findMany({
      where: {
        deleted_at: null,
        ...(status ? { status } : {}),
      },
      orderBy: { updated_at: 'desc' },
    });

    return {
      items: items.map(
        (page): PageListDto => ({
          id: page.id,
          route_path: page.route_path,
          slug: page.slug,
          status: page.status as PageDto['status'],
          title_en: page.title_en,
          title_vi: page.title_vi,
          updated_at: page.updated_at.toISOString(),
        }),
      ),
    };
  }

  async findBySlug(slug: string): Promise<PageDto | null> {
    const page = await this.prisma.page.findFirst({
      where: { deleted_at: null, slug },
    });

    return page ? this.toDto(page) : null;
  }

  async findByPath(path: string): Promise<PageDto | null> {
    const page = await this.prisma.page.findFirst({
      where: {
        deleted_at: null,
        route_path: this.normalizeRoutePath(path),
        status: 'published',
      },
    });

    return page ? this.toDto(page) : null;
  }

  async create(dto: CreatePageDto, creatorId: string): Promise<PageDto> {
    const page = await this.prisma.page.create({
      data: {
        content_json_en: this.parseContent(dto.content_en),
        content_json_vi: this.parseContent(dto.content_vi),
        created_by: creatorId || null,
        route_path: this.normalizeRoutePath(dto.route_path),
        slug: dto.slug,
        title_en: dto.title_en,
        title_vi: dto.title_vi,
      },
    });

    return this.toDto(page);
  }

  async update(slug: string, dto: UpdatePageDto): Promise<PageDto | null> {
    const existing = await this.prisma.page.findFirst({
      where: { deleted_at: null, slug },
    });

    if (!existing) return null;

    const page = await this.prisma.page.update({
      where: { id: existing.id },
      data: {
        ...(dto.content_en !== undefined ? { content_json_en: this.parseContent(dto.content_en) } : {}),
        ...(dto.content_vi !== undefined ? { content_json_vi: this.parseContent(dto.content_vi) } : {}),
        ...(dto.route_path !== undefined
          ? { route_path: this.normalizeRoutePath(dto.route_path) }
          : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.title_en !== undefined ? { title_en: dto.title_en } : {}),
        ...(dto.title_vi !== undefined ? { title_vi: dto.title_vi } : {}),
      },
    });

    return this.toDto(page);
  }

  async remove(slug: string): Promise<void> {
    const existing = await this.prisma.page.findFirst({
      where: { deleted_at: null, slug },
      select: { id: true },
    });

    if (!existing) return;

    await this.prisma.page.update({
      where: { id: existing.id },
      data: { deleted_at: new Date() },
    });
  }

  private normalizeRoutePath(path: string) {
    const trimmed = path.trim();
    if (!trimmed || trimmed === '/') return '/';
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  private parseContent(content: string) {
    try {
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private toDto(page: {
    content_json_en: unknown;
    content_json_vi: unknown;
    created_at: Date;
    id: string;
    route_path: string;
    slug: string;
    status: string;
    title_en: string;
    title_vi: string;
    updated_at: Date;
  }): PageDto {
    return {
      content_en: JSON.stringify(page.content_json_en),
      content_vi: JSON.stringify(page.content_json_vi),
      created_at: page.created_at.toISOString(),
      id: page.id,
      route_path: page.route_path,
      slug: page.slug,
      status: page.status as PageDto['status'],
      title_en: page.title_en,
      title_vi: page.title_vi,
      updated_at: page.updated_at.toISOString(),
    };
  }
}
