import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { firstValueFrom, from, type Observable } from 'rxjs';

import { CacheService } from '../performance/cache.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const CACHE_RULES = [
  { prefix: '/api/pages/resolve', ttlMs: 30_000 },
  { prefix: '/api/pages/navigation', ttlMs: 30_000 },
  { prefix: '/api/articles', ttlMs: 15_000 },
  { prefix: '/api/courses', ttlMs: 15_000 },
  { prefix: '/api/course-categories', ttlMs: 60_000 },
  { prefix: '/api/events', ttlMs: 10_000 },
];

@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.method !== 'GET') {
      this.cache.invalidate('http:');
      this.cache.invalidate('report:');
      this.cache.invalidate('role:');
      return next.handle();
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic || request.headers.authorization) return next.handle();

    const rule = CACHE_RULES.find(({ prefix }) => request.originalUrl.startsWith(prefix));
    if (!rule) return next.handle();

    const key = `http:${request.originalUrl}`;
    response.setHeader('Cache-Control', `public, max-age=5, s-maxage=${Math.floor(rule.ttlMs / 1000)}, stale-while-revalidate=30`);
    return from(this.cache.getOrSet(key, rule.ttlMs, () => firstValueFrom(next.handle())));
  }
}

