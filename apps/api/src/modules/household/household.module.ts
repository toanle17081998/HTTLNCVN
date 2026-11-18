import { Module } from '@nestjs/common';

import { HouseholdController } from './household.controller';
import { HouseholdRepository } from './household.repository';
import { HouseholdService } from './household.service';

@Module({ controllers: [HouseholdController], providers: [HouseholdRepository, HouseholdService] })
export class HouseholdModule {}
