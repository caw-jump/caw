# chrisamaya.work — Fastify SSR (no build)

DB-driven SSR. Fastify + EJS + pg. No build step; templates rendered at request time.

## Architecture

- **Pages, blocks, nav, footer** → Direct Postgres (`caw_content`)
- **Forms** → POST `/api/submit-lead` → INSERT `leads`
- **DATABASE_URL** — Same Postgres as god-mode-api.

## Quick Start

```bash
cp .env.example .env
# Set DATABASE_URL (copy from Coolify → god-mode-api → env)
npm install
npm run dev   # or npm run start
```

## Seed

Uses same Postgres as god-mode. Creates `caw_seed` and `caw_content` tables.

```bash
# DATABASE_URL must be set (same as god-mode-api)
npm run db:seed
```

## Coolify Deployment

1. **DATABASE_URL** — Use the same value as god-mode-api. Coolify internal: `postgresql://postgres:PASSWORD@lo80k4ccg04wsw0okw0gcs0o:5432/postgres?sslmode=require`
2. **Set in Coolify** → chrisamaya.work app → Environment Variables: `DATABASE_URL`, `HOST=0.0.0.0`, `PORT=4321`
3. **Run seed** after deploy: `DATABASE_URL=... npm run db:seed` (from god-mode folder or a machine that can reach the DB)
4. **Health check** — `GET /api/health` returns `{ ok, db, tables }` or error with hint

## Cursor AI Admin

Run `scripts/cursor-ai-admin.sql` on the Postgres instance to grant Cursor AI full access.
