import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditBufferService implements OnModuleDestroy {
  private queue: Prisma.AuditLogCreateManyInput[] = [];
  private flushing = false;
  private readonly timer: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {
    this.timer = setInterval(() => void this.flush(), 500);
    this.timer.unref();
  }

  enqueue(entry: Prisma.AuditLogCreateManyInput): void {
    if (this.queue.length >= 10_000) this.queue.shift();
    this.queue.push(entry);
    if (this.queue.length >= 100) void this.flush();
  }

  async flush(): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    this.flushing = true;
    const batch = this.queue.splice(0, 500);
    try {
      await this.prisma.auditLog.createMany({ data: batch });
    } catch {
      const capacity = Math.max(0, 10_000 - this.queue.length);
      if (capacity > 0) this.queue.unshift(...batch.slice(0, capacity));
    } finally {
      this.flushing = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    for (let attempt = 0; attempt < 20 && this.queue.length > 0; attempt += 1) {
      await this.flush();
    }
  }
}

