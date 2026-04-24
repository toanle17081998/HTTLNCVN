import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrayerVisibility as PrismaVisibility, PrayerStatus as PrismaStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  CreatePrayerDto,
  PrayerCategoryDto,
  PrayerDto,
  PrayerListResult,
  PrayerJournalMetaDto,
  PrayerMemberDto,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

const MANAGER_ROLES = new Set(['church_admin', 'system_admin']);

function toMemberDto(member: {
  id: string;
  username: string;
  profile: { first_name: string; last_name: string } | null;
}): PrayerMemberDto {
  const displayName = [member.profile?.first_name, member.profile?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    display_name: displayName || member.username,
    id: member.id,
    username: member.username,
  };
}

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
  creator: {
    id: string;
    username: string;
    profile: { first_name: string; last_name: string } | null;
  };
  category: { id: number; name: string } | null;
  shared_with: Array<{
    user: {
      id: string;
      username: string;
      profile: { first_name: string; last_name: string } | null;
    };
  }>;
}): PrayerDto {
  return {
    category: p.category ? { id: p.category.id, name: p.category.name } : null,
    close_reason: p.close_reason,
    closed_at: p.closed_at?.toISOString() ?? null,
    content: p.content,
    created_at: p.created_at.toISOString(),
    created_by: p.created_by,
    created_by_name: toMemberDto(p.creator).display_name,
    id: p.id,
    shared_with: p.shared_with.map((entry) => toMemberDto(entry.user)),
    status: p.status,
    title: p.title,
    updated_at: p.updated_at.toISOString(),
    visibility: p.visibility,
  };
}

const PRAYER_INCLUDE = {
  category: true,
  creator: {
    select: {
      id: true,
      profile: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      username: true,
    },
  },
  shared_with: {
    include: {
      user: {
        select: {
          id: true,
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
          username: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class PrayerJournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMeta(userId: string): Promise<PrayerJournalMetaDto> {
    const [categories, members] = await this.prisma.$transaction([
      this.prisma.prayerCategory.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      this.prisma.user.findMany({
        include: {
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: [{ username: 'asc' }],
        where: {
          deleted_at: null,
          id: { not: userId },
          status: 'active',
        },
      }),
    ]);

    return {
      categories: categories.map((category): PrayerCategoryDto => ({
        id: category.id,
        name: category.name,
      })),
      members: members.map(toMemberDto),
    };
  }

  async findForUser(userId: string, skip: number, take: number): Promise<PrayerListResult> {
    const where: Prisma.PrayerWhereInput = {
      OR: [
        { created_by: userId },
        { shared_with: { some: { user_id: userId } } },
        { visibility: 'public' },
      ],
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.prayer.findMany({
        include: PRAYER_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take,
        where,
      }),
      this.prisma.prayer.count({ where }),
    ]);

    return { items: items.map((item) => toDto(item)), total };
  }

  async findById(id: string, userId: string): Promise<PrayerDto | null> {
    const p = await this.prisma.prayer.findUnique({
      include: PRAYER_INCLUDE,
      where: { id },
    });

    if (!p) return null;

    const isOwner = p.created_by === userId;
    const isShared = p.shared_with.some((share) => share.user.id === userId);
    const canRead = isOwner || isShared || p.visibility === 'public';

    if (!canRead) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }

    return toDto(p);
  }

  async create(dto: CreatePrayerDto, userId: string): Promise<PrayerDto> {
    const shareUserIds = [...new Set(dto.shared_with_user_ids ?? [])];
    const p = await this.prisma.prayer.create({
      data: {
        category_id: dto.category_id,
        content: dto.content,
        created_by: userId,
        title: dto.title,
        visibility: dto.visibility ?? 'private',
        ...(shareUserIds.length > 0 && {
          shared_with: {
            createMany: {
              data: shareUserIds.map((memberId) => ({ user_id: memberId })),
            },
          },
        }),
      },
      include: PRAYER_INCLUDE,
    });

    return toDto(p);
  }

  async update(id: string, dto: UpdatePrayerDto, userId: string, userRole: string): Promise<PrayerDto> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId && !MANAGER_ROLES.has(userRole)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }

    const nextVisibility = dto.visibility ?? existing.visibility;
    const shareUserIds = dto.shared_with_user_ids
      ? [...new Set(dto.shared_with_user_ids)]
      : null;

    const p = await this.prisma.$transaction(async (tx) => {
      await tx.prayer.update({
        data: {
          ...(dto.content !== undefined && { content: dto.content }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.visibility !== undefined && { visibility: dto.visibility }),
          ...(dto.category_id !== undefined && { category_id: dto.category_id }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.close_reason !== undefined && { close_reason: dto.close_reason }),
          ...(dto.status === 'closed' && { closed_at: new Date() }),
          ...(dto.status === 'open' && { close_reason: null, closed_at: null }),
        },
        where: { id },
      });

      if (nextVisibility !== 'shared') {
        await tx.prayerShare.deleteMany({ where: { prayer_id: id } });
      } else if (shareUserIds) {
        await tx.prayerShare.deleteMany({ where: { prayer_id: id } });
        if (shareUserIds.length > 0) {
          await tx.prayerShare.createMany({
            data: shareUserIds.map((memberId) => ({
              prayer_id: id,
              user_id: memberId,
            })),
          });
        }
      }

      return tx.prayer.findUniqueOrThrow({
        include: PRAYER_INCLUDE,
        where: { id },
      });
    });

    return toDto(p);
  }

  async delete(id: string, userId: string, userRole: string): Promise<void> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId && !MANAGER_ROLES.has(userRole)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }

    await this.prisma.prayer.delete({ where: { id } });
  }

  async share(id: string, dto: SharePrayerDto, userId: string, userRole: string): Promise<void> {
    const existing = await this.prisma.prayer.findUnique({ where: { id } });

    if (!existing) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    if (existing.created_by !== userId && !MANAGER_ROLES.has(userRole)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Access denied.' });
    }

    const shareUserIds = [...new Set(dto.userIds)];

    await this.prisma.$transaction([
      this.prisma.prayer.update({
        data: { visibility: 'shared' },
        where: { id },
      }),
      this.prisma.prayerShare.deleteMany({ where: { prayer_id: id } }),
      ...(shareUserIds.length > 0
        ? [
            this.prisma.prayerShare.createMany({
              data: shareUserIds.map((memberId) => ({
                prayer_id: id,
                user_id: memberId,
              })),
            }),
          ]
        : []),
    ]);
  }

  async categoryExists(categoryId: number): Promise<boolean> {
    const category = await this.prisma.prayerCategory.findUnique({
      select: { id: true },
      where: { id: categoryId },
    });

    return Boolean(category);
  }

  async countMembersByIds(memberIds: string[]): Promise<number> {
    return this.prisma.user.count({
      where: {
        deleted_at: null,
        id: { in: memberIds },
      },
    });
  }
}
