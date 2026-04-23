# HTNC API

NestJS app for the HTNC platform APIs.

## Run

```powershell
pnpm install
pnpm --filter @htnc/api db:migrate
pnpm --filter @htnc/api db:seed
pnpm --filter @htnc/api dev
pnpm --filter @htnc/api test
```

API mac dinh:

- `http://localhost:3001/api`

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
    |-- page/
    `-- ...
```

## Notes

- Controller chi xu ly HTTP
- Service xu ly orchestration
- Repository doc SQL va query PostgreSQL
- Migration va seed dang dung file SQL/raw query de boot nhanh MVP
