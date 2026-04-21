import { Module } from '@nestjs/common';

import { PrayerJournalController } from './prayer-journal.controller';
import { PrayerJournalRepository } from './prayer-journal.repository';
import { PrayerJournalService } from './prayer-journal.service';

@Module({
  controllers: [PrayerJournalController],
  providers: [PrayerJournalService, PrayerJournalRepository],
})
export class PrayerJournalModule {}
