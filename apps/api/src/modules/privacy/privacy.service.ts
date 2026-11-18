import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findFirst({
      select: {
        created_at: true,
        email: true,
        household_memberships: { include: { household: true } },
        lesson_progress: true,
        profile: true,
        prayers_created: true,
        role: { select: { name: true } },
        status: true,
        username: true,
      },
      where: { deleted_at: null, id: userId },
    });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found.' });
    return { exported_at: new Date().toISOString(), user };
  }
}

