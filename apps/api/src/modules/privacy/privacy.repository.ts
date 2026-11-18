import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PrivacyRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserData(userId: string) {
    return this.prisma.user.findFirst({
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
  }
}
