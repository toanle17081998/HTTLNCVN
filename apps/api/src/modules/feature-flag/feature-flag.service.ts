import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';

export const featureFlagKeys = ['event', 'prayer-journal'] as const;
export type FeatureFlagKey = (typeof featureFlagKeys)[number];

@Injectable()
export class FeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Record<FeatureFlagKey, boolean>> {
    const flags = await this.prisma.featureFlag.findMany({
      where: { key: { in: [...featureFlagKeys] } },
    });
    const values = new Map(flags.map((flag) => [flag.key, flag.enabled]));

    return {
      event: values.get('event') ?? true,
      'prayer-journal': values.get('prayer-journal') ?? true,
    };
  }

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
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

    return this.findAll();
  }
}
