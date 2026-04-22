import { SetMetadata } from '@nestjs/common';

export type AppRole = 'admin' | 'editor' | 'instructor' | 'member';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
