import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { config as loadDotEnv } from 'dotenv';

type EnvShape = {
  appName: string;
  databaseUrl: string;
  jwt: {
    accessExpiresIn: string;
    accessSecret: string;
    refreshExpiresIn: string;
    refreshSecret: string;
  };
  port: number;
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

function requireString(name: string): string {
  const value = process.env[name];

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

export function getEnv(): EnvShape {
  if (cachedEnv) {
    return cachedEnv;
  }

  loadEnvFile();

  cachedEnv = {
    appName: process.env.APP_NAME ?? 'htnc-api',
    databaseUrl: requireString('DATABASE_URL'),
    jwt: {
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      accessSecret: requireString('JWT_ACCESS_SECRET'),
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      refreshSecret: requireString('JWT_REFRESH_SECRET'),
    },
    port: parsePort('PORT', 3001),
  };

  return cachedEnv;
}
