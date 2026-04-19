# API App Placeholder

Vi tri danh cho backend `NestJS`.

## Internal structure target

```text
src/
|-- modules/
|   |-- auth/
|   |-- member/
|   |-- blog/
|   |-- course/
|   |-- event/
|   |-- page/
|   |-- notification/
|   `-- prayer-journal/
|-- common/
|-- config/
|-- database/
`-- main.ts
```

## Notes

- Giu `module-first`, khong don het moi thu vao `common/`
- Auth, member, blog, course la 4 domain MVP uu tien
- DB nen co migration strategy ro rang ngay tu dau

## Database v1

- ERD va schema rationale: `../../docs/db-schema-v1.md`
- Baseline migration: `database/migrations/20260420_000001_content_v1.up.sql`
- Rollback baseline: `database/migrations/20260420_000001_content_v1.down.sql`
