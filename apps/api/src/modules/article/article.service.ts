import { Injectable, NotFoundException } from '@nestjs/common';

import { ArticleRepository } from './article.repository';
import type {
  ArticleDto,
  ArticleListResult,
  CreateArticleDto,
  UpdateArticleDto,
} from './article.types';

@Injectable()
export class ArticleService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  findAll(
    filters: { category_id?: number; q?: string; status?: string },
    skip: number,
    take: number,
  ): Promise<ArticleListResult> {
    return this.articleRepository.findAll(filters, skip, take);
  }

  async findBySlug(slug: string): Promise<ArticleDto> {
    const article = await this.articleRepository.findBySlug(slug);

    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }

    return article;
  }

  create(dto: CreateArticleDto, creatorId: string): Promise<ArticleDto> {
    return this.articleRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdateArticleDto): Promise<ArticleDto> {
    const article = await this.articleRepository.update(slug, dto);

    if (!article) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Article not found.' });
    }

    return article;
  }

  async delete(slug: string): Promise<void> {
    await this.findBySlug(slug);
    await this.articleRepository.delete(slug);
  }

  findCategories(): Promise<{ id: number; name: string }[]> {
    return this.articleRepository.findCategories();
  }
}
