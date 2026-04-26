# AGENTS.md

## Purpose
Operate with minimal token usage. Perform only necessary actions to complete the task correctly.

## Core Principles
- Make the smallest possible change
- Avoid unnecessary exploration
- Avoid heavy commands unless required
- Do not refactor unless asked
- Prioritize precision and brevity

## Default Workflow
1. Infer likely file(s)
2. Search for exact match
3. Open only relevant files
4. Apply minimal fix
5. Run targeted checks only if needed
6. Return concise result

---

## File Reading Strategy
- Do not scan the entire repo
- Open only necessary files
- Use search first:

rg "<keyword>"

### Common locations

* Frontend: `apps/web`, `frontend`, `src/app`, `src/components`, `src/modules`
* Backend: `server`, `backend`, `src/routes`, `src/services`, `src/controllers`
* Prisma: `prisma/schema.prisma`
* Migrations: `prisma/migrations`, `flyway`
* State: `src/state`, `src/store`

## Editing Rules

* Modify only required lines
* Do not rename unless necessary
* Do not restructure code
* Preserve existing style
* Avoid new dependencies
* Do not touch unrelated files

## Command Policy

### Allowed (targeted only)

pnpm tsc --noEmit
pnpm lint --filter <target>
pnpm test <file>
pnpm prisma validate
pnpm prisma generate

### Avoid by default

pnpm lint
pnpm test
pnpm build
pnpm format
pnpm install
docker compose up
docker compose down

### Run heavy commands only if:

* User explicitly requests
* Change involves config/build/dependencies
* Cannot validate otherwise

## Frontend Guidelines

* Fix smallest issue first
* Do not redesign UI
* Keep Tailwind changes minimal
* Do not refactor structure
* Avoid unnecessary hooks

## Backend Guidelines

* Follow existing structure
* Do not change auth/RBAC unless required
* Ensure single response per request
* Reuse existing helpers

## Database Guidelines

* Do not create migrations unless asked
* Do not modify seeds unless required
* Prefer:

pnpm prisma validate

## Git Rules

* Do not commit unless asked
* Do not switch branches
* Do not run destructive commands

## Output Format

Changed:
- <file>

Fix:
- <summary>

Checks:
- <run or skipped>

## Token Optimization Rules

* Do not explain obvious code
* Do not repeat context
* Avoid long examples
* Keep responses concise

## Decision Rule

If uncertain:

* Make safest minimal assumption
* Proceed unless blocked

## Strict Prohibitions

* No full repo scans
* No full lint/test/build by default
* No large refactors
* No dependency installs
* No unrelated changes

---

## Priority

1. Correctness
2. Minimal change
3. Token efficiency
4. Speed