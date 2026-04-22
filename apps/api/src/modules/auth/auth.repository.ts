import { Injectable } from '@nestjs/common';
import type { User, Role } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export type UserWithRole = User & { role: Role };

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      include: { role: true },
      where: { email },
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      include: { role: true },
      where: { id },
    });
  }
}
