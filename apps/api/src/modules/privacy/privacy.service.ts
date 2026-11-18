import { Injectable, NotFoundException } from '@nestjs/common';

import { PrivacyRepository } from './privacy.repository';

@Injectable()
export class PrivacyService {
  constructor(private readonly privacyRepository: PrivacyRepository) {}

  async exportUserData(userId: string) {
    const user = await this.privacyRepository.findUserData(userId);
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found.' });
    return { exported_at: new Date().toISOString(), user };
  }
}

