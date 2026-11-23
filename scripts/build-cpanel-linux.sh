#!/usr/bin/env bash
set -euo pipefail

apt-get update -qq
apt-get install -y -qq --no-install-recommends zip >/dev/null

mkdir -p /work /stage/frontend/web/.next /stage/backend/api
tar \
  --exclude=.git \
  --exclude=.deploy \
  --exclude=artifacts \
  --exclude=dist \
  --exclude=node_modules \
  --exclude=.next \
  -C /src -cf - . | tar -C /work -xf -

cd /work
export HUSKY=0
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install --frozen-lockfile

if [[ "${DATABASE_PROVIDER}" == "mysql" ]]; then
  pnpm --dir apps/api db:generate:mysql
else
  pnpm --dir apps/api db:generate
fi

pnpm --dir apps/web build
pnpm --dir apps/api build

cp -RL apps/web/.next/standalone/node_modules /stage/frontend/web/
cp -RL apps/web/.next/standalone/node_modules/.pnpm/node_modules/. /stage/frontend/web/node_modules/
cp -RL apps/web/.next/standalone/apps/web/. /stage/frontend/web/
cp -R apps/web/.next/static /stage/frontend/web/.next/
if [[ -d apps/web/public ]]; then cp -R apps/web/public /stage/frontend/web/; fi
cp apps/web/.htaccess /stage/frontend/web/
find /stage/frontend -type f -name '.env*' -delete

cp apps/api/package.json apps/api/passenger_entry.js apps/api/.htaccess /stage/backend/api/
cp -R apps/api/dist apps/api/prisma /stage/backend/api/

cd /stage/backend/api
npm install --no-audit --no-fund
if [[ "${DATABASE_PROVIDER}" == "mysql" ]]; then
  npx prisma generate --schema prisma/schema.mysql.prisma
else
  npx prisma generate --schema prisma/schema.prisma
fi
npm prune --omit=dev --no-audit --no-fund

rm -f /output/frontend-prod.zip /output/backend-prod.zip
cd /stage/frontend
zip -qr /output/frontend-prod.zip .
cd /stage/backend
zip -qr /output/backend-prod.zip .
