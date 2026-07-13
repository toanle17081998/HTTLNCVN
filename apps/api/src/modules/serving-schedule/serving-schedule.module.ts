import { Module } from '@nestjs/common';

import { ServingScheduleController } from './serving-schedule.controller';
import { ServingScheduleRepository } from './serving-schedule.repository';
import { ServingScheduleService } from './serving-schedule.service';

@Module({
  controllers: [ServingScheduleController],
  providers: [ServingScheduleRepository, ServingScheduleService],
})
export class ServingScheduleModule {}
