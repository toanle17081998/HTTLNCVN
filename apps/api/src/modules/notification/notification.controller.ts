import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Request } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { NotificationService } from './notification.service';
import type { CreateNotificationDto, NotificationListResult } from './notification.types';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Can('read', 'notification')
  findAll(
    @Request() req: { user: JwtPayload },
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<NotificationListResult> {
    return this.notificationService.findForUser(req.user.sub, Number(skip), Number(take));
  }

  @Patch(':id/read')
  @Can('read', 'notification')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.notificationService.markRead(id, req.user.sub);
  }

  @Can('create', 'notification')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateNotificationDto,
    @Request() req: { user: JwtPayload },
  ): Promise<void> {
    return this.notificationService.create(dto, req.user.sub);
  }
}
