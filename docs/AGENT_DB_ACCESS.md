# Agent DB Access — One-Time Setup

So the Cursor agent can run database commands (list pages, show content, run SQL) without you pasting credentials every time.

---

## 1. Create `.env.local` with your DB URL

In **chrisamaya-site** (same folder as this file), create a file named **`.env.local`** with one line:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@HOST:5432/postgres?sslmode=require&uselibpqcompat=true
```

- **YOUR_PASSWORD** — from Coolify (god-mode-api or chrisamaya.work env).
- **HOST** — either:
  - **Coolify internal:** `lo80k4ccg04wsw0okw0gcs0o` (only works from inside Coolify’s network, e.g. from a container).
  - **From your laptop:** use an SSH tunnel (see below), then set host to `localhost`.

`.env.local` is in `.gitignore` — it will never be committed.

---

## 2. (Optional) SSH tunnel so your laptop can reach the DB

If the DB is only reachable inside Coolify, from your machine run:

```bash
ssh -L 5432:lo80k4ccg04wsw0okw0gcs0o:5432 root@86.48.23.38
```

Leave that terminal open. Then in `.env.local` use:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/postgres?sslmode=require&uselibpqcompat=true
```

---

## 3. What the agent can run

From **chrisamaya-site**, the agent can run:

| Command | What it does |
|--------|----------------|
| `npm run db:list` | List all page slugs and titles |
| `npm run db:show -- blog` | Show one page (slug, title, block count, nav, footer) |
| `npm run db:sql -- "SELECT slug FROM caw_content"` | Run any SQL (read or write) |

Or directly:

```bash
node scripts/db-query.mjs list
node scripts/db-query.mjs show contact
node scripts/db-query.mjs sql "UPDATE caw_content SET title = 'New Title' WHERE slug = 'about'"
```

The script **loads `.env.local` automatically**, so the agent does not need the URL in chat.

---

## 4. Summary

- You: create **chrisamaya-site/.env.local** with **DATABASE_URL** (and use the tunnel if needed).
- Agent: runs `npm run db:list`, `db:show`, `db:sql` (or `node scripts/db-query.mjs ...`) from **chrisamaya-site** and can read/update the DB.

No credentials in the repo; no need to paste the URL again.
