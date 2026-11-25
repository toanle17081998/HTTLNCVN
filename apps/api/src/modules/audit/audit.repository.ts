import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, take: number) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { user: { select: { email: true, id: true, username: true } } },
        orderBy: { occurred_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total };
  }
}
