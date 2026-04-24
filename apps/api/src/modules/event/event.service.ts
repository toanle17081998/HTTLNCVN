import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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
  constructor(private readonly eventRepository: EventRepository) {}

  getMeta(): Promise<EventMetaDto> {
    return this.eventRepository.getMeta();
  }

  findAll(
    filters: { audience?: string; category_id?: number; q?: string; status?: string; upcoming?: boolean },
    skip: number,
    take: number,
    viewerId?: string,
  ): Promise<EventListResult> {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;

    return this.eventRepository.findAll(filters, safeSkip, safeTake, viewerId);
  }

  async findBySlug(slug: string, viewerId?: string): Promise<EventDto> {
    const event = await this.eventRepository.findBySlug(slug, viewerId);

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

  async create(dto: CreateEventDto, creatorId: string): Promise<EventDto> {
    await this.validateWrite(dto);
    return this.eventRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdateEventDto): Promise<EventDto> {
    const existing = await this.eventRepository.findBySlugForWrite(slug);
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }
    await this.validateWrite(dto);

    const event = await this.eventRepository.update(slug, dto);

    if (!event) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }

    return event;
  }

  async delete(slug: string): Promise<void> {
    const existing = await this.eventRepository.findBySlugForWrite(slug);
    if (!existing) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }
    await this.eventRepository.delete(slug);
  }

  private async validateWrite(dto: CreateEventDto | UpdateEventDto): Promise<void> {
    if ('title' in dto && dto.title !== undefined && !dto.title.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Event title is required.' });
    }

    if ('slug' in dto && dto.slug !== undefined && !dto.slug.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Event slug is required.' });
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
}
