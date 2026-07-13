import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { Can } from '../../common/decorators/permissions.decorator';
import { ServingScheduleService } from './serving-schedule.service';
import type {
  GenerateServingSchedulesDto,
  ServingPlannerDto,
  ServingScheduleDto,
  UpdateServingScheduleDto,
  UpsertServingProfilesDto,
} from './serving-schedule.types';

@Controller('serving-schedules')
export class ServingScheduleController {
  constructor(private readonly service: ServingScheduleService) {}

  @Get()
  @Can('read', 'church_unit')
  getPlanner(
    @Query('church_unit_id') churchUnitId: string,
    @Query('type') type: string,
  ): Promise<ServingPlannerDto> {
    return this.service.getPlanner(churchUnitId, type);
  }

  @Patch('profiles')
  @Can('update', 'church_unit')
  upsertProfiles(@Body() dto: UpsertServingProfilesDto): Promise<ServingPlannerDto> {
    return this.service.upsertProfiles(dto);
  }

  @Post('generate')
  @Can('update', 'church_unit')
  generate(@Body() dto: GenerateServingSchedulesDto): Promise<ServingScheduleDto[]> {
    return this.service.generate(dto);
  }

  @Patch(':id')
  @Can('update', 'church_unit')
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateServingScheduleDto,
  ): Promise<ServingScheduleDto> {
    return this.service.updateSchedule(id, dto);
  }
}
