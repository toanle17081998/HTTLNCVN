import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { PageService } from './page.service';
import type {
  CreatePageDto,
  PageDto,
  PageListResult,
  UpdatePageDto,
} from './page.types';

@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  findAll(@Query('status') status?: string): Promise<PageListResult> {
    return this.pageService.findAll(status);
  }

  @Public()
  @Get('resolve')
  findByPath(@Query('path') path = '/'): Promise<PageDto> {
    return this.pageService.findByPath(path);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<PageDto> {
    return this.pageService.findBySlug(slug);
  }

  @Post()
  create(@Body() dto: CreatePageDto, @Request() req: { user?: { sub?: string } }): Promise<PageDto> {
    return this.pageService.create(dto, req.user?.sub ?? '');
  }

  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdatePageDto): Promise<PageDto> {
    return this.pageService.update(slug, dto);
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string): Promise<void> {
    return this.pageService.remove(slug);
  }
}
