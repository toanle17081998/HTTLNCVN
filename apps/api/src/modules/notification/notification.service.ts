import { Injectable } from '@nestjs/common';

import { NotificationRepository } from './notification.repository';
import type { CreateNotificationDto, NotificationListResult } from './notification.types';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  findForUser(userId: string, skip: number, take: number): Promise<NotificationListResult> {
    return this.notificationRepository.findForUser(userId, skip, take);
  }

  markRead(notificationId: string, userId: string): Promise<void> {
    return this.notificationRepository.markRead(notificationId, userId);
  }

  create(dto: CreateNotificationDto, senderId: string): Promise<void> {
    return this.notificationRepository.create(dto, senderId);
  }
}
