import { SetMetadata } from '@nestjs/common';

export type PermissionRequirement = {
  action: string;
  resource: string;
};

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Can = (action: string, resource: string) =>
  Permissions({ action, resource });
