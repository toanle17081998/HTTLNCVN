import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { NotificationService } from '../notification/notification.service';
import { EventRepository } from './event.repository';
import type {
  CreateEventCategoryDto,
  CreateEventDto,
  EventCategoryDto,
  EventDto,
  EventListResult,
  EventMetaDto,
  UpdateEventCategoryDto,
  UpdateEventDto,
} from './event.types';
import {
  DEFAULT_EVENT_AUDIENCES,
  DEFAULT_EVENT_REPEATS,
  DEFAULT_EVENT_STATUSES,
} from './event.types';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly notificationService: NotificationService,
  ) {}

  getMeta(): Promise<EventMetaDto> {
    return this.eventRepository.getMeta();
  }

  async findAll(
    filters: { audience?: string; category_id?: number; q?: string; status?: string; upcoming?: boolean },
    skip: number,
    take: number,
    viewerId?: string,
    viewerRole?: string,
  ): Promise<EventListResult> {
    this.syncGoogleCalendarEvents().catch((err) =>
      console.error('Failed to sync Google Calendar events in findAll:', err),
    );

    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;

    return this.eventRepository.findAll(filters, safeSkip, safeTake, viewerId, viewerRole);
  }

  async findById(id: string, viewerId?: string, viewerRole?: string): Promise<EventDto> {
    const event = await this.eventRepository.findById(id, viewerId, viewerRole);

    if (!event) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }

    return event;
  }

  async createCategory(dto: CreateEventCategoryDto): Promise<EventCategoryDto> {
    if (!dto.name.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Category name is required.' });
    }

    return this.eventRepository.createCategory(dto);
  }

  async updateCategory(id: number, dto: UpdateEventCategoryDto): Promise<EventCategoryDto> {
    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Category name is required.' });
    }

    return this.eventRepository.updateCategory(id, dto).then((category) => {
      if (!category) {
        throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event category not found.' });
      }

      return category;
    });
  }

  async deleteCategory(id: number): Promise<void> {
    const exists = await this.eventRepository.categoryExists(id);
    if (!exists) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event category not found.' });
    }

    await this.eventRepository.deleteCategory(id);
  }

  private async sendNotifications(event: EventDto, dto: CreateEventDto | UpdateEventDto, senderId: string, isUpdate = false) {
    const prefix = isUpdate ? 'Updated Event' : 'New Event';
    const bodyDate = new Date(event.starts_at).toLocaleDateString('vi-VN');
    const bodyLocation = event.location ?? 'N/A';

    if (dto.audience === 'church_unit' && dto.church_unit_ids) {
      for (const unitId of dto.church_unit_ids) {
        await this.notificationService.create({
          title: `${prefix}: ${event.title}`,
          message: `Sự kiện "${event.title}" đã được ${isUpdate ? 'cập nhật' : 'lên lịch'} cho đơn vị của bạn vào ngày ${bodyDate}. Địa điểm: ${bodyLocation}.`,
          target_type: 'church_unit',
          target_id: unitId,
          type: 'event',
          action_url: `/event`,
        }, senderId).catch(err => console.error('Failed to send event notification to unit', err));
      }
    } else if (dto.audience === 'people' && dto.user_ids) {
      for (const userId of dto.user_ids) {
        await this.notificationService.create({
          title: `${prefix}: ${event.title}`,
          message: `Bạn được phân công tham gia sự kiện "${event.title}" vào ngày ${bodyDate}. Địa điểm: ${bodyLocation}.`,
          target_type: 'user',
          target_id: userId,
          type: 'event',
          action_url: `/event`,
        }, senderId).catch(err => console.error('Failed to send event notification to user', err));
      }
    }
  }

  async create(dto: CreateEventDto, creatorId: string): Promise<EventDto> {
    await this.validateWrite(dto);
    const event = await this.eventRepository.create(dto, creatorId);
    await this.sendNotifications(event, dto, creatorId, false);
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventDto> {
    const existing = await this.eventRepository.findByIdForWrite(id);
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }
    await this.validateWrite(dto, existing);

    const event = await this.eventRepository.update(id, dto);

    if (!event) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }

    await this.sendNotifications(event, dto, event.creator.id, true);

    return event;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.eventRepository.findByIdForWrite(id);
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }
    await this.eventRepository.delete(id);
  }

  private async validateWrite(dto: CreateEventDto | UpdateEventDto, currentEvent?: EventDto): Promise<void> {
    if ('title' in dto && dto.title !== undefined && !dto.title.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Event title is required.' });
    }

    if ('slug' in dto && dto.slug !== undefined) {
      const slug = dto.slug.trim();
      if (!slug) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Event slug is required.' });
      }

      const editingRecurringOccurrence = Boolean(currentEvent?.series);
      if (!editingRecurringOccurrence) {
        const existing = await this.eventRepository.findStandaloneBySlugForWrite(slug);
        if (existing && existing.id !== currentEvent?.id) {
          throw new BadRequestException({
            code: 'BAD_REQUEST',
            message: 'Event slug already exists.',
          });
        }
      }

      if ((dto.repeat ?? currentEvent?.repeat) !== 'none') {
        const seriesExists = await this.eventRepository.seriesExistsBySlug(slug);
        if (!currentEvent?.series || currentEvent.series.slug !== slug) {
          if (seriesExists) {
            throw new BadRequestException({
              code: 'BAD_REQUEST',
              message: 'Event slug already exists.',
            });
          }
        }
      }
    }

    if (dto.audience !== undefined && !DEFAULT_EVENT_AUDIENCES.includes(dto.audience as never)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid event audience.' });
    }

    if (dto.repeat !== undefined && !DEFAULT_EVENT_REPEATS.includes(dto.repeat as never)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid event repeat value.' });
    }

    if (dto.status !== undefined && !DEFAULT_EVENT_STATUSES.includes(dto.status as never)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid event status.' });
    }

    if (dto.is_all_day !== undefined && typeof dto.is_all_day !== 'boolean') {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid all-day flag.' });
    }

    const startsAt = dto.starts_at !== undefined ? new Date(dto.starts_at) : null;
    const endsAt = dto.ends_at !== undefined ? new Date(dto.ends_at) : null;

    if (startsAt && Number.isNaN(startsAt.getTime())) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid event start time.' });
    }

    if (endsAt && Number.isNaN(endsAt.getTime())) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid event end time.' });
    }

    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Event end time must be after the start time.',
      });
    }

    if (dto.category_id !== undefined && dto.category_id !== null) {
      const categoryExists = await this.eventRepository.categoryExists(dto.category_id);
      if (!categoryExists) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'Selected event category does not exist.',
        });
      }
    }

    if (dto.church_unit_ids !== undefined) {
      if (!Array.isArray(dto.church_unit_ids)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Church units must be a list.' });
      }

      const uniqueChurchUnitIds = [...new Set(dto.church_unit_ids.filter((id) => id.trim()))];
      if (uniqueChurchUnitIds.length !== dto.church_unit_ids.length) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'Church units contain duplicate or invalid ids.',
        });
      }

      const count = await this.eventRepository.countChurchUnitsByIds(uniqueChurchUnitIds);
      if (count !== uniqueChurchUnitIds.length) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'One or more selected church units do not exist.',
        });
      }
    }

    if (dto.user_ids !== undefined) {
      if (!Array.isArray(dto.user_ids)) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Users must be a list.' });
      }

      const uniqueUserIds = [...new Set(dto.user_ids.filter((id) => id.trim()))];
      if (uniqueUserIds.length !== dto.user_ids.length) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'Users contain duplicate or invalid ids.',
        });
      }

      const count = await this.eventRepository.countUsersByIds(uniqueUserIds);
      if (count !== uniqueUserIds.length) {
        throw new BadRequestException({
          code: 'BAD_REQUEST',
          message: 'One or more selected users do not exist.',
        });
      }
    }

    if (dto.audience === 'church_unit' && (dto.church_unit_ids?.length ?? 0) === 0) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Select at least one church unit for church unit events.',
      });
    }

    if (dto.audience === 'people' && (dto.user_ids?.length ?? 0) === 0) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Select at least one member for people-targeted events.',
      });
    }
  }

  private lastSyncTime = 0;

  async syncGoogleCalendarEvents(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSyncTime < 5 * 60 * 1000) {
      return;
    }
    this.lastSyncTime = now;

    const publicUrl = process.env.ICAL_PUBLIC_URL;
    const privateUrl = process.env.ICAL_PRIVATE_URL;

    const urls = [publicUrl, privateUrl].filter((url): url is string => !!url && url.trim().startsWith('http'));

    if (urls.length === 0) {
      return;
    }

    try {
      const systemUser = await this.eventRepository.findSystemUser();
      if (!systemUser) {
        console.warn('No active user found to assign Google Calendar events to.');
        return;
      }

      const allEvents: any[] = [];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) {
            console.error(`Failed to fetch iCal feed from ${url}: ${res.statusText}`);
            continue;
          }
          const text = await res.text();
          const parsed = this.parseIcal(text);
          allEvents.push(...parsed);
        } catch (err: any) {
          console.error(`Error fetching/parsing iCal feed from ${url}:`, err);
        }
      }

      if (allEvents.length === 0) {
        return;
      }

      await this.eventRepository.upsertGoogleEvents(allEvents, systemUser.id);
    } catch (err: any) {
      console.error('Failed to sync Google Calendar events:', err);
    }
  }

  private parseIcal(icalText: string): any[] {
    const events: any[] = [];
    const lines = icalText.split(/\r?\n/);
    let currentEvent: any = null;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
        line += lines[i + 1].slice(1);
        i++;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const keyPart = line.slice(0, colonIdx);
      const value = line.slice(colonIdx + 1);

      const key = keyPart.split(';')[0].trim().toUpperCase();

      if (key === 'BEGIN' && value.trim().toUpperCase() === 'VEVENT') {
        currentEvent = {};
      } else if (key === 'END' && value.trim().toUpperCase() === 'VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        if (key === 'SUMMARY') {
          currentEvent.title = this.unescapeIcalValue(value);
        } else if (key === 'DESCRIPTION') {
          currentEvent.description = this.unescapeIcalValue(value);
        } else if (key === 'LOCATION') {
          currentEvent.location = this.unescapeIcalValue(value);
        } else if (key === 'UID') {
          currentEvent.uid = value.trim();
        } else if (key === 'DTSTART') {
          currentEvent.starts_at = this.parseIcalDate(value);
        } else if (key === 'DTEND') {
          currentEvent.ends_at = this.parseIcalDate(value);
        }
      }
    }

    return events;
  }

  private unescapeIcalValue(val: string): string {
    return val
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/gi, '\n')
      .replace(/\\/g, '')
      .trim();
  }

  private parseIcalDate(val: string): Date {
    const clean = val.trim().replace(/[^0-9TZ]/g, '');
    if (clean.length === 8) {
      const y = parseInt(clean.slice(0, 4));
      const m = parseInt(clean.slice(4, 6)) - 1;
      const d = parseInt(clean.slice(6, 8));
      return new Date(y, m, d);
    }
    const y = parseInt(clean.slice(0, 4));
    const m = parseInt(clean.slice(4, 6)) - 1;
    const d = parseInt(clean.slice(6, 8));
    const h = parseInt(clean.slice(9, 11)) || 0;
    const min = parseInt(clean.slice(11, 13)) || 0;
    const s = parseInt(clean.slice(13, 15)) || 0;
    if (clean.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, h, min, s));
    }
    return new Date(y, m, d, h, min, s);
  }

  async getIcalFeed(): Promise<string> {
    const result = await this.eventRepository.findAll(
      { status: 'published' },
      0,
      1000,
    );

    return this.generateIcalFeed(result.items);
  }

  private generateIcalFeed(events: EventDto[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HTTLNCVN//Events Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const ev of events) {
      const start = new Date(ev.starts_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const end = new Date(ev.ends_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const stamp = new Date(ev.created_at || new Date()).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${ev.id}@httlncvn.org`);
      lines.push(`DTSTAMP:${stamp}`);
      lines.push(`DTSTART:${start}`);
      lines.push(`DTEND:${end}`);
      lines.push(`SUMMARY:${this.escapeIcalText(ev.title)}`);
      if (ev.description) {
        lines.push(`DESCRIPTION:${this.escapeIcalText(ev.description)}`);
      }
      if (ev.location) {
        lines.push(`LOCATION:${this.escapeIcalText(ev.location)}`);
      }
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private escapeIcalText(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
}
