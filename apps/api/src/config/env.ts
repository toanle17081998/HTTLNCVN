import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadDotEnv } from 'dotenv';

type EnvShape = {
  appName: string;
  databaseUrl?: string;
  homepageCacheTtlSeconds: number;
  port: number;
  postgres: {
    database: string;
    host: string;
    password: string;
    port: number;
    user: string;
  };
};

let cachedEnv: EnvShape | null = null;

function loadEnvFile(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(__dirname, '../../.env'),
  ];

  const envPath = candidates.find((candidate) => existsSync(candidate));

  if (envPath) {
    loadDotEnv({ path: envPath });
  }
}

function requireString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parsePort(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`Invalid port value for ${name}: ${rawValue}`);
  }

  return parsedValue;
}

function parsePositiveInteger(name: string, fallback: number): number {
  const rawValue = process.env[name];

  if (!rawValue) {
    return fallback;
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(`Invalid integer value for ${name}: ${rawValue}`);
  }

  return Number(rawValue);
}

export function getEnv(): EnvShape {
  if (cachedEnv) {
    return cachedEnv;
  }

  loadEnvFile();

  cachedEnv = {
    appName: process.env.APP_NAME ?? 'htnc-api',
    databaseUrl: process.env.DATABASE_URL,
    homepageCacheTtlSeconds: parsePositiveInteger('HOMEPAGE_CACHE_TTL_SECONDS', 300),
    port: parsePort('PORT', 3001),
    postgres: {
      database: requireString('POSTGRES_DB', 'htnc'),
      host: requireString('POSTGRES_HOST', 'localhost'),
      password: requireString('POSTGRES_PASSWORD', 'postgres'),
      port: parsePort('POSTGRES_PORT', 5432),
      user: requireString('POSTGRES_USER', 'postgres'),
    },
  };

  return cachedEnv;
}
