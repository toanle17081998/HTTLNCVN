import { CanActivate, ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { FeatureFlagService } from '../../modules/feature-flag/feature-flag.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!key || (await this.featureFlagService.isEnabled(key))) {
      return true;
    }

    throw new NotFoundException({
      code: 'MODULE_DISABLED',
      message: 'This module is currently disabled.',
    });
  }
}
