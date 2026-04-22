import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../database/prisma.service';
import { PERMISSIONS_KEY, type PermissionRequirement } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { JwtPayload } from '../strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (
      (!requiredRoles || requiredRoles.length === 0) &&
      (!requiredPermissions || requiredPermissions.length === 0)
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.',
      });
    }

    if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have permission to access this resource.',
      });
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const permissions = await this.prisma.rolePermission.findMany({
        select: {
          action: { select: { name: true } },
          resource: { select: { name: true } },
        },
        where: {
          role: { name: user.role },
        },
      });
      const permissionSet = new Set(
        permissions.map((permission) => `${permission.action.name}:${permission.resource.name}`),
      );
      const hasPermission = requiredPermissions.some((permission) =>
        permissionSet.has(`${permission.action}:${permission.resource}`),
      );

      if (!hasPermission) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'You do not have permission to access this resource.',
        });
      }
    }

    return true;
  }
}
