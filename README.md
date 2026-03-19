# chrisamaya.work — Fastify SSR (no build)

DB-driven SSR. Fastify + EJS + pg. No build step; templates rendered at request time.

## Architecture

- **Pages, blocks, nav, footer** → Direct Postgres (`caw_content`)
- If `SITE_DB_PREFIX` (preferred) or `SITE_KEY` (legacy) is set to `ion_arc_biz` or `ion_arc_online`, the server uses `${SITE_DB_PREFIX || SITE_KEY}_pages` + `${SITE_DB_PREFIX || SITE_KEY}_seo` + `${SITE_DB_PREFIX || SITE_KEY}_articles` + `${SITE_DB_PREFIX || SITE_KEY}_locations` for per-site content/SEO.
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

### ion-arc.biz / ion-arc.online

1. **Set in Coolify** (each app separately):
   - `DATABASE_URL` (same as god-mode-api)
   - `SITE_DB_PREFIX=ion_arc_biz` (for ion-arc.biz) or `SITE_DB_PREFIX=ion_arc_online` (for ion-arc.online) (or legacy: `SITE_KEY=...`)
   - `SITE_URL=https://ion-arc.biz` (or `SITE_DOMAIN` alias) or `SITE_URL=https://ion-arc.online`
   - `HOST=0.0.0.0`, `PORT=4321`
2. **Run site seed** after deploy (must reach the DB):
```bash
# ion-arc.biz (recommended)
DATABASE_URL=... SITE_DB_PREFIX=ion_arc_biz SITE_URL=https://ion-arc.biz npm run db:seed-ion-arc

# ion-arc.online (recommended)
DATABASE_URL=... SITE_DB_PREFIX=ion_arc_online SITE_URL=https://ion-arc.online npm run db:seed-ion-arc

# Legacy (still works because seed accepts SITE_KEY):
# DATABASE_URL=... SITE_URL=https://ion-arc.biz npm run db:seed-ion-arc-biz
# DATABASE_URL=... SITE_URL=https://ion-arc.online npm run db:seed-ion-arc-online
```
3. **Health check** — `GET /api/health` should report row counts for `${SITE_DB_PREFIX || SITE_KEY}_pages`.

## Cursor AI Admin

Run `scripts/cursor-ai-admin.sql` on the Postgres instance to grant Cursor AI full access.
