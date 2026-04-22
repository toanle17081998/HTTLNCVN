import { SetMetadata } from '@nestjs/common';

export type AppRole =
  | 'guest'
  | 'church_member'
  | 'church_admin'
  | 'system_admin'
  | 'admin'
  | 'editor'
  | 'instructor'
  | 'member';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
