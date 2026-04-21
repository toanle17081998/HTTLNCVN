import { BadRequestException } from '@nestjs/common';

import type { HomepageIncludeKey, HomepageQuery } from './homepage.types';

const INCLUDE_ORDER: HomepageIncludeKey[] = ['posts', 'courses', 'events'];

const DEFAULT_QUERY: HomepageQuery = {
  featuredCoursesLimit: 6,
  include: INCLUDE_ORDER,
  latestPostsLimit: 6,
  upcomingEventsLimit: 4,
};

const ALLOWED_INCLUDE = new Set<HomepageIncludeKey>(INCLUDE_ORDER);

function parseLimit(
  rawValue: string | string[] | undefined,
  field: string,
  fallback: number,
): number {
  if (rawValue === undefined) {
    return fallback;
  }

  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const normalizedValue = value.trim();

  if (!/^\d+$/.test(normalizedValue)) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: `Invalid query parameter: ${field}`,
    });
  }

  const parsed = Number(normalizedValue);

  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: `Invalid query parameter: ${field}`,
    });
  }

  return parsed;
}

export function parseHomepageQuery(
  query: Record<string, string | string[] | undefined>,
): HomepageQuery {
  const includeValue = query.include;
  let include = DEFAULT_QUERY.include;

  if (includeValue !== undefined) {
    const rawItems = (Array.isArray(includeValue) ? includeValue.join(',') : includeValue)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (rawItems.length > 0) {
      const uniqueItems = [...new Set(rawItems)];

      for (const item of uniqueItems) {
        if (!ALLOWED_INCLUDE.has(item as HomepageIncludeKey)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `Invalid query parameter: include`,
          });
        }
      }

      include = INCLUDE_ORDER.filter((item) => uniqueItems.includes(item));
    }
  }

  return {
    featuredCoursesLimit: parseLimit(
      query.featured_courses_limit,
      'featured_courses_limit',
      DEFAULT_QUERY.featuredCoursesLimit,
    ),
    include,
    latestPostsLimit: parseLimit(
      query.latest_posts_limit,
      'latest_posts_limit',
      DEFAULT_QUERY.latestPostsLimit,
    ),
    upcomingEventsLimit: parseLimit(
      query.upcoming_events_limit,
      'upcoming_events_limit',
      DEFAULT_QUERY.upcomingEventsLimit,
    ),
  };
}
