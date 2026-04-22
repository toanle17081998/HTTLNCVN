import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Reflector } from '@nestjs/core';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http/http-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { getEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = getEnv();
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors();

  await app.listen(env.port);

  console.log(`HTNC API listening on http://localhost:${env.port}/api`);
}

void bootstrap();
