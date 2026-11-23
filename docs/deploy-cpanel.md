# Deploy to cPanel

Deploy the frontend and backend as two separate Node.js applications:

- Frontend: `https://example.com`
- Backend: `https://api.example.com`

The server must provide Node.js 22 or newer and Phusion Passenger. The current deployment continues using the existing Neon PostgreSQL database.

## 1. Build the ZIP files locally

Docker Desktop must be running. From the repository root, run:

```powershell
pnpm build:cpanel -- `
  -AppUrl "https://example.com" `
  -ApiUrl "https://api.example.com" `
  -DatabaseProvider postgresql
```

This creates:

- `artifacts/frontend-prod.zip`
- `artifacts/backend-prod.zip`

The local Docker build uses Linux so native Prisma, Sharp, and FFmpeg packages match cPanel. Do not build the deployment `node_modules` directly on Windows.

## 2. Create the cPanel applications

Create two applications in **Setup Node.js App** or **Application Manager**.

### Frontend

- Application root: the extracted frontend `web` directory
- Application URL: `https://example.com`
- Application startup file: `server.js`
- Environment: `production`

Upload and extract `frontend-prod.zip`, then use its `web` directory as the application root. Passenger reads the included `.htaccess` and supplies `PORT` automatically.

### Backend

- Application root: the extracted backend `api` directory
- Application URL: `https://api.example.com`
- Application startup file: `passenger_entry.js`
- Environment: `production`

Upload and extract `backend-prod.zip`, then use its `api` directory as the application root. Ensure the application user can write to `uploads/`:

```bash
mkdir -p uploads tmp
touch tmp/restart.txt
```

Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` through cPanel environment variables. Do not expose the application root as a static document root.

## 3. Database and restart

Run pending PostgreSQL migrations against Neon before starting the new backend. Prisma is a development dependency, so install it temporarily and prune it afterward:

```bash
npm install --include=dev --no-audit --no-fund
npx prisma migrate deploy --schema prisma/schema.prisma
npm prune --omit=dev --no-audit --no-fund
```

The later MySQL migration will require a separate MySQL schema, migration history, and converted data import.

Restart either Passenger application after uploading a new archive:

```bash
mkdir -p tmp
touch tmp/restart.txt
```

Finally verify:

- `https://api.example.com/api/health/live`
- `https://api.example.com/api/health/ready`
- image uploads under `https://api.example.com/uploads/...`
- login and one frontend page that loads API data
