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

import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { EventService } from './event.service';
import type {
  CreateEventDto,
  EventDto,
  EventListResult,
  UpdateEventDto,
} from './event.types';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Public()
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<EventListResult> {
    return this.eventService.findAll(
      { status, upcoming: upcoming === 'true' },
      Number(skip),
      Number(take),
    );
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<EventDto> {
    return this.eventService.findBySlug(slug);
  }

  @Roles('admin')
  @Post()
  create(
    @Body() dto: CreateEventDto,
    @Request() req: { user: JwtPayload },
  ): Promise<EventDto> {
    return this.eventService.create(dto, req.user.sub);
  }

  @Roles('admin')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateEventDto): Promise<EventDto> {
    return this.eventService.update(slug, dto);
  }

  @Roles('admin')
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): Promise<void> {
    return this.eventService.delete(slug);
  }
}
