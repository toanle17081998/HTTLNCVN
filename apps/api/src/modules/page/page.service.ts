import { Injectable, NotFoundException } from '@nestjs/common';

import { PageRepository } from './page.repository';
import type { PageDto } from './page.types';

@Injectable()
export class PageService {
  constructor(private readonly pageRepository: PageRepository) {}

  async findBySlug(slug: string): Promise<PageDto> {
    const page = await this.pageRepository.findBySlug(slug);

    if (!page) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found.' });
    }

    return page;
  }
}
