import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'node:path';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { FeatureFlagGuard } from './common/guards/feature-flag.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { ResponseCacheInterceptor } from './common/interceptors/response-cache.interceptor';
import { CacheService } from './common/performance/cache.service';
import { AuditBufferService } from './common/performance/audit-buffer.service';
import { getEnv } from './config/env';
import { PrismaService } from './database/prisma.service';
import { FeatureFlagService } from './modules/feature-flag/feature-flag.service';

async function bootstrap(): Promise<void> {
  const env = getEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);
  const cache = app.get(CacheService);
  const auditBuffer = app.get(AuditBufferService);
  const featureFlags = app.get(FeatureFlagService);

  app.setGlobalPrefix('api');
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (response) => {
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });
  app.getHttpAdapter().getInstance().set('trust proxy', env.trustProxyHops);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(
    new FeatureFlagGuard(reflector, featureFlags),
    new RateLimitGuard(env.rateLimit.maxRequests, env.rateLimit.windowMs),
    new JwtAuthGuard(reflector),
    new RolesGuard(reflector, prisma, cache),
  );
  app.useGlobalInterceptors(
    new AuditInterceptor(auditBuffer),
    new TransformInterceptor(),
    new ResponseCacheInterceptor(cache, reflector),
  );
  app.enableCors();
  app.enableShutdownHooks();

  await app.listen(env.port);

  console.log(`HTNC API listening on http://localhost:${env.port}/api`);
}

void bootstrap();
