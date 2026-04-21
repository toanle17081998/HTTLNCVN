import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { PrayerVisibility as PrismaVisibility, PrayerStatus as PrismaStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  CreatePrayerDto,
  PrayerDto,
  PrayerListResult,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

function toDto(p: {
  id: string;
  title: string | null;
  content: string;
  visibility: PrismaVisibility;
  status: PrismaStatus;
  close_reason: string | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  category: { id: number; name: string } | null;
}): PrayerDto {
  return {
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    close_reason: p.close_reason,
    closed_at: p.closed_at?.toISOString() ?? null,
    content: p.content,
    created_at: p.created_at.toISOString(),
    created_by: p.created_by,
    id: p.id,
    status: p.status,
    title: p.title,
    updated_at: p.updated_at.toISOString(),
    visibility: p.visibility,
  };
}

@Injectable()
export class PrayerJournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string, skip: number, take: number): Promise<PrayerListResult> {
    const where = {
      OR: [{ created_by: userId }, { shared_with: { some: { user_id: userId } } }],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.prayer.findMany({
        include: { category: true },
        orderBy: { created_at: 'desc' },
        skip,
        take,
        where,
      }),
      this.prisma.prayer.count({ where }),
    ]);

    return { items: items.map(toDto), total };
  }

  async findById(id: string, userId: string): Promise<PrayerDto | null> {
    const p = await this.prisma.prayer.findUnique({
      include: { category: true },
      where: { id },
    });

    if (!p) return null;

    const isOwner = p.created_by === userId;
    const isShared = await this.prisma.prayerShare.findUnique({
      where: { prayer_id_user_id: { prayer_id: id, user_id: userId } },
    });

    if (!isOwner && !isShared && p.visibility === 'private') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }

    return toDto(p);
  }

  async create(dto: CreatePrayerDto, userId: string): Promise<PrayerDto> {
    const p = await this.prisma.prayer.create({
      data: {
        category_id: dto.category_id,
        content: dto.content,
        created_by: userId,
        title: dto.title,
        visibility: dto.visibility ?? 'private',
      },
      include: { category: true },
    });

    return toDto(p);
  }

  async update(id: string, dto: UpdatePrayerDto, userId: string): Promise<PrayerDto> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });

    const p = await this.prisma.prayer.update({
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.category_id !== undefined && { category_id: dto.category_id }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.close_reason !== undefined && { close_reason: dto.close_reason }),
        ...(dto.status === 'closed' && { closed_at: new Date() }),
      },
      include: { category: true },
      where: { id },
    });

    return toDto(p);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });

    await this.prisma.prayer.delete({ where: { id } });
  }

  async share(id: string, dto: SharePrayerDto, userId: string): Promise<void> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });

    await this.prisma.prayerShare.upsert({
      create: { prayer_id: id, user_id: dto.userId },
      update: {},
      where: { prayer_id_user_id: { prayer_id: id, user_id: dto.userId } },
    });
  }
}
