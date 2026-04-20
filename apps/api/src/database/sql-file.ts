import { readFileSync } from 'node:fs';

import { resolveAppPath } from '../config/paths';

export function readSqlFile(...relativePath: string[]): string {
  return readFileSync(resolveAppPath(...relativePath), 'utf8');
}
