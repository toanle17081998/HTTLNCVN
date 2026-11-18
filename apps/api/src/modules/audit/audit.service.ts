import { Injectable } from '@nestjs/common';

import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async findAll(skip: number, take: number) {
    const safeSkip = Number.isFinite(skip) && skip > 0 ? Math.floor(skip) : 0;
    const safeTake = Number.isFinite(take) && take > 0 ? Math.min(Math.floor(take), 100) : 50;
    return this.auditRepository.findAll(safeSkip, safeTake);
  }
}

