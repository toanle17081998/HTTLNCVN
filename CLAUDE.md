# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

HTNC is a full-stack monorepo for a church learning and community platform. It uses **pnpm workspaces** with:
- `apps/web` — Next.js 16 frontend (React 19, Tailwind CSS 4, App Router)
- `apps/api` — NestJS 11 backend (PostgreSQL 16, Redis 7)
- `packages/` — Shared ESLint config, TypeScript configs, shared types (currently stubs)

Requires **Node.js 22 LTS** and **pnpm 10+**.

## Development Commands

### Infrastructure (Docker)
```bash
pnpm infra:up        # Start PostgreSQL, Redis, Adminer (port 8080)
pnpm infra:down      # Stop services
pnpm infra:ps        # Check service status
pnpm infra:logs      # Tail service logs
pnpm infra:reset     # Destroy volumes and reset (destructive)
```

### Frontend (`apps/web`)
```bash
cd apps/web
pnpm dev             # Dev server at port 3000
pnpm build           # Production build
pnpm lint            # ESLint
```

### Backend (`apps/api`)
```bash
pnpm --filter @htnc/api dev               # Watch mode with ts-node
pnpm --filter @htnc/api build             # Compile to dist/
pnpm --filter @htnc/api start             # Run compiled dist/main.js
pnpm --filter @htnc/api test              # Run tests with tsx --test
pnpm --filter @htnc/api db:generate       # Regenerate Prisma client after schema changes
pnpm --filter @htnc/api db:migrate        # Create and apply Prisma migration (dev)
pnpm --filter @htnc/api db:migrate:deploy # Apply migrations in production (no prompt)
pnpm --filter @htnc/api db:seed           # Seed database via prisma/seed.ts
pnpm --filter @htnc/api db:studio         # Open Prisma Studio at localhost:5555
```

Or from root:
```bash
pnpm api:dev
pnpm api:db:generate
pnpm api:db:migrate
pnpm api:db:seed
pnpm api:db:studio
```

## Architecture

### Frontend Structure (`apps/web/src/`)

- `app/` — Next.js App Router pages. Routes use `kebab-case` directories.
- `modules/<domain>/` — Domain-organized UI and business logic. Each domain mirrors a backend module: `article`, `auth`, `course`, `event`, `member`, `notification`, `page`, `prayer-journal`.
- `components/layout/` — Shell, header, navigation (app-wide).
- `components/ui/` — Primitive, stateless controls.
- `providers/` — `AuthProvider` (demo RBAC) and `I18nProvider` (Vietnamese i18n). Both wrap the root layout.
- `lib/` — API clients, utilities, RBAC constants.
- `mockData/` — Typed mock data shaped to match API contracts (used until real endpoints exist).
- `types/` — Shared TypeScript interfaces.
- Path alias: `@/*` → `./src/*`

### Auth & RBAC (Frontend)

Auth is currently **demo/mock only** in `AuthProvider.tsx`. It supports four roles: `guest`, `church-member`, `church-admin`, `system-admin`. Role switching is available in the Settings menu. The `useAuth()` hook provides `role`, `can()`, and `canAny()` helpers. The full capability matrix is defined in `docs/system-rbac-define.md`.

### Backend Structure (`apps/api/src/`)

NestJS modules follow the pattern: `module.ts`, `controller.ts`, `service.ts`, `repository.ts`, `types.ts`.

Implemented modules: `homepage`, `auth`, `member`, `article`, `course`, `event`, `notification`, `prayer-journal`, `page`.

The database layer uses **Prisma ORM** (`@prisma/client` v5). Schema lives at `prisma/schema.prisma`. Seed at `prisma/seed.ts`. Migrations are managed by `prisma migrate dev` and stored in `prisma/migrations/`. `PrismaService` extends `PrismaClient` and is exported as a global provider from `DatabaseModule`.

**Auth:** JWT via `@nestjs/passport`. `JwtStrategy` registered in `AppModule`. Guards (`JwtAuthGuard`, `RolesGuard`) applied globally in `main.ts`. Routes opt out with `@Public()`, restrict by role with `@Roles('admin', 'editor', ...)`.

**Response format:** `TransformInterceptor` wraps all responses as `{ success: true, data, meta: { timestamp } }`. `HttpExceptionFilter` handles errors as `{ success: false, error: { code, message }, meta: { path, timestamp } }`.

### API Response Format

All endpoints return:
```json
{ "success": true, "data": { ... }, "meta": { ... } }
```
Base path: `/api`. See `docs/api-contract.md` for full spec.

### Infrastructure

Docker Compose (`infra/docker/docker-compose.local.yml`) provides:
- PostgreSQL 16 on port 5432 (DB: `htnc`, user/pass: `postgres`)
- Redis 7 on port 6379
- Adminer on port 8080

Environment variables live in root `.env` (copy from `.env.example`). The API also has its own `apps/api/.env`.

## Conventions

- **Language:** Code and identifiers in English; business docs and comments in Vietnamese.
- **Naming:** `kebab-case` for directories, `PascalCase` for React components and files, `SCREAMING_SNAKE_CASE` for constants.
- **Git:** Conventional Commits. Branch format: `feature/<ticket>-<short-name>`, `fix/...`, `hotfix/...`, `release/x.y.z`.
- New backend domains follow the `homepage` module as the reference implementation.
- New frontend pages are scaffolded under `modules/<domain>/` with a corresponding route in `app/`.

## Key Documentation

| File | Purpose |
|------|---------|
| `docs/api-contract.md` | API response format and endpoint specs |
| `docs/system-rbac-define.md` | RBAC capability matrix for all roles |
| `docs/db-schema-v1.md` | Database schema |
| `docs/database_schema_suggestion.md` | Extended schema recommendations |
| `docs/branching-release.md` | Git branching and release strategy |
| `docs/infra-local.md` | Local infrastructure setup guide |

## Next.js 16 Note

This project uses Next.js 16, which has breaking changes relative to earlier versions. Patterns from training data for Next.js 13–15 may not apply. Verify behavior against the actual `next.config.ts` and `apps/web/AGENTS.md` before making assumptions about framework APIs.
