import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function resolveAppPath(...relativePath: string[]): string {
  const candidates = [
    resolve(process.cwd(), 'apps/api'),
    resolve(__dirname, '../..'),
    process.cwd(),
  ];

  const appRoot = candidates.find(
    (candidate) =>
      existsSync(resolve(candidate, 'package.json')) &&
      existsSync(resolve(candidate, 'database')),
  );

  if (!appRoot) {
    throw new Error('Unable to resolve apps/api root path');
  }

  return resolve(appRoot, ...relativePath);
}
