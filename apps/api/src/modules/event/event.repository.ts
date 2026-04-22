import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type {
  CreateEventDto,
  EventDto,
  EventListDto,
  EventListResult,
  UpdateEventDto,
} from './event.types';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: { status?: string; upcoming?: boolean },
    skip: number,
    take: number,
  ): Promise<EventListResult> {
    const where = {
      deleted_at: null,
      ...(filters.status !== undefined && { status: filters.status }),
      ...(filters.upcoming === true && { starts_at: { gte: new Date() } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        orderBy: { starts_at: 'asc' },
        skip,
        take,
        where,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: items.map(
        (e): EventListDto => ({
          audience: e.audience,
          cover_image_url: e.cover_image_url,
          ends_at: e.ends_at.toISOString(),
          id: e.id,
          location: e.location,
          slug: e.slug,
          starts_at: e.starts_at.toISOString(),
          status: e.status,
          title: e.title,
        }),
      ),
      total,
    };
  }

  async findBySlug(slug: string): Promise<EventDto | null> {
    const e = await this.prisma.event.findUnique({
      include: { category: true, creator: true },
      where: { slug, deleted_at: null },
    });

    if (!e) return null;

    return {
      audience: e.audience,
      category: e.category ? { id: e.category.id, name: e.category.name } : null,
      cover_image_url: e.cover_image_url,
      created_at: e.created_at.toISOString(),
      creator: { id: e.creator.id, username: e.creator.username },
      description: e.description,
      ends_at: e.ends_at.toISOString(),
      id: e.id,
      location: e.location,
      slug: e.slug,
      starts_at: e.starts_at.toISOString(),
      status: e.status,
      title: e.title,
    };
  }

  async create(dto: CreateEventDto, creatorId: string): Promise<EventDto> {
    const e = await this.prisma.event.create({
      data: {
        audience: dto.audience ?? 'public',
        category_id: dto.category_id,
        cover_image_url: dto.cover_image_url,
        created_by: creatorId,
        description: dto.description,
        ends_at: new Date(dto.ends_at),
        location: dto.location,
        slug: dto.slug,
        starts_at: new Date(dto.starts_at),
        title: dto.title,
      },
      include: { category: true, creator: true },
    });

    return {
      audience: e.audience,
      category: e.category ? { id: e.category.id, name: e.category.name } : null,
      cover_image_url: e.cover_image_url,
      created_at: e.created_at.toISOString(),
      creator: { id: e.creator.id, username: e.creator.username },
      description: e.description,
      ends_at: e.ends_at.toISOString(),
      id: e.id,
      location: e.location,
      slug: e.slug,
      starts_at: e.starts_at.toISOString(),
      status: e.status,
      title: e.title,
    };
  }

  async update(slug: string, dto: UpdateEventDto): Promise<EventDto | null> {
    const e = await this.prisma.event.update({
      data: {
        ...dto,
        ...(dto.starts_at !== undefined && { starts_at: new Date(dto.starts_at) }),
        ...(dto.ends_at !== undefined && { ends_at: new Date(dto.ends_at) }),
      },
      include: { category: true, creator: true },
      where: { slug },
    });

    return {
      audience: e.audience,
      category: e.category ? { id: e.category.id, name: e.category.name } : null,
      cover_image_url: e.cover_image_url,
      created_at: e.created_at.toISOString(),
      creator: { id: e.creator.id, username: e.creator.username },
      description: e.description,
      ends_at: e.ends_at.toISOString(),
      id: e.id,
      location: e.location,
      slug: e.slug,
      starts_at: e.starts_at.toISOString(),
      status: e.status,
      title: e.title,
    };
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.event.update({
      data: { deleted_at: new Date() },
      where: { slug },
    });
  }
}
