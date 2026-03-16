# chrisamaya.work — Fastify SSR (no build)

DB-driven SSR. Fastify + EJS + pg. No build step; templates rendered at request time.

## Architecture

- **Pages, blocks, nav, footer** → Direct Postgres (`caw_content`)
- **Forms** → POST `/api/submit-lead` → INSERT `leads`

## Quick Start

```bash
cp .env.example .env
# Set DATABASE_URL to your Postgres connection string
npm install
npm run dev   # or npm run start
```

## Seed

Creates `caw_seed` and `caw_content` tables.

```bash
DATABASE_URL=... npm run db:seed
```

## Health Check

`GET /api/health` returns `{ ok, db, tables }` or error with hint.
