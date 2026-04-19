# Local Infra

## Services

- `postgres:16-alpine`
- `redis:7-alpine`
- `adminer:4`

## Startup

1. Copy `.env.example` thanh `.env`
2. Chay `pnpm infra:up`
3. Kiem tra `pnpm infra:ps`

## Default local connection

### PostgreSQL

- Host: `localhost`
- Port: `5432`
- Database: `htnc`
- Username: `postgres`
- Password: `postgres`
- URL: `postgresql://postgres:postgres@localhost:5432/htnc?schema=public`

### Redis

- Host: `localhost`
- Port: `6379`
- DB: `0`
- URL: `redis://localhost:6379/0`

### Adminer

- URL: `http://localhost:8080`
- System: `PostgreSQL`
- Server: `postgres`

## Notes

- PostgreSQL co init script tai `infra/docker/postgres/init/01-init.sql`
- Redis dung file config rieng tai `infra/docker/redis/redis.conf`
- `pnpm infra:reset` se xoa volume local cua PostgreSQL va Redis
