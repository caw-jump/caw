# chrisamaya.work — Standalone Astro Shell

Astro thin shell for chrisamaya.work. All content from Postgres. No factory, no god-mode API.

## Architecture

- **Pages, blocks, nav, footer** → Direct Postgres (`caw_seed`, `caw_content` — minimal schema)
- **Forms** → POST `/api/submit-lead` → INSERT `leads` (uses same DB as god-mode)
- **DATABASE_URL** — Same Postgres as god-mode-api. No new DB; no localhost by default.

## Quick Start

```bash
cp .env.example .env
# Set DATABASE_URL (copy from Coolify → god-mode-api → env, or use the same value)
# Format: postgresql://postgres:PASSWORD@lo80k4ccg04wsw0okw0gcs0o:5432/postgres?sslmode=require
npm install
npm run build
npm run preview
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
