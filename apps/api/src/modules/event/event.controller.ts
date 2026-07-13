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
  Res,
} from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { EventService } from './event.service';
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

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Can('read', 'event')
  @Get('meta')
  getMeta(): Promise<EventMetaDto> {
    return this.eventService.getMeta();
  }

  @Can('create', 'event')
  @Post('categories')
  createCategory(@Body() dto: CreateEventCategoryDto): Promise<EventCategoryDto> {
    return this.eventService.createCategory(dto);
  }

  @Can('update', 'event')
  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateEventCategoryDto,
  ): Promise<EventCategoryDto> {
    return this.eventService.updateCategory(Number(id), dto);
  }

  @Can('delete', 'event')
  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCategory(@Param('id') id: string): Promise<void> {
    return this.eventService.deleteCategory(Number(id));
  }

  @Public()
  @Get()
  findAll(
    @Query('audience') audience?: string,
    @Query('category_id') categoryId?: string,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('upcoming') upcoming?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @Request() req?: { user?: JwtPayload },
  ): Promise<EventListResult> {
    return this.eventService.findAll(
      {
        audience,
        category_id: categoryId ? Number(categoryId) : undefined,
        q,
        status,
        upcoming: upcoming === 'true',
      },
      Number(skip),
      Number(take),
      req?.user?.sub,
      req?.user?.role,
    );
  }

  @Public()
  @Get(':id')
  findById(
    @Param('id') id: string,
    @Request() req?: { user?: JwtPayload },
  ): Promise<EventDto> {
    return this.eventService.findById(id, req?.user?.sub, req?.user?.role);
  }

  @Can('create', 'event')
  @Post()
  create(
    @Body() dto: CreateEventDto,
    @Request() req: { user: JwtPayload },
  ): Promise<EventDto> {
    return this.eventService.create(dto, req.user.sub);
  }

  @Can('update', 'event')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto): Promise<EventDto> {
    return this.eventService.update(id, dto);
  }

  @Can('delete', 'event')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string): Promise<void> {
    return this.eventService.delete(id);
  }

  @Public()
  @Get('feed.ics')
  async getFeed(@Res() res: any): Promise<void> {
    const feed = await this.eventService.getIcalFeed();
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="events.ics"',
    });
    res.send(feed);
  }
}
