# Cursor AI + Database (Postgres) — MCP Setup (Video Script + Step‑By‑Step)

This is a **clean, accurate** version of the process you described.

- Works for **PostgreSQL** (and the same pattern applies to MySQL/Supabase).
- Uses Cursor’s **MCP (Model Context Protocol)** integration.
- Includes a **shot list** and **screenshot placeholders**.
- **No secrets** are written into this repo.

> Security note: don’t paste production credentials into chat. Use a **read‑only DB user** and keep connection strings in `~/.cursor/` or `.cursor/mcp.json` (gitignored).

---

## What you’ll show in the video (outline)

1. What MCP is (30 seconds)
2. Prereqs (Cursor + Node + DB + connection string)
3. Create a **read‑only** DB user (Postgres)
4. If needed: SSH tunnel so `localhost:5432` reaches the DB
5. Add an MCP server in Cursor (two options)
   - Settings UI
   - Project config `.cursor/mcp.json`
6. Test in Chat: “list tables”, “describe table”, “run query”
7. Troubleshooting checklist

---

## Prereqs

- Cursor installed
- Node.js installed (18+ recommended)
- A running Postgres database
- A connection string (`DATABASE_URL`) for a **read‑only** DB user

Optional but common:
- SSH access to the server where Postgres is reachable (for tunneling)

---

## Step 1 — Create a read‑only Postgres user

Run this in Postgres as an admin user (NOT in Cursor):

```sql
-- 1) create user
CREATE ROLE cursor_readonly LOGIN PASSWORD 'REPLACE_ME';

-- 2) allow connect
GRANT CONNECT ON DATABASE postgres TO cursor_readonly;

-- 3) allow read in public schema
GRANT USAGE ON SCHEMA public TO cursor_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO cursor_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO cursor_readonly;

-- Optional: allow read from views too
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO cursor_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO cursor_readonly;
```

### Screenshot placeholder

- `screenshots/01-create-readonly-user.png`

---

## Step 2 — (If needed) Create an SSH tunnel

If your DB host is only reachable from inside your server network (common with Coolify/internal hosts), tunnel it.

```bash
ssh -L 5432:YOUR_INTERNAL_DB_HOST:5432 root@YOUR_SERVER_IP
```

Now Postgres is reachable at `localhost:5432` on your laptop.

### Screenshot placeholders

- `screenshots/02-ssh-tunnel-terminal.png`
- `screenshots/03-psql-localhost-test.png`

Quick test:

```bash
psql "postgresql://cursor_readonly:REPLACE_ME@localhost:5432/postgres?sslmode=require" -c "\\dt"
```

---

## Step 3 — Add Postgres MCP server to Cursor

There are two good ways.

### Option A (recommended): Project config `.cursor/mcp.json`

1. In your project, create:
   - `.cursor/mcp.json` (this file is **gitignored** in this repo)
2. Use this template (also committed as `.cursor/mcp.example.json`):

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://cursor_readonly:REPLACE_ME@localhost:5432/postgres?sslmode=require"
      }
    }
  }
}
```

3. Save.
4. Fully quit Cursor and reopen it.

### Screenshot placeholders

- `screenshots/04-mcp-json-file.png`
- `screenshots/05-restart-cursor.png`

---

### Option B: Cursor Settings UI

1. Open Cursor → **Settings** (`Cmd+,` / `Ctrl+,`).
2. Find **Tools & MCP** (or “MCP Servers”).
3. Click **Add server**.
4. Type:
   - Name: `postgres`
   - Type: `command`
   - Command: `npx`
   - Args: `-y @modelcontextprotocol/server-postgres`
   - Env: `DATABASE_URL=...`
5. Save.
6. Restart Cursor.

### Screenshot placeholders

- `screenshots/06-settings-tools-mcp.png`
- `screenshots/07-add-server-form.png`
- `screenshots/08-connected-indicator.png`

---

## Step 4 — Test the connection in Cursor chat

Open a new chat and try:

1. **List tables**
   - “List all tables in my database.”
2. **Describe schema**
   - “Describe the `caw_content` table.”
3. **Run a safe query**
   - “Select 5 rows from `caw_content` showing slug and title.”

Expected: Cursor can read tables/columns and run SELECT queries.

### Screenshot placeholders

- `screenshots/09-chat-list-tables.png`
- `screenshots/10-chat-describe-table.png`
- `screenshots/11-chat-select-query.png`

---

## Troubleshooting

- **No green connected indicator**
  - Quit Cursor completely and reopen.
  - Ensure Node is installed (`node -v`).
  - Run the MCP server command once in terminal:
    ```bash
    npx -y @modelcontextprotocol/server-postgres
    ```
- **Can’t connect to DB**
  - If the DB host is internal, you must use an SSH tunnel and connect via `localhost`.
  - Confirm the connection string works with `psql`.
- **Permissions errors**
  - Use a read‑only user, but make sure it has `USAGE` on schema + `SELECT` on tables.

---

## Important security notes (say this in the video)

- Use a **read‑only** DB user for Cursor.
- Never commit credentials. Keep them in:
  - `.cursor/mcp.json` (gitignored)
  - or Cursor settings
- Rotate any password you accidentally paste into chat.

---

## Repo additions included

- `chrisamaya-site/.cursor/mcp.example.json` — safe template
- `.gitignore` updated to include `.cursor/mcp.json`

