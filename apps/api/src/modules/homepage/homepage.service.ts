import { Injectable } from '@nestjs/common';

import { getEnv } from '../../config/env';
import type { HomepagePayload, HomepageQuery } from './homepage.types';
import { HomepageRepository } from './homepage.repository';

type HomepageCacheEntry = {
  expiresAt: number;
  payload: HomepagePayload;
};

@Injectable()
export class HomepageService {
  private readonly cache = new Map<string, HomepageCacheEntry>();
  private readonly cacheTtlMs = getEnv().homepageCacheTtlSeconds * 1000;

  constructor(private readonly homepageRepository: HomepageRepository) {}

  async getHomepage(query: HomepageQuery): Promise<HomepagePayload> {
    const cacheKey = this.buildCacheKey(query);
    const now = Date.now();
    const cachedEntry = this.cache.get(cacheKey);

    if (cachedEntry && cachedEntry.expiresAt > now) {
      return cachedEntry.payload;
    }

    if (cachedEntry) {
      this.cache.delete(cacheKey);
    }

    const payload = await this.homepageRepository.getHomepagePayload(query);

    this.cache.set(cacheKey, {
      expiresAt: now + this.cacheTtlMs,
      payload,
    });

    return payload;
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
