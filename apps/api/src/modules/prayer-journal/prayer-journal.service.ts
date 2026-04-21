import { Injectable } from '@nestjs/common';

import { PrayerJournalRepository } from './prayer-journal.repository';
import type {
  CreatePrayerDto,
  PrayerDto,
  PrayerListResult,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

@Injectable()
export class PrayerJournalService {
  constructor(private readonly prayerJournalRepository: PrayerJournalRepository) {}

  findForUser(userId: string, skip: number, take: number): Promise<PrayerListResult> {
    return this.prayerJournalRepository.findForUser(userId, skip, take);
  }

  findById(id: string, userId: string): Promise<PrayerDto | null> {
    return this.prayerJournalRepository.findById(id, userId);
  }

  create(dto: CreatePrayerDto, userId: string): Promise<PrayerDto> {
    return this.prayerJournalRepository.create(dto, userId);
  }

  update(id: string, dto: UpdatePrayerDto, userId: string): Promise<PrayerDto> {
    return this.prayerJournalRepository.update(id, dto, userId);
  }

  delete(id: string, userId: string): Promise<void> {
    return this.prayerJournalRepository.delete(id, userId);
  }

  share(id: string, dto: SharePrayerDto, userId: string): Promise<void> {
    return this.prayerJournalRepository.share(id, dto, userId);
  }
}
