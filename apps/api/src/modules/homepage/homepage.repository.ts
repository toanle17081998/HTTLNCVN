import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { readSqlFile } from '../../database/sql-file';
import type { HomepagePayload, HomepageQuery } from './homepage.types';

type HomepagePayloadRow = {
  homepage_payload: HomepagePayload;
};

const HOMEPAGE_SQL = readSqlFile('database', 'queries', 'homepage-aggregate.sql');

@Injectable()
export class HomepageRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHomepagePayload(query: HomepageQuery): Promise<HomepagePayload> {
    try {
      const result = await this.databaseService.query<HomepagePayloadRow>(HOMEPAGE_SQL, [
        query.latestPostsLimit,
        query.featuredCoursesLimit,
        query.upcomingEventsLimit,
        query.include,
      ]);

      return result.rows[0].homepage_payload;
    } catch (error) {
      const maybePgError = error as { code?: string };

      if (maybePgError.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException({
          code: 'DATABASE_UNAVAILABLE',
          message: 'PostgreSQL is not reachable. Start the local database first.',
        });
      }

      throw error;
    }
  }
}
