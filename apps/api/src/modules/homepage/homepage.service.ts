import { Injectable } from '@nestjs/common';

import { getEnv } from '../../config/env';
import { HomepageRepository } from './homepage.repository';
import type {
  HomepageContentDto,
  HomepageQuery,
  HomepageResult,
  UpdateHomepageContentDto,
} from './homepage.types';

type HomepageCacheEntry = {
  expiresAt: number;
  result: HomepageResult;
};

@Injectable()
export class HomepageService {
  private readonly cache = new Map<string, HomepageCacheEntry>();
  private readonly cacheTtlMs = getEnv().homepageCacheTtlSeconds * 1000;

  constructor(private readonly homepageRepository: HomepageRepository) {}

  async getHomepage(query: HomepageQuery): Promise<HomepageResult> {
    const cacheKey = this.buildCacheKey(query);
    const now = Date.now();
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > now) {
      return cachedEntry.result;
    }

    if (cachedEntry) {
      this.cache.delete(cacheKey);
    }

    const data = await this.homepageRepository.getHomepageData(query);

    const result: HomepageResult = {
      data,
      meta: {
        generated_at: new Date().toISOString(),
        included: query.include,
      },
    };

    this.cache.set(cacheKey, { expiresAt: now + this.cacheTtlMs, result });

    return result;
  }

  getContent(): Promise<HomepageContentDto> {
    return this.homepageRepository.getContent();
  }

  async updateContent(dto: UpdateHomepageContentDto): Promise<HomepageContentDto> {
    this.cache.clear();
    return this.homepageRepository.updateContent(dto);
  }

  private buildCacheKey(query: HomepageQuery): string {
    return [
      'homepage',
      query.include.join(','),
      `posts:${query.latestPostsLimit}`,
      `courses:${query.featuredCoursesLimit}`,
      `events:${query.upcomingEventsLimit}`,
    ].join('|');
  }
}
