import { Body, Controller, Get, Patch, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { Can } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { getEnv } from '../../config/env';
import { parseHomepageQuery } from './homepage-query';
import { HomepageService } from './homepage.service';
import type {
  HomepageContentDto,
  HomepageResult,
  UpdateHomepageContentDto,
} from './homepage.types';

@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Public()
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

  @Public()
  @Get('content')
  getContent(): Promise<HomepageContentDto> {
    return this.homepageService.getContent();
  }

  @Can('update', 'landing_page')
  @Patch('content')
  updateContent(@Body() dto: UpdateHomepageContentDto): Promise<HomepageContentDto> {
    return this.homepageService.updateContent(dto);
  }
}
