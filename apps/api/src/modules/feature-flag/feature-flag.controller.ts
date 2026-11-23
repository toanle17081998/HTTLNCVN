import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
import { FeatureFlagService, type FeatureFlagKey } from './feature-flag.service';

@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Public()
  @Get()
  findAll(): Promise<Record<FeatureFlagKey, boolean>> {
    return this.featureFlagService.findAll();
  }

  @Can('manage', 'system_setting')
  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body('enabled') enabled: unknown,
  ): Promise<Record<FeatureFlagKey, boolean>> {
    return this.featureFlagService.update(key, enabled);
  }
}
