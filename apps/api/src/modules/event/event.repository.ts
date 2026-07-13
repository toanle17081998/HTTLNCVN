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
  series: {
    select: {
      id: true,
      repeat: true,
      slug: true,
    },
  },
} as const;

const RECURRING_OCCURRENCE_LIMIT = 60;

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

function buildOccurrenceSlug(baseSlug: string, startsAt: Date): string {
  const year = startsAt.getUTCFullYear();
  const month = String(startsAt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(startsAt.getUTCDate()).padStart(2, '0');
  const hour = String(startsAt.getUTCHours()).padStart(2, '0');
  const minute = String(startsAt.getUTCMinutes()).padStart(2, '0');
  return `${baseSlug}-${year}${month}${day}${hour}${minute}`;
}

function buildRecurringStarts(startsAt: Date, repeat: string): Date[] {
  if (repeat === 'none') {
    return [startsAt];
  }

  const occurrences: Date[] = [];
  let cursor = new Date(startsAt);

  while (occurrences.length < RECURRING_OCCURRENCE_LIMIT) {
    occurrences.push(new Date(cursor));

    switch (repeat) {
      case 'daily':
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        break;
      case 'weekly':
        cursor.setUTCDate(cursor.getUTCDate() + 7);
        break;
      case 'monthly':
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
        break;
      case 'weekdays':
        do {
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        } while (cursor.getUTCDay() === 0 || cursor.getUTCDay() === 6);
        break;
      default:
        return occurrences;
    }
  }

  return occurrences;
}

async function expandAudienceUserIds(
  prisma: PrismaService | Prisma.TransactionClient,
  audience: string | undefined,
  churchUnitIds: string[],
  userIds: string[],
): Promise<string[]> {
  if (audience !== 'church_unit' || churchUnitIds.length === 0) {
    return [...new Set(userIds)];
  }

  const units = await prisma.churchUnit.findMany({
    where: { id: { in: churchUnitIds } },
    select: {
      leader_id: true,
      members: { select: { user_id: true } },
    },
  });

  const expanded = [...userIds];
  for (const unit of units) {
    if (unit.leader_id) {
      expanded.push(unit.leader_id);
    }
    expanded.push(...unit.members.map((member) => member.user_id));
  }

  return [...new Set(expanded)];
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
  is_all_day: boolean;
  location: string | null;
  repeat: string;
  series: { id: string; repeat: string; slug: string } | null;
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
    is_all_day: event.is_all_day,
    location: event.location,
    repeat: event.series?.repeat ?? event.repeat,
    series: event.series,
    slug: event.slug,
    starts_at: event.starts_at.toISOString(),
    status: event.status,
    target_church_units: event.church_unit_targets.map((target) => toChurchUnitDto(target.church_unit)),
    target_users: event.attendees.map((attendance) => toMemberDto(attendance.user)),
    title: event.title,
    updated_at: event.updated_at.toISOString(),
  };
}

function buildVisibilityWhere(viewerId?: string, viewerRole?: string): Prisma.EventWhereInput {
  if (!viewerId) {
    return { audience: 'public' };
  }

  if (viewerRole === 'church_admin' || viewerRole === 'system_admin') {
    return {};
  }

  return {
    OR: [
      { audience: 'public' },
      { audience: 'church' },
      {
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

    const publicUrl = process.env.ICAL_PUBLIC_URL;
    let google_calendar_embed_url = "https://calendar.google.com/calendar/embed?src=vi.vietnamese%23holiday%40group.v.calendar.google.com&ctz=Asia%2FHo_Chi_Minh";
    if (publicUrl && publicUrl.includes('/ical/')) {
      const parts = publicUrl.split('/ical/');
      if (parts[1]) {
        const calendarId = parts[1].split('/')[0];
        if (calendarId) {
          google_calendar_embed_url = `https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=Asia%2FHo_Chi_Minh`;
        }
      }
    }

    return {
      audiences: [...DEFAULT_EVENT_AUDIENCES],
      categories: categories.map(toCategoryDto),
      church_units: churchUnits.map(toChurchUnitDto),
      members: members.map(toMemberDto),
      repeats: [...DEFAULT_EVENT_REPEATS],
      statuses: [...DEFAULT_EVENT_STATUSES],
      google_calendar_embed_url,
    };
  }

  async findAll(
    filters: { audience?: string; category_id?: number; q?: string; status?: string; upcoming?: boolean },
    skip: number,
    take: number,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<EventListResult> {
    const and: Prisma.EventWhereInput[] = [buildVisibilityWhere(viewerId, viewerRole), { deleted_at: null }];

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
      and.push({
        OR: [
          { starts_at: { gte: new Date() } },
          { ends_at: { gte: new Date() } },
          { repeat: { not: 'none' } },
        ],
      });
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

  async findById(id: string, viewerId?: string, viewerRole?: string): Promise<EventDto | null> {
    const event = await this.prisma.event.findFirst({
      include: EVENT_INCLUDE,
      where: {
        AND: [
          { deleted_at: null },
          { id },
          buildVisibilityWhere(viewerId, viewerRole),
        ],
      },
    });

    return event ? toEventDto(event) : null;
  }

  async findByIdForWrite(id: string): Promise<EventDto | null> {
    const event = await this.prisma.event.findFirst({
      include: EVENT_INCLUDE,
      where: {
        id,
      },
    });

    return event ? toEventDto(event) : null;
  }

  async findStandaloneBySlugForWrite(slug: string): Promise<EventDto | null> {
    const event = await this.prisma.event.findFirst({
      include: EVENT_INCLUDE,
      where: {
        series_id: null,
        slug,
      } as any,
    } as any);

    return event ? toEventDto(event as any) : null;
  }

  async seriesExistsBySlug(slug: string): Promise<boolean> {
    const series = await (this.prisma as any).eventSeries.findUnique({
      select: { id: true },
      where: { slug },
    });

    return Boolean(series);
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
    const baseUserIds = [...new Set(dto.user_ids ?? [])];
    const startsAt = new Date(dto.starts_at);
    const endsAt = new Date(dto.ends_at);
    const repeat = dto.repeat ?? 'none';
    const audience = dto.audience ?? 'public';
    const title = dto.title.trim();
    const description = dto.description?.trim() || null;
    const location = dto.location?.trim() || null;
    const slug = dto.slug.trim();
    const isAllDay = dto.is_all_day ?? false;
    const status = dto.status ?? 'published';
    const categoryId = dto.category_id ?? null;
    const color = dto.color ?? null;
    const coverImageUrl = dto.cover_image_url ?? null;
    const durationMs = Math.max(endsAt.getTime() - startsAt.getTime(), 0);
    const expandedUserIds = await expandAudienceUserIds(this.prisma, audience, churchUnitIds, baseUserIds);

    const event = await this.prisma.$transaction(async (tx) => {
      if (repeat === 'none') {
        return tx.event.create({
          data: {
            audience,
            category_id: categoryId,
            color,
            cover_image_url: coverImageUrl,
            created_by: creatorId,
            description,
            ends_at: endsAt,
            is_all_day: isAllDay,
            location,
            repeat,
            slug,
            starts_at: startsAt,
            status,
            title,
            ...(churchUnitIds.length > 0 && {
              church_unit_targets: {
                createMany: {
                  data: churchUnitIds.map((churchUnitId) => ({ church_unit_id: churchUnitId })),
                },
              },
            }),
            ...(expandedUserIds.length > 0 && {
              attendees: {
                createMany: {
                  data: expandedUserIds.map((userId) => ({ user_id: userId })),
                  skipDuplicates: true,
                },
              },
            }),
          },
          include: EVENT_INCLUDE,
        });
      }

      const series = await (tx as any).eventSeries.create({
        data: {
          category_id: categoryId,
          color,
          cover_image_url: coverImageUrl,
          created_by: creatorId,
          description,
          ends_at: endsAt,
          is_all_day: isAllDay,
          location,
          repeat,
          slug,
          starts_at: startsAt,
          title,
        },
      });

      const occurrenceStarts = buildRecurringStarts(startsAt, repeat);
      for (const occurrenceStart of occurrenceStarts) {
        const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
        await tx.event.create({
          data: {
            audience,
            category_id: categoryId,
            color,
            cover_image_url: coverImageUrl,
            created_by: creatorId,
            description,
            ends_at: occurrenceEnd,
            is_all_day: isAllDay,
            location,
            repeat,
            series_id: series.id,
            slug: buildOccurrenceSlug(slug, occurrenceStart),
            starts_at: occurrenceStart,
            status,
            title,
            ...(churchUnitIds.length > 0 && {
              church_unit_targets: {
                createMany: {
                  data: churchUnitIds.map((churchUnitId) => ({ church_unit_id: churchUnitId })),
                },
              },
            }),
            ...(expandedUserIds.length > 0 && {
              attendees: {
                createMany: {
                  data: expandedUserIds.map((userId) => ({ user_id: userId })),
                  skipDuplicates: true,
                },
              },
            }),
          } as any,
        } as any);
      }

      return tx.event.findFirstOrThrow({
        include: EVENT_INCLUDE,
        where: {
          series_id: series.id,
          starts_at: startsAt,
        } as any,
      } as any);
    });

    return toEventDto(event as any);
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventDto | null> {
    const churchUnitIds =
      dto.church_unit_ids !== undefined ? [...new Set(dto.church_unit_ids)] : undefined;
    const userIds = dto.user_ids !== undefined ? [...new Set(dto.user_ids)] : undefined;

    const event = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({
        select: { id: true, audience: true, series_id: true },
        where: { id },
      } as any) as { id: string; audience: string; series_id: string | null } | null;

      if (!existing) {
        return null;
      }

      const updated = await tx.event.update({
        data: {
          ...(dto.audience !== undefined && { audience: dto.audience }),
          ...(dto.category_id !== undefined && { category_id: dto.category_id ?? null }),
          ...(dto.color !== undefined && { color: dto.color ?? null }),
          ...(dto.cover_image_url !== undefined && { cover_image_url: dto.cover_image_url ?? null }),
          ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
          ...(dto.ends_at !== undefined && { ends_at: new Date(dto.ends_at) }),
          ...(dto.is_all_day !== undefined && { is_all_day: dto.is_all_day }),
          ...(dto.location !== undefined && { location: dto.location?.trim() || null }),
          ...(existing.series_id === null && dto.repeat !== undefined && { repeat: dto.repeat }),
          ...(existing.series_id === null && dto.slug !== undefined && { slug: dto.slug.trim() }),
          ...(dto.starts_at !== undefined && { starts_at: new Date(dto.starts_at) }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.title !== undefined && { title: dto.title.trim() }),
        },
        where: { id: existing.id },
      });

      // Update church unit targets
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

      // Sync attendees if audience or targets changed
      if (
        dto.audience !== undefined ||
        churchUnitIds !== undefined ||
        userIds !== undefined
      ) {
        const finalAudience = dto.audience ?? updated.audience;
        
        // Clear existing attendees for targeted audiences
        if (finalAudience === 'church_unit' || finalAudience === 'people') {
          // Fetch current attendees before clearing to preserve them if not provided in DTO
          const currentAttendees = await tx.eventAttendance.findMany({
            where: { event_id: existing.id },
            select: { user_id: true }
          });

          await tx.eventAttendance.deleteMany({ where: { event_id: existing.id } });

          let finalUserIds: string[] = [];

          if (finalAudience === 'people') {
            finalUserIds = userIds ?? currentAttendees.map((attendance) => attendance.user_id);
          } else if (finalAudience === 'church_unit') {
            let unitIds: string[] = [];
            if (churchUnitIds !== undefined) {
              unitIds = churchUnitIds;
            } else {
              const currentUnits = await tx.eventChurchUnitTarget.findMany({
                where: { event_id: existing.id },
                select: { church_unit_id: true },
              });
              unitIds = currentUnits.map((target) => target.church_unit_id);
            }

            finalUserIds = await expandAudienceUserIds(tx, finalAudience, unitIds, []);
          }

          if (finalUserIds.length > 0) {
            await tx.eventAttendance.createMany({
              data: finalUserIds.map((userId) => ({
                event_id: existing.id,
                user_id: userId,
              })),
              skipDuplicates: true,
            });
          }
        } else {
          // For public/church, clear targeted attendees
          await tx.eventAttendance.deleteMany({ where: { event_id: existing.id } });
        }
      }

      return tx.event.findUnique({
        include: EVENT_INCLUDE,
        where: { id: existing.id },
      } as any);
    });

    return event ? toEventDto(event as any) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.event.update({
      data: { deleted_at: new Date() },
      where: { id },
    });
  }

  async findSystemUser(): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      select: { id: true },
      where: { deleted_at: null },
      orderBy: { role_id: 'asc' },
    });
  }

  async upsertGoogleEvents(events: any[], creatorId: string): Promise<void> {
    for (const ev of events) {
      if (!ev.uid || !ev.starts_at) continue;
      const slug = `gcal-${ev.uid.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`.slice(0, 150);

      const data = {
        title: ev.title || 'Untitled Google Event',
        description: ev.description || null,
        starts_at: ev.starts_at,
        ends_at: ev.ends_at || new Date(new Date(ev.starts_at).getTime() + 60 * 60 * 1000),
        location: ev.location || null,
        status: 'published',
        audience: 'public',
      };

      await this.prisma.event.upsert({
        where: { slug },
        create: {
          ...data,
          slug,
          created_by: creatorId,
        },
        update: data,
      });
    }
  }
}
