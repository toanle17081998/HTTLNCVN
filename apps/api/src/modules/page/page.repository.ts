import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
        ...(status === 'deleted'
          ? { deleted_at: { not: null } }
          : { deleted_at: null, ...(status ? { status } : {}) }),
      },
      orderBy: { updated_at: 'desc' },
    });

    return {
      items: items.map(
        (page): PageListDto => ({
          id: page.id,
          deleted_at: page.deleted_at?.toISOString() ?? null,
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
    try {
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
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async update(slug: string, dto: UpdatePageDto): Promise<PageDto | null> {
    const existing = await this.prisma.page.findFirst({
      where: { deleted_at: null, slug },
    });

    if (!existing) return null;

    try {
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
    } catch (error) {
      this.handleWriteError(error);
    }
  }

  async remove(slug: string): Promise<void> {
    const existing = await this.prisma.page.findFirst({
      where: { deleted_at: null, slug },
      select: { id: true },
    });

    if (!existing) return;

    await this.prisma.page.update({
      where: { id: existing.id },
      data: { deleted_at: new Date(), status: 'deleted' },
    });
  }

  async restore(id: string): Promise<PageDto | null> {
    return this.prisma.$transaction(async (transaction) => {
      const deletedPage = await transaction.page.findFirst({
        where: { deleted_at: { not: null }, id },
      });

      if (!deletedPage) return null;

      await transaction.page.updateMany({
        where: {
          deleted_at: null,
          id: { not: deletedPage.id },
          OR: [
            { route_path: deletedPage.route_path },
            { slug: deletedPage.slug },
          ],
        },
        data: { deleted_at: new Date(), status: 'deleted' },
      });

      const restoredPage = await transaction.page.update({
        where: { id: deletedPage.id },
        data: { deleted_at: null, status: 'published' },
      });

      return this.toDto(restoredPage);
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

  private handleWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
      const duplicateField = targets.includes('route_path') ? 'route path' : 'slug';

      throw new ConflictException({
        code: 'PAGE_ALREADY_EXISTS',
        message: `A page with that ${duplicateField} already exists.`,
      });
    }

    throw error;
  }

  private toDto(page: {
    content_json_en: unknown;
    content_json_vi: unknown;
    created_at: Date;
    deleted_at: Date | null;
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
      deleted_at: page.deleted_at?.toISOString() ?? null,
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
