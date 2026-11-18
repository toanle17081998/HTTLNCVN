# Hosting and 1,000 RPS Deployment

## Capacity interpretation

The hosting account allows up to 100 processes, but the 4 GB memory limit is the tighter constraint. Do not start 100 Node.js workers. Begin with two API workers and one web process. Increase to four API workers only after measuring memory and database latency.

One thousand sustained requests per second is achievable only when most public reads are served from the API cache or an upstream CDN/reverse proxy. It is not a realistic target for uncached MySQL queries on shared hosting.

## Recommended process layout

- 2 API workers initially (`API_WORKERS=2`).
- 1 Next.js standalone web process.
- MySQL supplied by the host.
- Reverse proxy/CDN in front of the web and API applications.
- Increase API workers to 4 only if memory remains below 75% and database connections remain healthy.

The remaining hosting process slots provide headroom for the hosting control panel and short-lived jobs; they should not all be consumed by application workers.

## PostgreSQL deployment

```bash
pnpm install --frozen-lockfile
pnpm api:db:generate
pnpm api:db:migrate:deploy
pnpm api:build
API_WORKERS=2 pnpm api:start:cluster
```

## MySQL deployment

phpMyAdmin is only a database administration interface. The host must also provide a MySQL hostname, port, database, username, and password that the Node.js application can access.

Set the API database URL:

```env
DATABASE_URL=mysql://DB_USER:URL_ENCODED_PASSWORD@DB_HOST:3306/DB_NAME
```

For a new empty MySQL database:

```bash
pnpm install --frozen-lockfile
pnpm api:db:generate:mysql
pnpm api:db:push:mysql
pnpm api:db:seed
pnpm api:build
API_WORKERS=2 pnpm api:start:cluster
```

`db:push:mysql` creates the schema directly because the existing SQL migrations contain PostgreSQL-specific syntax. Back up the MySQL database through the hosting provider before every schema update.

MySQL or MariaDB should use `utf8mb4` with a case-insensitive collation such as `utf8mb4_unicode_ci`. This preserves case-insensitive application searches without PostgreSQL-specific Prisma filters.

Redis is not required. Application caching and throttling use process memory. Each API worker therefore has an independent cache, and changes made through one worker can remain cached by another worker until the short 10–60 second TTL expires.

Limit each worker's database pool in `DATABASE_URL`. With two workers, start with five connections each:

```env
DATABASE_URL=mysql://DB_USER:URL_ENCODED_PASSWORD@DB_HOST:3306/DB_NAME?connection_limit=5&pool_timeout=10
```

## Production environment

```env
NODE_ENV=production
PORT=3001
TRUST_PROXY_HOPS=1
RATE_LIMIT_MAX_REQUESTS=300
RATE_LIMIT_WINDOW_MS=60000
API_WORKERS=2
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
```

For a trusted benchmark source, temporarily raise `RATE_LIMIT_MAX_REQUESTS`; do not disable protection for public production traffic.

## Reverse-proxy requirements

- Cache anonymous `GET` responses for public pages, articles, courses, and events according to their `Cache-Control` headers.
- Enable Brotli or gzip at the proxy.
- Serve Next.js static assets with a long immutable cache lifetime.
- Forward the real client IP and use exactly the configured `TRUST_PROXY_HOPS` value.
- Apply a request-body limit and a 15-second upstream timeout.

Because rate-limit counters are in memory, the effective account-wide limit is the configured limit multiplied by the number of API workers.

## Load-test gates

Test 100, 250, 500, and 1,000 RPS for at least five minutes per stage. Continue only while:

- Error rate stays below 1%.
- p95 latency stays below 500 ms.
- Memory stays below 75%.
- API CPU stays below 70%.
- MySQL has no connection saturation or slow-query growth.

The report endpoint and authenticated write endpoints should be tested separately from cached public traffic. They are not expected to sustain 1,000 database-backed requests per second on this hosting plan.

Run the dependency-free load test from a different machine:

```bash
TARGET_URL="https://api.example.com/api/pages/resolve?path=/" \
RPS=1000 \
DURATION_SECONDS=300 \
pnpm load:test
```

Load balancer health checks can use `/api/health/live`; deployment readiness checks can use `/api/health/ready`.
