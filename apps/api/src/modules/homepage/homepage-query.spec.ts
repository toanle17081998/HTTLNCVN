import test from 'node:test';
import assert from 'node:assert/strict';

import { parseHomepageQuery } from './homepage-query';

test('returns default homepage query values', () => {
  const query = parseHomepageQuery({});

  assert.deepEqual(query, {
    featuredCoursesLimit: 6,
    include: ['posts', 'courses', 'events'],
    latestPostsLimit: 6,
    upcomingEventsLimit: 4,
  });
});

test('normalizes include order to canonical cache-friendly order', () => {
  const query = parseHomepageQuery({
    include: 'events,posts',
  });

  assert.deepEqual(query.include, ['posts', 'events']);
});

test('rejects malformed integer query params', () => {
  assert.throws(
    () =>
      parseHomepageQuery({
        latest_posts_limit: '1abc',
      }),
    /Invalid query parameter: latest_posts_limit/,
  );

  assert.throws(
    () =>
      parseHomepageQuery({
        featured_courses_limit: '2.5',
      }),
    /Invalid query parameter: featured_courses_limit/,
  );
});

test('rejects unsupported include values', () => {
  assert.throws(
    () =>
      parseHomepageQuery({
        include: 'posts,unknown',
      }),
    /Invalid query parameter: include/,
  );
});
