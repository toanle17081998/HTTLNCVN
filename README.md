# HTNC Platform

Khoi tao cau truc ban dau cho nen tang hoc tap va sinh hoat voi huong kien truc:

- Frontend: `Next.js`
- Backend: `NestJS`
- Database: `PostgreSQL`
- Cache / queue bootstrap: `Redis`
- Kieu repo: `monorepo`

Muc tieu cua phase setup la chot khung repo, convention code, env local, README setup va quy uoc branch/release de team co the scaffold nhanh ma khong phai doi cau truc sau nay.

## 1. Dinh huong kien truc

He thong duoc chia theo domain, uu tien `modular monolith` truoc, chi tach service khi co ly do ro rang ve tai, van hanh hoac deployment.

Domain MVP:

- `auth`
- `member`
- `blog`
- `course`
- `page`
- `event`
- `notification`
- `prayer-journal`

Nguyen tac:

- `start simple`
- `modular by domain`
- `shared contract ro rang giua FE/BE`
- `scale sau khi co usage that`

## 2. Cau truc repo de xuat

```text
HTNC/
|-- apps/
|   |-- web/                 # Next.js app
|   `-- api/                 # NestJS app
|-- packages/
|   |-- shared-types/        # type/interface dung chung
|   |-- eslint-config/       # eslint config dung chung
|   `-- tsconfig/            # tsconfig base dung chung
|-- infra/
|   `-- docker/
|       `-- docker-compose.local.yml
|-- docs/
|   |-- repo-structure.md
|   `-- branching-release.md
|-- .editorconfig
|-- .env.example
|-- .gitignore
|-- .nvmrc
|-- package.json
|-- pnpm-workspace.yaml
`-- README.md
```

Ly do chon monorepo:

- FE va BE dung chung convention, versioning va docs
- De tach `shared-types`, config lint, tsconfig dung chung
- Don gian hon cho local onboarding va CI/CD giai doan dau
- Van du mo rong thanh multi-repo neu can sau nay

## 3. Quy uoc cau truc ben trong tung app

### `apps/web`

```text
src/
|-- app/                     # route, layout, page
|-- modules/                 # UI/business theo domain
|-- components/              # component dung chung
|-- lib/                     # helper, api client, util
|-- hooks/
|-- providers/
|-- styles/
`-- types/
```

Quy uoc:

- Route dung `kebab-case`
- React component dung `PascalCase`
- Hook dung `useXxx.ts`
- Khong de business logic phuc tap trong `page.tsx`
- Tach UI theo domain vao `modules/<domain>`

### `apps/api`

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
|-- common/                  # guard, pipe, interceptor, decorator
|-- config/                  # env, app config, database config
|-- database/                # migration / seed / client wrapper
`-- main.ts
```

Quy uoc:

- Mot module backend = mot domain business
- Moi domain co the co `controller`, `service`, `dto`, `entity`, `repository`
- Khong import cheo tuy tien giua module; giao tiep qua service ro rang
- Logic dung chung dua vao `common/`, khong nhan ban qua nhieu module

## 4. Local development environment

### Cong cu can co

- `Node.js 22 LTS`
- `pnpm 10+`
- `Docker Desktop`

Kiem tra version:

```powershell
node --version
pnpm.cmd --version
docker --version
```

> Windows PowerShell co the chan `pnpm.ps1`. Neu gap loi execution policy, dung `pnpm.cmd` thay cho `pnpm`.

### Cai dependencies

Chay tu root repo, khong chay `npm install` trong `apps/api` hoac `apps/web`:

```powershell
cd C:\code\httlncvn
pnpm.cmd install
```

### Bien moi truong

Copy file mau:

```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env
Copy-Item apps/api/.env.example apps/api/.env
```

Gia tri database local dang dung:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=htnc
POSTGRES_USER=postgres
POSTGRES_PASSWORD=1
DATABASE_URL=postgresql://postgres:1@localhost:5432/htnc?schema=public
```

### Dich vu local

`infra/docker/docker-compose.local.yml` khoi tao:

- `postgres`
- `redis`
- `adminer`
- init script cho PostgreSQL
- redis config rieng cho local persistence

Chay local infra:

```powershell
pnpm.cmd infra:up
```

Kiem tra container:

```powershell
pnpm.cmd infra:ps
```

Dung:

```powershell
pnpm.cmd infra:down
```

Xoa volume de reset local:

```powershell
pnpm.cmd infra:reset
```

Thong tin ket noi local mac dinh:

- PostgreSQL:
  host `localhost`, port `5432`, db `htnc`, user `postgres`, password `1`, SSL `off`
- Redis:
  host `localhost`, port `6379`, db `0`
- Adminer:
  `http://localhost:8080`

Connection string:

```text
postgresql://postgres:1@localhost:5432/htnc
```

Neu DB client bao `database "htnc" does not exist`, thu host `localhost` thay vi `127.0.0.1` va dam bao khong co PostgreSQL local khac dang chiem port `5432`.

### Prisma migrate va seed

Generate Prisma Client:

```powershell
pnpm.cmd api:db:generate
```

Chay migration:

```powershell
pnpm.cmd api:db:migrate
```

Seed du lieu mau neu can:

```powershell
pnpm.cmd api:db:seed
```

Kiem tra build API:

```powershell
pnpm.cmd api:build
```

### Chay backend

Mo terminal 1:

```powershell
cd C:\code\httlncvn
pnpm.cmd api:dev
```

API mac dinh:

```text
http://localhost:3001
http://localhost:3001/api/homepage
```

### Chay frontend

Mo terminal 2:

```powershell
cd C:\code\httlncvn
pnpm --filter web dev
```

Web mac dinh:

```text
http://localhost:5000
```

Port nay lay tu `WEB_PORT` trong file `.env`.

### Thu tu setup nhanh

```powershell
cd C:\code\httlncvn
pnpm install
pnpm infra:up
pnpm api:db:generate
pnpm api:db:migrate
pnpm api:db:seed
pnpm api:build
```

Sau do chay `pnpm api:dev` va `pnpm --filter web dev` o hai terminal rieng.

## 5. Scaffold FE/BE theo vi tri da chot

Repo nay moi chot khung. Khi bat dau code, scaffold app dung dung vi tri sau:

### Tao `Next.js` app

```bash
pnpm dlx create-next-app apps/web --ts --app --src-dir --eslint --use-pnpm
```

### Tao `NestJS` app

```bash
pnpm dlx @nestjs/cli new apps/api --package-manager pnpm --skip-git
```

Sau khi scaffold:

- merge lai `package.json` script o root neu can
- giu dung cau truc domain trong `docs/repo-structure.md`
- khong generate app o root repo

## 6. Convention code

### Naming

- Thu muc: `kebab-case`
- File component React: `PascalCase.tsx`
- File service / util / hook: `camelCase` hoac `kebab-case` theo convention cua app, nhung phai thong nhat trong tung package
- Class TypeScript: `PascalCase`
- Constant: `SCREAMING_SNAKE_CASE`

### Ngon ngu va comment

- Code, ten bien, ten function: dung tieng Anh
- README, docs nghiep vu: co the dung tieng Viet
- Comment chi dung khi logic kho tu nhin ma hieu

### Git / commit

Khuyen nghi dung `Conventional Commits`:

- `feat: add course overview api`
- `fix: handle missing event slug`
- `docs: update local setup`
- `refactor: extract auth guard`

## 7. Quy uoc branch va release

Branch chuan:

- `main`: code production
- `develop`: nhanh tich hop chinh
- `feature/<ticket>-<short-name>`: tinh nang moi
- `fix/<ticket>-<short-name>`: sua loi thuong
- `hotfix/<ticket>-<short-name>`: sua loi production can gap
- `release/x.y.z`: branch chot release

Flow de xuat:

1. Tao nhanh tu `develop`
2. Mo PR vao `develop`
3. Khi chuan bi release, cat `release/x.y.z` tu `develop`
4. Test, fix nho tren branch release
5. Merge `release/x.y.z` vao `main` va merge nguoc lai `develop`
6. Tag `vX.Y.Z` tren `main`

Versioning:

- Theo `Semantic Versioning`
- `MAJOR`: breaking change
- `MINOR`: them tinh nang backward-compatible
- `PATCH`: fix loi / thay doi nho

Chi tiet xem tai [docs/branching-release.md](docs/branching-release.md).

## 8. Checklist phase setup

- [x] Chot monorepo structure
- [x] Chot vi tri FE / BE / packages / infra / docs
- [x] Co env mau cho root, web, api
- [x] Co docker compose local cho postgres / redis / adminer
- [x] Co README setup va quy uoc branch/release
- [ ] Scaffold app `web`
- [ ] Scaffold app `api`
- [ ] Them CI cho lint / test / build

## 9. Buoc tiep theo de bat dau code

1. Scaffold `apps/web` va `apps/api`
2. Them ESLint / Prettier / tsconfig shared vao `packages/`
3. Dung `auth`, `member`, `blog`, `course` lam 4 domain MVP dau tien
4. Setup CI:
   lint, unit test, build
5. Tao `docs/api-contract.md` de chot response format va auth flow

## 10. Tai lieu lien quan

- [Cau truc repo](docs/repo-structure.md)
- [Branching va release](docs/branching-release.md)
- [Local infra](docs/infra-local.md)
- [API contract](docs/api-contract.md)
- [Web app placeholder](apps/web/README.md)
- [API app placeholder](apps/api/README.md)
