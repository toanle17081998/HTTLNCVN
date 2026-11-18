import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, take: number) {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 50;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        include: { user: { select: { email: true, id: true, username: true } } },
        orderBy: { occurred_at: 'desc' },
        skip: safeSkip,
        take: safeTake,
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total };
  }
}

