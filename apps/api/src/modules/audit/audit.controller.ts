import { Controller, Get, Query } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Can('manage', 'member_permission')
  findAll(@Query('skip') skip = '0', @Query('take') take = '50') {
    return this.auditService.findAll(Number(skip), Number(take));
  }
}

