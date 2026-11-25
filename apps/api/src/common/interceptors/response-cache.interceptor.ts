import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { firstValueFrom, from, tap, type Observable } from 'rxjs';

import { CacheService } from '../performance/cache.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

const CACHE_RULES: Array<{ allowAuth?: boolean; exactOrQuery?: boolean; prefix: string; ttlMs: number }> = [
  { allowAuth: true, prefix: '/api/pages/resolve', ttlMs: 30_000 },
  { allowAuth: true, prefix: '/api/pages/navigation', ttlMs: 30_000 },
  { allowAuth: true, prefix: '/api/articles', ttlMs: 15_000 },
  { allowAuth: true, exactOrQuery: true, prefix: '/api/courses', ttlMs: 15_000 },
  { prefix: '/api/courses', ttlMs: 15_000 },
  { allowAuth: true, prefix: '/api/course-categories', ttlMs: 60_000 },
  { prefix: '/api/events', ttlMs: 10_000 },
];

const MUTATION_INVALIDATION_RULES: Array<{ match: string; prefixes: string[] }> = [
  { match: '/api/pages', prefixes: ['http:/api/pages'] },
  { match: '/api/articles', prefixes: ['http:/api/articles'] },
  { match: '/api/course-categories', prefixes: ['http:/api/course-categories', 'http:/api/courses'] },
  { match: '/api/courses', prefixes: ['http:/api/courses', 'report:'] },
  { match: '/api/events', prefixes: ['http:/api/events', 'report:'] },
  { match: '/api/members', prefixes: ['report:', 'role:'] },
  { match: '/api/church-units', prefixes: ['report:'] },
  { match: '/api/serving-schedules', prefixes: ['report:'] },
  { match: '/api/prayer-journal', prefixes: ['report:'] },
  { match: '/api/prayers', prefixes: ['report:'] },
  { match: '/api/roles', prefixes: ['role:'] },
  { match: '/api/permissions', prefixes: ['role:'] },
];

@Injectable()
export class ResponseCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  private invalidateForMutation(url: string): void {
    const matched = MUTATION_INVALIDATION_RULES.find(({ match }) => url.startsWith(match));
    if (!matched) return;
    for (const prefix of matched.prefixes) {
      this.cache.invalidate(prefix);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    if (request.method !== 'GET') {
      return next.handle().pipe(tap(() => this.invalidateForMutation(request.originalUrl)));
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!isPublic) return next.handle();

    const url = request.originalUrl;
    const rule = CACHE_RULES.find(({ exactOrQuery, prefix }) =>
      exactOrQuery ? url === prefix || url.startsWith(`${prefix}?`) : url.startsWith(prefix),
    );
    if (!rule) return next.handle();
    if (request.headers.authorization && !rule.allowAuth) return next.handle();

    const key = `http:${url}`;
    response.setHeader('Cache-Control', `public, max-age=5, s-maxage=${Math.floor(rule.ttlMs / 1000)}, stale-while-revalidate=30`);
    return from(this.cache.getOrSet(key, rule.ttlMs, () => firstValueFrom(next.handle())));
  }
}

