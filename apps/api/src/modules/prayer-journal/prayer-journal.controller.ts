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

import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { PrayerJournalService } from './prayer-journal.service';
import type {
  CreatePrayerDto,
  PrayerDto,
  PrayerListResult,
  PrayerJournalMetaDto,
  SharePrayerDto,
  UpdatePrayerDto,
} from './prayer-journal.types';

@Controller('prayer-journal')
export class PrayerJournalController {
  constructor(private readonly prayerJournalService: PrayerJournalService) {}

  @Get('meta')
  @Can('read', 'prayer_journal')
  getMeta(@Request() req: { user: JwtPayload }): Promise<PrayerJournalMetaDto> {
    return this.prayerJournalService.getMeta(req.user.sub);
  }

  @Get()
  @Can('read', 'prayer_journal')
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<PrayerListResult> {
    return this.prayerJournalService.findForUser(req.user.sub, Number(skip), Number(take));
  }

  @Get(':id')
  @Can('read', 'prayer_journal')
  findById(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto> {
    return this.prayerJournalService.findById(id, req.user.sub);
  }

  @Post()
  @Can('create', 'prayer_journal')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto> {
    return this.prayerJournalService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @Can('update', 'prayer_journal')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<PrayerDto> {
    return this.prayerJournalService.update(id, dto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @Can('delete', 'prayer_journal')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.prayerJournalService.delete(id, req.user.sub, req.user.role);
  }

  @Post(':id/share')
  @Can('share', 'prayer_journal')
  @HttpCode(HttpStatus.CREATED)
  share(
    @Param('id') id: string,
    @Body() dto: SharePrayerDto,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.prayerJournalService.share(id, dto, req.user.sub, req.user.role);
  }
}
