# Repo Structure

## Root layout

```text
apps/        # ung dung chay truc tiep
packages/    # config, shared type, utility dung chung
infra/       # docker, deploy template, CI helper
docs/        # tai lieu ky thuat va quy trinh
```

## Responsibility

- `apps/web`: giao dien public + admin frontend
- `apps/api`: auth, CMS, API domain, scheduling, integration
- `packages/shared-types`: DTO/type contract giua FE va BE
- `packages/eslint-config`: bo lint rule dung chung
- `packages/tsconfig`: tsconfig base va tsconfig app presets
- `infra/docker`: moi truong local va service dependency

## Domain-first rule

Khong to chuc code theo kieu technical layer thuần tuy o cap cao nhat. Cap cao nhat phai la domain:

- Tot: `modules/course`, `modules/blog`, `modules/member`
- Khong tot: `controllers`, `services`, `entities` o root roi tron domain vao trong

## Suggested MVP domain order

1. `auth`
2. `member`
3. `blog`
4. `course`
5. `page`

`event`, `notification`, `prayer-journal` mo rong o phase sau.
