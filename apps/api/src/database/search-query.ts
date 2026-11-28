import { Prisma } from '@prisma/client';

export function trimSearchQuery(query?: string): string | undefined {
  return typeof query === 'string' ? query.trim() || undefined : undefined;
}

export function containsSearchQuery(query?: string) {
  const contains = trimSearchQuery(query);
  if (!contains) return undefined;

  // MySQL uses the column collation and does not expose Prisma's query mode.
  return 'QueryMode' in Prisma ? { contains, mode: 'insensitive' as const } : { contains };
}
