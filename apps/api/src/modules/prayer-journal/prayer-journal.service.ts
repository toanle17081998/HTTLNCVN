import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrayerJournalRepository } from './prayer-journal.repository';
import type {
  CreatePrayerDto,
  PrayerDto,
  PrayerListResult,
  PrayerJournalMetaDto,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

const allowedVisibilities = new Set(['private', 'public', 'shared']);
const allowedStatuses = new Set(['open', 'closed']);

@Injectable()
export class PrayerJournalService {
  constructor(private readonly prayerJournalRepository: PrayerJournalRepository) {}

  getMeta(userId: string): Promise<PrayerJournalMetaDto> {
    return this.prayerJournalRepository.getMeta(userId);
  }

  findForUser(userId: string, skip: number, take: number): Promise<PrayerListResult> {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 20;

    return this.prayerJournalRepository.findForUser(userId, safeSkip, safeTake);
  }

  async findById(id: string, userId: string): Promise<PrayerDto> {
    const prayer = await this.prayerJournalRepository.findById(id, userId);

    if (!prayer) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Prayer not found.' });
    }

    return prayer;
  }

  async create(dto: CreatePrayerDto, userId: string): Promise<PrayerDto> {
    await this.validateWrite(dto);

    return this.prayerJournalRepository.create(dto, userId);
  }

  async update(id: string, dto: UpdatePrayerDto, userId: string, userRole: string): Promise<PrayerDto> {
    await this.validateWrite(dto);

    return this.prayerJournalRepository.update(id, dto, userId, userRole);
  }

  delete(id: string, userId: string, userRole: string): Promise<void> {
    return this.prayerJournalRepository.delete(id, userId, userRole);
  }

  async share(id: string, dto: SharePrayerDto, userId: string, userRole: string): Promise<void> {
    await this.validateSharedUsers(dto.userIds);

    return this.prayerJournalRepository.share(id, dto, userId, userRole);
  }

  private async validateWrite(dto: CreatePrayerDto | UpdatePrayerDto): Promise<void> {
    if ('content' in dto && dto.content !== undefined && !dto.content.trim()) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Prayer content is required.' });
    }

    if (dto.title !== undefined && dto.title !== null && dto.title.length > 255) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Prayer title is too long.' });
    }

    if (dto.visibility !== undefined && !allowedVisibilities.has(dto.visibility)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid prayer visibility.' });
    }

    if ('status' in dto && dto.status !== undefined && !allowedStatuses.has(dto.status)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid prayer status.' });
    }

    if (dto.category_id !== undefined && dto.category_id !== null) {
      if (!Number.isInteger(dto.category_id) || dto.category_id <= 0) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Invalid prayer category.' });
      }

      const categoryExists = await this.prayerJournalRepository.categoryExists(dto.category_id);
      if (!categoryExists) {
        throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Prayer category does not exist.' });
      }
    }

    if ('shared_with_user_ids' in dto && dto.shared_with_user_ids !== undefined) {
      await this.validateSharedUsers(dto.shared_with_user_ids);
    }

    if (dto.visibility === 'shared' && (!dto.shared_with_user_ids || dto.shared_with_user_ids.length === 0)) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Choose at least one member when sharing a prayer.',
      });
    }
  }

  private async validateSharedUsers(userIds: string[] | undefined): Promise<void> {
    if (userIds === undefined) {
      return;
    }

    if (!Array.isArray(userIds)) {
      throw new BadRequestException({ code: 'BAD_REQUEST', message: 'Shared members must be a list.' });
    }

    const normalizedUserIds = [...new Set(userIds.filter((userId) => typeof userId === 'string' && userId.trim()))];

    if (normalizedUserIds.length !== userIds.length) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Shared members contain duplicate or invalid ids.',
      });
    }

    if (normalizedUserIds.length === 0) {
      return;
    }

    const memberCount = await this.prayerJournalRepository.countMembersByIds(normalizedUserIds);
    if (memberCount !== normalizedUserIds.length) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'One or more shared members do not exist.',
      });
    }
  }
}
