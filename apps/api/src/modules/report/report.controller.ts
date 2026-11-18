import { Controller, Get } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import { ReportService } from './report.service';
import type { OperationalReportDto } from './report.types';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('operations')
  @Can('read', 'member')
  getOperations(): Promise<OperationalReportDto> {
    return this.reportService.getOperationalReport();
  }
}

