import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';

import type { JwtPayload } from '../strategies/jwt.strategy';
import { AuditBufferService } from '../performance/audit-buffer.service';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditBuffer: AuditBufferService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const userId = request.user?.sub;

    return next.handle().pipe(tap({
      next: () => {
        if (!userId || !MUTATING_METHODS.has(request.method)) return;
        this.auditBuffer.enqueue({
          event_type: `${request.method} ${request.route?.path ?? request.path}`.slice(0, 50),
          metadata: {
            controller: context.getClass().name,
            handler: context.getHandler().name,
            params: request.params,
          },
          user_id: userId,
        });
      },
    }));
  }
}

