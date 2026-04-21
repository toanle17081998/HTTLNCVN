import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { getEnv } from '../../config/env';
import { parseHomepageQuery } from './homepage-query';
import { HomepageService } from './homepage.service';
import type { HomepageResult } from './homepage.types';

@Public()
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Get()
  async getHomepage(
    @Res({ passthrough: true }) response: Response,
    @Query() rawQuery: Record<string, string | string[] | undefined>,
  ): Promise<HomepageResult> {
    response.setHeader(
      'Cache-Control',
      `public, max-age=${getEnv().homepageCacheTtlSeconds}`,
    );

    const query = parseHomepageQuery(rawQuery);

    return this.homepageService.getHomepage(query);
  }
}
