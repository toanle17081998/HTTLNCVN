import { Injectable } from '@nestjs/common';

import { HealthRepository } from './health.repository';

@Injectable()
export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  live() {
    return { status: 'ok' };
  }

  async ready() {
    await this.healthRepository.pingDatabase();
    return { database: 'ok', status: 'ok' };
  }
}
