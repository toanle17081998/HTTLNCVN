import { Module } from '@nestjs/common';

import { ChurchUnitController } from './church-unit.controller';
import { ChurchUnitRepository } from './church-unit.repository';
import { ChurchUnitService } from './church-unit.service';

@Module({
  controllers: [ChurchUnitController],
  providers: [ChurchUnitService, ChurchUnitRepository],
})
export class ChurchUnitModule {}
