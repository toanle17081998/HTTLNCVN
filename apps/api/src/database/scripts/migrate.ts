import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { Client } from 'pg';

import { getEnv } from '../../config/env';
import { resolveAppPath } from '../../config/paths';

type MigrationExpectation = {
  tables: Record<string, string[]>;
};

const MIGRATION_EXPECTATIONS: Record<string, MigrationExpectation> = {
  '20260420_000001_content_v1.up.sql': {
    tables: {
      users: ['id', 'email', 'password_hash', 'full_name', 'role', 'status'],
      posts: ['id', 'author_id', 'slug', 'title', 'status', 'published_at'],
      courses: ['id', 'instructor_id', 'slug', 'title', 'level', 'visibility'],
      lessons: ['id', 'course_id', 'slug', 'position', 'lesson_type', 'status'],
      course_enrollments: ['id', 'course_id', 'user_id', 'status'],
      course_progresses: ['id', 'enrollment_id', 'percent_complete', 'last_lesson_id'],
      lesson_progresses: ['id', 'course_id', 'enrollment_id', 'lesson_id', 'progress_percent'],
    },
  },
  '20260420_000002_events_homepage_v1.up.sql': {
    tables: {
      events: ['id', 'organizer_id', 'slug', 'title', 'starts_at', 'status', 'visibility'],
    },
  },
};

function createClient(): Client {
  const env = getEnv();

  return env.databaseUrl
    ? new Client({ connectionString: env.databaseUrl })
    : new Client({
        database: env.postgres.database,
        host: env.postgres.host,
        password: env.postgres.password,
        port: env.postgres.port,
        user: env.postgres.user,
      });
}

async function getExistingTables(client: Client, tableNames: string[]): Promise<Set<string>> {
  if (tableNames.length === 0) {
    return new Set();
  }

  const result = await client.query<{ table_name: string }>(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[]);
    `,
    [tableNames],
  );

  return new Set(result.rows.map((row) => row.table_name));
}

async function getExistingColumns(
  client: Client,
  tableNames: string[],
): Promise<Map<string, Set<string>>> {
  if (tableNames.length === 0) {
    return new Map();
  }

  const result = await client.query<{ column_name: string; table_name: string }>(
    `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[]);
    `,
    [tableNames],
  );

  const columnsByTable = new Map<string, Set<string>>();

  for (const row of result.rows) {
    const existingColumns = columnsByTable.get(row.table_name) ?? new Set<string>();
    existingColumns.add(row.column_name);
    columnsByTable.set(row.table_name, existingColumns);
  }

  return columnsByTable;
}

async function main(): Promise<void> {
  const client = createClient();
  const migrationsDir = resolveAppPath('database', 'migrations');
  const migrationFiles = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.up.sql'))
    .sort();

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id serial PRIMARY KEY,
        filename varchar(255) NOT NULL UNIQUE,
        executed_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const executedRows = await client.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    );
    const executedSet = new Set(executedRows.rows.map((row) => row.filename));

    for (const filename of migrationFiles) {
      if (executedSet.has(filename)) {
        console.log(`Skipping ${filename}`);
        continue;
      }

      const expectation = MIGRATION_EXPECTATIONS[filename];
      const expectedTables = Object.keys(expectation?.tables ?? {});
      const existingTables = await getExistingTables(client, expectedTables);
      const existingColumnsByTable = await getExistingColumns(client, expectedTables);

      if (expectedTables.length > 0 && existingTables.size === expectedTables.length) {
        const invalidTables = expectedTables
          .map((tableName) => {
            const expectedColumns = expectation.tables[tableName];
            const existingColumns = existingColumnsByTable.get(tableName) ?? new Set<string>();
            const missingColumns = expectedColumns.filter((column) => !existingColumns.has(column));

            return {
              missingColumns,
              tableName,
            };
          })
          .filter((table) => table.missingColumns.length > 0);

        if (invalidTables.length === 0) {
          console.log(`Marking ${filename} as already applied`);
          await client.query(
            'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
            [filename],
          );
          continue;
        }

        throw new Error(
          [
            `Migration ${filename} found existing tables with incompatible columns.`,
            ...invalidTables.map(
              (table) =>
                `${table.tableName} missing columns: ${table.missingColumns.join(', ')}`,
            ),
            'Use a clean database or align the schema before retrying migrations.',
          ].join(' '),
        );
      }

      if (existingTables.size > 0) {
        const missingTables = expectedTables.filter((table) => !existingTables.has(table));

        throw new Error(
          [
            `Migration ${filename} appears partially applied.`,
            `Existing tables: ${[...existingTables].join(', ')}`,
            `Missing tables: ${missingTables.join(', ')}`,
            'Use a clean database or align the schema before retrying migrations.',
          ].join(' '),
        );
      }

      const sql = readFileSync(resolve(migrationsDir, filename), 'utf8');

      console.log(`Running ${filename}`);
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [filename],
      );
    }

    console.log('Migrations completed');
  } finally {
    await client.end();
  }
}

void main();
