import { Injectable, NotFoundException } from '@nestjs/common';

import { PageRepository } from './page.repository';
import type {
  CreatePageDto,
  PageDto,
  PageListResult,
  UpdatePageDto,
} from './page.types';

@Injectable()
export class PageService {
  constructor(private readonly pageRepository: PageRepository) {}

  findAll(status?: string): Promise<PageListResult> {
    return this.pageRepository.findAll(status);
  }

  async findBySlug(slug: string): Promise<PageDto> {
    const page = await this.pageRepository.findBySlug(slug);

    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }

    return page;
  }

  async findByPath(path: string): Promise<PageDto> {
    const page = await this.pageRepository.findByPath(path);

    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }

    return page;
  }

  create(dto: CreatePageDto, creatorId: string): Promise<PageDto> {
    return this.pageRepository.create(dto, creatorId);
  }

  async update(slug: string, dto: UpdatePageDto): Promise<PageDto> {
    const page = await this.pageRepository.update(slug, dto);

    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }

    return page;
  }

  remove(slug: string): Promise<void> {
    return this.pageRepository.remove(slug);
  }
}
