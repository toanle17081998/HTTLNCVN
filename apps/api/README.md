# HTNC API

NestJS app toi thieu cho homepage aggregate API.

## Run

```powershell
pnpm install
pnpm --filter @htnc/api db:migrate
pnpm --filter @htnc/api db:seed
pnpm --filter @htnc/api dev
pnpm --filter @htnc/api test
```

API mac dinh:

- `http://localhost:3001/api/homepage`

## Postman

Method:

- `GET`

URL:

- `http://localhost:3001/api/homepage`

Vi du query params:

- `http://localhost:3001/api/homepage?latest_posts_limit=3&featured_courses_limit=2&upcoming_events_limit=2`
- `http://localhost:3001/api/homepage?include=posts,events`

## Structure

```text
src/
|-- app.module.ts
|-- common/
|   `-- http/
|-- config/
|-- database/
|   `-- scripts/
`-- modules/
    `-- homepage/
```

## Notes

- Controller chi xu ly HTTP
- Service xu ly orchestration
- Repository doc SQL va query PostgreSQL
- Migration va seed dang dung file SQL/raw query de boot nhanh MVP
- Homepage co in-memory cache TTL mac dinh `300` giay, override bang env `HOMEPAGE_CACHE_TTL_SECONDS`
