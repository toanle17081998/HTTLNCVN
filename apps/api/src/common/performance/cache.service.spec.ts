import assert from 'node:assert/strict';
import test from 'node:test';

import { CacheService } from './cache.service';

test('coalesces concurrent cache misses', async () => {
  const cache = new CacheService();
  let loads = 0;
  const loader = async () => {
    loads += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { value: 42 };
  };

  const [first, second] = await Promise.all([
    cache.getOrSet('key', 1_000, loader),
    cache.getOrSet('key', 1_000, loader),
  ]);

  assert.equal(loads, 1);
  assert.deepEqual(first, { value: 42 });
  assert.deepEqual(second, { value: 42 });
});

test('invalidates entries by prefix', async () => {
  const cache = new CacheService();
  cache.set('http:first', 1, 1_000);
  cache.set('role:admin', 2, 1_000);
  cache.invalidate('http:');

  let loads = 0;
  const value = await cache.getOrSet('http:first', 1_000, async () => {
    loads += 1;
    return 3;
  });

  assert.equal(value, 3);
  assert.equal(loads, 1);
  assert.equal(await cache.getOrSet('role:admin', 1_000, async () => 4), 2);
});
