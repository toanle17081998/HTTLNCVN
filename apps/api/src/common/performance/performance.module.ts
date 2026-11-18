import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service';
import { AuditBufferService } from './audit-buffer.service';

@Global()
@Module({
  exports: [AuditBufferService, CacheService],
  providers: [AuditBufferService, CacheService],
})
export class PerformanceModule {}

