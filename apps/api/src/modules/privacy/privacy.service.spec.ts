import assert from 'node:assert/strict';
import test from 'node:test';

import { PrivacyService } from './privacy.service';

test('privacy export scopes the query to the requesting user and excludes credentials', async () => {
  let query: Record<string, unknown> | undefined;
  const prisma = {
    user: {
      findFirst: async (value: Record<string, unknown>) => {
        query = value;
        return {
          created_at: new Date(),
          email: 'member@example.com',
          household_memberships: [],
          lesson_progress: [],
          prayers_created: [],
          profile: null,
          role: { name: 'church_member' },
          status: 'active',
          username: 'member',
        };
      },
    },
  };
  const service = new PrivacyService(prisma as never);

  const result = await service.exportUserData('requesting-user');
  const select = query?.select as Record<string, unknown>;

  assert.deepEqual(query?.where, { deleted_at: null, id: 'requesting-user' });
  assert.equal('password_hash' in select, false);
  assert.equal(result.user.email, 'member@example.com');
});
