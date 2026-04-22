import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';

import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { PrayerJournalService } from './prayer-journal.service';
import type {
  CreatePrayerDto,
  PrayerDto,
  PrayerListResult,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

@Controller('prayer-journal')
export class PrayerJournalController {
  constructor(private readonly prayerJournalService: PrayerJournalService) {}

  @Get()
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<PrayerListResult> {
    return this.prayerJournalService.findForUser(req.user.sub, Number(skip), Number(take));
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto | null> {
    return this.prayerJournalService.findById(id, req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto> {
    return this.prayerJournalService.create(dto, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto> {
    return this.prayerJournalService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.prayerJournalService.delete(id, req.user.sub);
  }

  @Post(':id/share')
  @HttpCode(HttpStatus.CREATED)
  share(
    @Param('id') id: string,
    @Body() dto: SharePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.prayerJournalService.share(id, dto, req.user.sub);
  }
}
