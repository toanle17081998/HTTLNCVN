import assert from 'node:assert/strict';
import test from 'node:test';

import { ForbiddenException } from '@nestjs/common';

import { RolesGuard } from './roles.guard';

function context(user?: { role: string; sub: string }) {
  return {
    getClass: () => class TestController {},
    getHandler: () => function handler() {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as never;
}

test('allows a request when the role has the required permission', async () => {
  const reflector = {
    getAllAndOverride: (key: string) => key === 'permissions'
      ? [{ action: 'update', resource: 'member' }]
      : undefined,
  };
  const prisma = {
    rolePermission: {
      findMany: async () => [{ action: { name: 'update' }, resource: { name: 'member' } }],
    },
  };
  const cache = { getOrSet: async (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader() };
  const guard = new RolesGuard(reflector as never, prisma as never, cache as never);

  assert.equal(await guard.canActivate(context({ role: 'church_admin', sub: 'user-1' })), true);
});

test('denies a request when the role lacks the required permission', async () => {
  const reflector = {
    getAllAndOverride: (key: string) => key === 'permissions'
      ? [{ action: 'delete', resource: 'member' }]
      : undefined,
  };
  const prisma = { rolePermission: { findMany: async () => [] } };
  const cache = { getOrSet: async (_key: string, _ttl: number, loader: () => Promise<unknown>) => loader() };
  const guard = new RolesGuard(reflector as never, prisma as never, cache as never);

  await assert.rejects(
    () => guard.canActivate(context({ role: 'church_member', sub: 'user-2' })),
    ForbiddenException,
  );
});

