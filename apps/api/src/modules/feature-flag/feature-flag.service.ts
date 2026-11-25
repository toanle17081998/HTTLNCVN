import { BadRequestException, Injectable } from '@nestjs/common';

import { CacheService } from '../../common/performance/cache.service';
import { PrismaService } from '../../database/prisma.service';

export const featureFlagKeys = ['event', 'prayer-journal'] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

const FEATURE_FLAGS_CACHE_KEY = 'feature-flags:all';
const FEATURE_FLAGS_TTL_MS = 60_000;

@Injectable()
export class FeatureFlagService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  findAll(): Promise<Record<FeatureFlagKey, boolean>> {
    return this.cache.getOrSet(FEATURE_FLAGS_CACHE_KEY, FEATURE_FLAGS_TTL_MS, async () => {
      const flags = await this.prisma.featureFlag.findMany({
        select: { enabled: true, key: true },
        where: { key: { in: [...featureFlagKeys] } },
      });
      const values = new Map(flags.map((flag) => [flag.key, flag.enabled]));

      return {
        event: values.get('event') ?? true,
        'prayer-journal': values.get('prayer-journal') ?? true,
      };
    });
  }

  async isEnabled(key: string): Promise<boolean> {
    const all = await this.findAll();
    if (key in all) {
      return all[key as FeatureFlagKey];
    }
    const flag = await this.prisma.featureFlag.findUnique({
      select: { enabled: true },
      where: { key },
    });
    return flag?.enabled ?? true;
  }

  async update(key: string, enabled: unknown): Promise<Record<FeatureFlagKey, boolean>> {
    if (!featureFlagKeys.includes(key as FeatureFlagKey) || typeof enabled !== 'boolean') {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: 'Invalid feature flag update.',
      });
    }

    await this.prisma.featureFlag.upsert({
      create: { enabled, key },
      update: { enabled },
      where: { key },
    });

    this.cache.invalidate('feature-flags:');
    return this.findAll();
  }
}
