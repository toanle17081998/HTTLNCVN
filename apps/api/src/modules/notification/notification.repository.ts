import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import type { CreateNotificationDto, NotificationDto, NotificationListResult } from './notification.types';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string, skip: number, take: number): Promise<NotificationListResult> {
    const where = { user_id: userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificationRecipient.findMany({
        include: { notification: true },
        orderBy: { notification: { created_at: 'desc' } },
        skip,
        take,
        where,
      }),
      this.prisma.notificationRecipient.count({ where }),
    ]);

    return {
      items: items.map(
        (r): NotificationDto => ({
          action_url: r.notification.action_url,
          created_at: r.notification.created_at.toISOString(),
          id: r.notification.id,
          is_read: r.is_read,
          message: r.notification.message,
          read_at: r.read_at?.toISOString() ?? null,
          title: r.notification.title,
          type: r.notification.type,
        }),
      ),
      total,
    };
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.prisma.notificationRecipient.update({
      data: { is_read: true, read_at: new Date() },
      where: { notification_id_user_id: { notification_id: notificationId, user_id: userId } },
    });
  }

  async create(dto: CreateNotificationDto, senderId: string): Promise<void> {
    const notification = await this.prisma.notification.create({
      data: {
        action_url: dto.action_url,
        created_by: senderId,
        message: dto.message,
        target_id: dto.target_id,
        target_type: dto.target_type,
        title: dto.title,
        type: dto.type ?? 'announcement',
      },
    });

    if (dto.target_type === 'all') {
      const users = await this.prisma.user.findMany({ select: { id: true }, where: { deleted_at: null } });

      await this.prisma.notificationRecipient.createMany({
        data: users.map((u) => ({ notification_id: notification.id, user_id: u.id })),
        skipDuplicates: true,
      });
    } else if (dto.target_type === 'user' && dto.target_id) {
      await this.prisma.notificationRecipient.create({
        data: { notification_id: notification.id, user_id: dto.target_id },
      });
    }
  }
}
