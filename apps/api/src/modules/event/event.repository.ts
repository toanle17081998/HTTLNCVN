import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import type {
  CreateEventCategoryDto,
  CreateEventDto,
  EventCategoryDto,
  EventChurchUnitDto,
  EventDto,
  EventListResult,
  EventMemberDto,
  EventMetaDto,
  UpdateEventCategoryDto,
  UpdateEventDto,
} from './event.types';
import {
  DEFAULT_EVENT_AUDIENCES,
  DEFAULT_EVENT_REPEATS,
  DEFAULT_EVENT_STATUSES,
} from './event.types';

const EVENT_INCLUDE = {
  attendees: {
    include: {
      user: {
        include: {
          profile: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      user: {
        username: 'asc',
      },
    },
  },
  category: true,
  church_unit_targets: {
    include: {
      church_unit: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    },
    orderBy: {
      church_unit: {
        name: 'asc',
      },
    },
  },
  creator: {
    select: {
      id: true,
      username: true,
    },
  },
} as const;

function toMemberDto(member: {
  id: string;
  profile: { first_name: string; last_name: string } | null;
  username: string;
}): EventMemberDto {
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

function toChurchUnitDto(unit: { id: string; name: string; type: string }): EventChurchUnitDto {
  return {
    id: unit.id,
    name: unit.name,
    type: unit.type,
  };
}

function toCategoryDto(category: {
  description: string | null;
  id: number;
  name: string;
}): EventCategoryDto {
  return {
    description: category.description,
    id: category.id,
    name: category.name,
  };
}

function toEventDto(event: {
  attendees: Array<{
    user: {
      id: string;
      profile: { first_name: string; last_name: string } | null;
      username: string;
    };
  }>;
  audience: string;
  category: { description: string | null; id: number; name: string } | null;
  church_unit_targets: Array<{
    church_unit: { id: string; name: string; type: string };
  }>;
  color: string | null;
  cover_image_url: string | null;
  created_at: Date;
  creator: { id: string; username: string };
  description: string | null;
  ends_at: Date;
  id: string;
  location: string | null;
  repeat: string;
  slug: string;
  starts_at: Date;
  status: string;
  title: string;
  updated_at: Date;
}): EventDto {
  return {
    audience: event.audience,
    category: event.category ? toCategoryDto(event.category) : null,
    color: event.color,
    cover_image_url: event.cover_image_url,
    created_at: event.created_at.toISOString(),
    creator: event.creator,
    description: event.description,
    ends_at: event.ends_at.toISOString(),
    id: event.id,
    location: event.location,
    repeat: event.repeat,
    slug: event.slug,
    starts_at: event.starts_at.toISOString(),
    status: event.status,
    target_church_units: event.church_unit_targets.map((target) => toChurchUnitDto(target.church_unit)),
    target_users: event.attendees.map((attendance) => toMemberDto(attendance.user)),
    title: event.title,
    updated_at: event.updated_at.toISOString(),
  };
}

function buildVisibilityWhere(viewerId?: string): Prisma.EventWhereInput {
  if (!viewerId) {
    return { audience: 'public' };
  }

  return {
    OR: [
      { audience: 'public' },
      { audience: 'church' },
      {
        audience: 'church_unit',
        church_unit_targets: {
          some: {
            church_unit: {
              members: {
                some: {
                  user_id: viewerId,
                },
              },
            },
          },
        },
      },
      {
        audience: 'people',
        attendees: {
          some: {
            user_id: viewerId,
          },
        },
      },
    ],
  };
}

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMeta(): Promise<EventMetaDto> {
    const [categories, churchUnits, members] = await this.prisma.$transaction([
      this.prisma.eventCategory.findMany({
        orderBy: [{ name: 'asc' }],
      }),
      this.prisma.churchUnit.findMany({
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          type: true,
        },
        where: {
          is_active: true,
        },
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
          status: 'active',
        },
      }),
    ]);

    return {
      audiences: [...DEFAULT_EVENT_AUDIENCES],
      categories: categories.map(toCategoryDto),
      church_units: churchUnits.map(toChurchUnitDto),
      members: members.map(toMemberDto),
      repeats: [...DEFAULT_EVENT_REPEATS],
      statuses: [...DEFAULT_EVENT_STATUSES],
    };
  }

  async findAll(
    filters: { audience?: string; category_id?: number; q?: string; status?: string; upcoming?: boolean },
    skip: number,
    take: number,
    viewerId?: string,
  ): Promise<EventListResult> {
    const and: Prisma.EventWhereInput[] = [buildVisibilityWhere(viewerId), { deleted_at: null }];

    if (filters.audience !== undefined) {
      and.push({ audience: filters.audience });
    }

    if (filters.category_id !== undefined) {
      and.push({ category_id: filters.category_id });
    }

    if (filters.status !== undefined) {
      and.push({ status: filters.status });
    }

    if (filters.upcoming === true) {
      and.push({ starts_at: { gte: new Date() } });
    }

    if (filters.q) {
      and.push({
        OR: [
          { title: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
          { location: { contains: filters.q, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    const where: Prisma.EventWhereInput = { AND: and };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        include: EVENT_INCLUDE,
        orderBy: [{ starts_at: 'asc' }, { title: 'asc' }],
        skip,
        take,
        where,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      items: items.map((item) => toEventDto(item)),
      total,
    };
  }

  async findBySlug(slug: string, viewerId?: string): Promise<EventDto | null> {
    const event = await this.prisma.event.findFirst({
      include: EVENT_INCLUDE,
      where: {
        AND: [
          { deleted_at: null },
          { slug },
          buildVisibilityWhere(viewerId),
        ],
      },
    });

    return event ? toEventDto(event) : null;
  }

  async findBySlugForWrite(slug: string): Promise<EventDto | null> {
    const event = await this.prisma.event.findFirst({
      include: EVENT_INCLUDE,
      where: {
        deleted_at: null,
        slug,
      },
    });

    return event ? toEventDto(event) : null;
  }

  createCategory(dto: CreateEventCategoryDto): Promise<EventCategoryDto> {
    return this.prisma.eventCategory
      .create({
        data: {
          description: dto.description?.trim() || null,
          name: dto.name.trim(),
        },
      })
      .then(toCategoryDto);
  }

  updateCategory(id: number, dto: UpdateEventCategoryDto): Promise<EventCategoryDto | null> {
    return this.prisma.eventCategory
      .update({
        data: {
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.name !== undefined && { name: dto.name.trim() }),
        },
        where: { id },
      })
      .then(toCategoryDto);
  }

  async deleteCategory(id: number): Promise<void> {
    await this.prisma.eventCategory.delete({ where: { id } });
  }

  async categoryExists(id: number): Promise<boolean> {
    const category = await this.prisma.eventCategory.findUnique({
      select: { id: true },
      where: { id },
    });

    return Boolean(category);
  }

  async countUsersByIds(userIds: string[]): Promise<number> {
    return this.prisma.user.count({
      where: {
        deleted_at: null,
        id: { in: userIds },
        status: 'active',
      },
    });
  }

  countChurchUnitsByIds(churchUnitIds: string[]): Promise<number> {
    return this.prisma.churchUnit.count({
      where: {
        id: { in: churchUnitIds },
      },
    });
  }

  async create(dto: CreateEventDto, creatorId: string): Promise<EventDto> {
    const churchUnitIds = [...new Set(dto.church_unit_ids ?? [])];
    const userIds = [...new Set(dto.user_ids ?? [])];

    const event = await this.prisma.event.create({
      data: {
        audience: dto.audience ?? 'public',
        category_id: dto.category_id ?? null,
        color: dto.color ?? null,
        cover_image_url: dto.cover_image_url ?? null,
        created_by: creatorId,
        description: dto.description?.trim() || null,
        ends_at: new Date(dto.ends_at),
        location: dto.location?.trim() || null,
        repeat: dto.repeat ?? 'none',
        slug: dto.slug.trim(),
        starts_at: new Date(dto.starts_at),
        status: dto.status ?? 'published',
        title: dto.title.trim(),
        ...(churchUnitIds.length > 0 && {
          church_unit_targets: {
            createMany: {
              data: churchUnitIds.map((churchUnitId) => ({ church_unit_id: churchUnitId })),
            },
          },
        }),
        ...(userIds.length > 0 && {
          attendees: {
            createMany: {
              data: userIds.map((userId) => ({ user_id: userId })),
            },
          },
        }),
      },
      include: EVENT_INCLUDE,
    });

    return toEventDto(event);
  }

  async update(slug: string, dto: UpdateEventDto): Promise<EventDto | null> {
    const churchUnitIds =
      dto.church_unit_ids !== undefined ? [...new Set(dto.church_unit_ids)] : undefined;
    const userIds = dto.user_ids !== undefined ? [...new Set(dto.user_ids)] : undefined;

    const event = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({
        select: { id: true },
        where: { slug },
      });

      if (!existing) {
        return null;
      }

      await tx.event.update({
        data: {
          ...(dto.audience !== undefined && { audience: dto.audience }),
          ...(dto.category_id !== undefined && { category_id: dto.category_id ?? null }),
          ...(dto.color !== undefined && { color: dto.color ?? null }),
          ...(dto.cover_image_url !== undefined && { cover_image_url: dto.cover_image_url ?? null }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.ends_at !== undefined && { ends_at: new Date(dto.ends_at) }),
          ...(dto.location !== undefined && { location: dto.location?.trim() || null }),
          ...(dto.repeat !== undefined && { repeat: dto.repeat }),
          ...(dto.slug !== undefined && { slug: dto.slug.trim() }),
          ...(dto.starts_at !== undefined && { starts_at: new Date(dto.starts_at) }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
        },
        where: { id: existing.id },
      });

      if (churchUnitIds !== undefined) {
        await tx.eventChurchUnitTarget.deleteMany({ where: { event_id: existing.id } });
        if (churchUnitIds.length > 0) {
          await tx.eventChurchUnitTarget.createMany({
            data: churchUnitIds.map((churchUnitId) => ({
              church_unit_id: churchUnitId,
              event_id: existing.id,
            })),
          });
        }
      }

      if (userIds !== undefined) {
        await tx.eventAttendance.deleteMany({ where: { event_id: existing.id } });
        if (userIds.length > 0) {
          await tx.eventAttendance.createMany({
            data: userIds.map((userId) => ({
              event_id: existing.id,
              user_id: userId,
            })),
          });
        }
      }

      return tx.event.findUnique({
        include: EVENT_INCLUDE,
        where: { id: existing.id },
      });
    });

    return event ? toEventDto(event) : null;
  }

  async delete(slug: string): Promise<void> {
    await this.prisma.event.update({
      data: { deleted_at: new Date() },
      where: { slug },
    });
  }
}
