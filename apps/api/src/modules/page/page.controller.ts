import { Controller, Get, Param } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { PageService } from './page.service';
import type { PageDto } from './page.types';

@Public()
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<PageDto> {
    return this.pageService.findBySlug(slug);
  }
}
