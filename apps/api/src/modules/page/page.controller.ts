import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
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
  @Can('read', 'landing_page')
  findAll(@Query('status') status?: string): Promise<PageListResult> {
    return this.pageService.findAll(status);
  }

  @Public()
  @Get('resolve')
  findByPath(@Query('path') path = '/'): Promise<PageDto> {
    return this.pageService.findByPath(path);
  }

  @Public()
  @Get('navigation')
  findPublicNavigation(): Promise<PageDto> {
    return this.pageService.findPublicNavigation();
  }

  @Get(':slug')
  @Can('read', 'landing_page')
  findBySlug(@Param('slug') slug: string): Promise<PageDto> {
    return this.pageService.findBySlug(slug);
  }

  @Post()
  @Can('update', 'landing_page')
  create(@Body() dto: CreatePageDto, @Request() req: { user?: { sub?: string } }): Promise<PageDto> {
    return this.pageService.create(dto, req.user?.sub ?? '');
  }

  @Post(':id/restore')
  @Can('update', 'landing_page')
  restore(@Param('id') id: string): Promise<PageDto> {
    return this.pageService.restore(id);
  }

  @Patch(':slug')
  @Can('update', 'landing_page')
  update(@Param('slug') slug: string, @Body() dto: UpdatePageDto): Promise<PageDto> {
    return this.pageService.update(slug, dto);
  }

  @Delete(':slug')
  @Can('update', 'landing_page')
  remove(@Param('slug') slug: string): Promise<void> {
    return this.pageService.remove(slug);
  }
}
