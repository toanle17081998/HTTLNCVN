import { Injectable } from '@nestjs/common';
import type { User, Role, RolePermission, Action, Resource } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export type UserWithRole = User & {
  role: Role & {
    permissions: Array<RolePermission & { action: Action; resource: Resource }>;
  };
};

const USER_INCLUDE = {
  role: {
    include: {
      permissions: {
        include: {
          action: true,
          resource: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      include: USER_INCLUDE,
      where: { email },
    });
  }

  findById(id: string): Promise<UserWithRole | null> {
    return this.prisma.user.findUnique({
      include: USER_INCLUDE,
      where: { id },
    });
  }

  findMeById(id: string) {
    return this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                action: { select: { name: true } },
                resource: { select: { name: true } },
              },
            },
          },
        },
        username: true,
      },
      where: { id },
    });
  }

  updatePassword(id: string, passwordHash: string): Promise<UserWithRole> {
    return this.prisma.user.update({
      data: { password_hash: passwordHash },
      include: USER_INCLUDE,
      where: { id },
    });
  }
}
