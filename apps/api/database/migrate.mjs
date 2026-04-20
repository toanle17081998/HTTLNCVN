import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');
const migrationsDir = join(__dirname, 'migrations');
const envPath = join(repoRoot, '.env');

const direction = process.argv[2] ?? 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Usage: node apps/api/database/migrate.mjs <up|down> [migration_name]');
  process.exit(1);
}

const env = readEnvFile(envPath);
const composeFile = env.COMPOSE_FILE ?? 'infra/docker/docker-compose.local.yml';
const service = env.POSTGRES_SERVICE ?? 'postgres';
const dbUser = env.POSTGRES_USER ?? 'postgres';
const dbName = env.POSTGRES_DB ?? 'htnc';
const targetMigration = process.argv[3];

await ensureMigrationTable();

if (direction === 'up') {
  await migrateUp();
} else {
  await migrateDown();
}

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .reduce((result, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return result;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return result;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
      result[key] = value;
      return result;
    }, {});
}

function migrationName(fileName) {
  return fileName.replace(/\.(up|down)\.sql$/, '');
}

function getMigrationFiles(suffix) {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith(suffix))
    .sort();
}

async function migrateUp() {
  const applied = new Set(await getAppliedMigrations());
  const pending = getMigrationFiles('.up.sql')
    .filter((file) => !applied.has(migrationName(file)))
    .filter((file) => !targetMigration || migrationName(file) === targetMigration);

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const file of pending) {
    const name = migrationName(file);
    console.log(`Applying ${name}...`);
    await runSqlFile(join(migrationsDir, file));
    await runSql(
      'INSERT INTO schema_migrations (name) VALUES ($$' +
        name.replace(/\$/g, '$$$$') +
        '$$);',
    );
    console.log(`Applied ${name}.`);
  }
}

async function migrateDown() {
  const applied = await getAppliedMigrations();
  const name = targetMigration ?? applied.at(-1);

  if (!name) {
    console.log('No applied migrations to roll back.');
    return;
  }

  if (!applied.includes(name)) {
    console.error(`Migration is not applied: ${name}`);
    process.exit(1);
  }

  const file = join(migrationsDir, `${name}.down.sql`);
  if (!existsSync(file)) {
    console.error(`Rollback file not found: ${basename(file)}`);
    process.exit(1);
  }

  console.log(`Rolling back ${name}...`);
  await runSqlFile(file);
  await runSql('DELETE FROM schema_migrations WHERE name = $$' + name.replace(/\$/g, '$$$$') + '$$;');
  console.log(`Rolled back ${name}.`);
}

async function ensureMigrationTable() {
  await runSql(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name varchar(255) PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations() {
  const output = await runSql(
    'SELECT name FROM schema_migrations ORDER BY name;',
    ['-A', '-t'],
  );

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function runSqlFile(filePath) {
  const sql = readFileSync(filePath, 'utf8');
  await runSql(sql, [], { logOutput: true });
}

function dockerComposeArgs(psqlArgs) {
  return [
    'compose',
    '-f',
    composeFile,
    '--env-file',
    '.env',
    'exec',
    '-T',
    service,
    'psql',
    '-v',
    'ON_ERROR_STOP=1',
    '-U',
    dbUser,
    '-d',
    dbName,
    ...psqlArgs,
  ];
}

function runSql(sql, extraPsqlArgs = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', dockerComposeArgs([...extraPsqlArgs, '-c', sql]), {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (options.logOutput && stdout.trim()) {
        console.log(stdout.trim());
      }

      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr.trim() || `psql exited with code ${code}`));
    });
  });
}
