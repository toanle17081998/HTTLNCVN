import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { Can } from '../../common/decorators/permissions.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { ArticleService } from './article.service';
import type {
  ArticleDto,
  ArticleListResult,
  CreateArticleDto,
  UpdateArticleDto,
} from './article.types';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Public()
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('category_id') categoryId?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
  ): Promise<ArticleListResult> {
    return this.articleService.findAll(
      { status, category_id: categoryId !== undefined ? Number(categoryId) : undefined },
      Number(skip),
      Number(take),
    );
  }

  @Public()
  @Get('categories')
  findCategories(): Promise<{ id: number; name: string }[]> {
    return this.articleService.findCategories();
  }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<ArticleDto> {
    return this.articleService.findBySlug(slug);
  }

  @Can('create', 'article')
  @Post()
  create(
    @Body() dto: CreateArticleDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ArticleDto> {
    return this.articleService.create(dto, req.user.sub);
  }

  @Can('update', 'article')
  @Patch(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateArticleDto): Promise<ArticleDto> {
    return this.articleService.update(slug, dto);
  }

  @Can('delete', 'article')
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('slug') slug: string): Promise<void> {
    return this.articleService.delete(slug);
  }
}
