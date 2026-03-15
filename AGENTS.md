# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Single-project Fastify SSR website (no build step). Renders EJS templates with content from PostgreSQL at request time.

- **Runtime**: Node.js >=22, npm
- **Server**: Fastify on port 4321
- **Database**: PostgreSQL 16 (via Docker Compose on host port 5433)

### Running the dev environment

Standard commands are in `README.md` and `package.json` scripts. Key sequence:

1. Start Docker daemon: `sudo dockerd &>/tmp/dockerd.log &` then `sudo chmod 666 /var/run/docker.sock`
2. Start Postgres: `docker compose up -d postgres` (port 5433)
3. Set env: `export DATABASE_URL="postgresql://caw:caw_local@127.0.0.1:5433/chrisamaya"`
4. Seed DB (first time): `npm run db:seed`
5. Dev server: `DATABASE_URL="postgresql://caw:caw_local@127.0.0.1:5433/chrisamaya" npm run dev`

### Non-obvious caveats

- The `leads` table is not created by `schema.sql` or the seed script — it comes from the external god-mode-api. For local dev, create it manually:
  ```sql
  docker exec workspace-postgres-1 psql -U caw -d chrisamaya -c "CREATE TABLE IF NOT EXISTS leads (id SERIAL PRIMARY KEY, source TEXT, name TEXT, email TEXT, phone TEXT, website TEXT, revenue TEXT, budget TEXT, problem TEXT, form_type TEXT, data_json JSONB, created_at TIMESTAMPTZ DEFAULT NOW());"
  ```
- `db.js` disables SSL cert verification for local connections containing `127.0.0.1` — this is by design.
- Many dependencies in `package.json` (Astro, React, Three.js, etc.) are legacy from an abandoned frontend in `trash/`. Only `fastify`, `@fastify/view`, `@fastify/static`, `ejs`, and `pg` are used by the active SSR server.
- `npm run dev` uses `node --watch` for hot reload. Restarting the process is needed after installing new deps.
- There is no lint or test configuration in this project. No ESLint, no test framework.
