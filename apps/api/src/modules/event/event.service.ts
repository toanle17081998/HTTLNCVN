import { Injectable, NotFoundException } from '@nestjs/common';

import { EventRepository } from './event.repository';
import type {
  CreateEventDto,
  EventDto,
  EventListResult,
  UpdateEventDto,
} from './event.types';

@Injectable()
export class EventService {
  constructor(private readonly eventRepository: EventRepository) {}

  findAll(
    filters: { status?: string; upcoming?: boolean },
    skip: number,
    take: number,
  ): Promise<EventListResult> {
    return this.eventRepository.findAll(filters, skip, take);
  }

  async findBySlug(slug: string): Promise<EventDto> {
    const event = await this.eventRepository.findBySlug(slug);

    if (!event) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }

    return event;
  }

  create(dto: CreateEventDto, creatorId: string): Promise<EventDto> {
    return this.eventRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdateEventDto): Promise<EventDto> {
    const event = await this.eventRepository.update(slug, dto);

    if (!event) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Event not found.' });
    }

    return event;
  }

  async delete(slug: string): Promise<void> {
    await this.findBySlug(slug);
    await this.eventRepository.delete(slug);
  }
}
