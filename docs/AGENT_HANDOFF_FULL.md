# chrisamaya.work — Full AI Handoff Script

Context for AI agents or developers. Enables: edit/fix content, add/remove pages, fix nav, control colors, run DB commands, and understand what’s available.

---

## 1. Agent DB Access (One-Time Setup)

So the agent can run DB commands without credentials in chat.

### Create `chrisamaya-site/.env.local`

One line:

```
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@HOST:5432/postgres?sslmode=require&uselibpqcompat=true
```

- **HOST:** Use `localhost` if you use an SSH tunnel; otherwise use Coolify internal host `lo80k4ccg04wsw0okw0gcs0o`.
- **Tunnel (from laptop):** `ssh -L 5432:lo80k4ccg04wsw0okw0gcs0o:5432 root@86.48.23.38` (or `ubuntu@` / key-based).

`.env.local` is gitignored. The agent script loads it automatically.

### Commands the agent can run (from `chrisamaya-site/`)

| Command | Purpose |
|---------|---------|
| `npm run db:list` | List all page slugs and titles |
| `npm run db:show -- <slug>` | Show one row (title, block count, nav, footer) |
| `npm run db:sql -- "SELECT ..."` | Run read SQL |
| `npm run db:sql -- "UPDATE ..."` | Run write SQL |
| `npm run db:seed` | Re-run full seed (upserts all pages) |
| `npm run db:seed-missing` | Add blog, search, knowledge-base (if missing) |

---

## 2. Architecture — What Lives Where

| Layer | Source | Edit via |
|-------|--------|----------|
| **Pages, blocks, nav, footer, palette** | `caw_content` table | DB (SQL or seed) — no rebuild |
| **Block types** (hero, cta, value_prop, etc.) | `server/blocks.js` | Code — requires deploy |
| **Layout, CSS, colors** | `views/layout.ejs` | Code — requires deploy |
| **Nav/footer template** | `views/nav.ejs`, `views/footer.ejs` | Code — requires deploy |

Content is DB-driven. Change `caw_content` → site updates on next request. No redeploy for content.

---

## 3. DB Schema — `caw_content`

```sql
caw_content (
  slug TEXT PRIMARY KEY,      -- URL path: '' = home, 'contact', 'blog', etc.
  title TEXT NOT NULL,        -- Browser tab / meta title
  blocks JSONB NOT NULL,      -- Array of { block_type, data }
  palette TEXT NOT NULL,      -- 'emerald' (layout uses data-palette)
  nav JSONB,                  -- Nav bar links (portfolio, custom_apps, growth_tools, cta)
  footer JSONB,               -- { tagline, copyright }
  local_seo JSONB             -- Reserved (meta, schema) — not yet rendered
)
```

Leads: `leads` table, POST `/api/submit-lead`.

---

## 4. Block Types — All Available Elements

Each block: `{ "block_type": "...", "data": { ... } }`. Order in array = order on page.

| block_type | data fields | Purpose |
|------------|-------------|---------|
| **hero** | `badge`, `headline` (HTML ok), `subhead`, `cta_label`, `cta_href`, `warning_text` | Top section, CTA |
| **terminal_problem** | `eyebrow`, `title`, `body`, `bullets[]`, `terminal_logs[]` ({time, msg}), `status_text` | Problem/symptom + logs |
| **solution_cards** | `eyebrow`, `title`, `cards[]` ({title, body, border_color: neon-blue\|neon-green\|neon-pink}) | 3 cards |
| **authority** | `title` (HTML), `body` (HTML), `stats[]` ({value, label}) | Social proof, stats |
| **audit_form** | `title`, `subhead`, `form_title`, `submit_source` | Lead form → /api/submit-lead |
| **cta** | `heading`, `text`, `label`, `href` | Single CTA section |
| **value_prop** | `title`, `body` (HTML) | Title + prose |
| **icon_bullets** | `title`, `bullets[]` ({icon, title, text}) | Feature/testimonial grid |
| **calculator** | `section_title` | Section linking to jumpstartscaling.com calculators (external) |
| **survey** | `section_title` | Section linking to audit form / Moat Audit |
| **diagnosis** | `eyebrow`, `title`, `body`, `video_src` | Video + copy |

**Example block (hero):**

```json
{
  "block_type": "hero",
  "data": {
    "badge": "SERVICES",
    "headline": "What I Build",
    "subhead": "Custom SaaS, APIs, automation.",
    "cta_label": "Get Started",
    "cta_href": "/contact",
    "warning_text": ""
  }
}
```

**Example block (icon_bullets):**

```json
{
  "block_type": "icon_bullets",
  "data": {
    "title": "What Clients Say",
    "bullets": [
      { "icon": "😤", "title": "Zapier keeps breaking", "text": "Self-hosted n8n fixes that." }
    ]
  }
}
```

---

## 5. Nav Structure — `caw_content.nav` (JSONB)

Each page row has `nav`. Update `nav` on every row (or rows you care about) to change the global nav.

```json
{
  "portfolio": [
    { "name": "The Problem", "href": "/#hook" },
    { "name": "Architecture", "href": "/#solution" },
    { "name": "Blog", "href": "/blog" },
    { "name": "How I Build", "href": "/guide/how-i-build" },
    { "name": "Pricing", "href": "/pricing" },
    { "name": "Knowledge Base", "href": "/knowledge-base" },
    { "name": "Search", "href": "/search" }
  ],
  "custom_apps": [
    { "name": "Python & FastAPI", "href": "/services/custom-apps/python-api" },
    ...
  ],
  "growth_tools": [
    { "name": "Jumpstart Scaling", "href": "https://jumpstartscaling.com" },
    ...
  ],
  "cta": { "label": "INITIATE_HANDSHAKE", "href": "#audit" }
}
```

### Add a nav link

```sql
UPDATE caw_content
SET nav = jsonb_set(
  nav,
  '{portfolio}',
  (nav->'portfolio') || '[{"name": "New Page", "href": "/new-page"}]'::jsonb
)
WHERE slug IN ('', 'about', 'contact', 'services');  -- slugs that share nav
```

### Remove a nav link

Rebuild `portfolio` without that item (e.g. filter by name in a subquery). Or copy nav from one row, edit in a JSON tool, then `UPDATE ... SET nav = '...'::jsonb`.

---

## 6. Footer — `caw_content.footer` (JSONB)

```json
{
  "tagline": "The Unicorn Developer.",
  "copyright": "Chris Amaya"
}
```

Moat Audit / Calculators links are hardcoded in `views/footer.ejs`; change them there for a global edit.

---

## 7. Colors & Design — What’s in Code vs DB

### DB-controlled

- **palette** — `caw_content.palette` (e.g. `emerald`). Layout sets `data-palette` on `<html>`. Currently only `emerald` is styled.

### Code-controlled (`views/layout.ejs`)

Colors are in inline CSS. To change them, edit `layout.ejs`:

| CSS var / color | Hex | Used for |
|-----------------|-----|----------|
| `--bg-deep` | #0B0B0F | Page background |
| `--neon-green` | #00FF94 | Primary accent, CTAs, links |
| `--neon-blue` | #00B8FF | Eyebrows, accents |
| `--neon-pink` | #FF00FF | Terminal, errors |
| `--accent` | #E8C677 | Footer headings |
| `--gradient-accent` | linear-gradient(...) | (defined but sparingly used) |

Block backgrounds in `blocks.js`: `#050505`, `#0A0A0A`, `#08080A`, `#000`.

**To change colors:** Edit `server/blocks.js` (per-block) and `views/layout.ejs` (global vars). Requires deploy.

---

## 8. Add / Edit / Remove Pages

### Add a page

```sql
INSERT INTO caw_content (slug, title, blocks, palette, nav, footer)
VALUES (
  'new-slug',
  'New Page | Chris Amaya',
  '[{"block_type":"hero","data":{"badge":"NEW","headline":"New Page","subhead":"...","cta_label":"Get Started","cta_href":"/contact"}},{"block_type":"cta","data":{"heading":"Ready?","text":"...","label":"Book a Call","href":"/contact"}}]'::jsonb,
  'emerald',
  (SELECT nav FROM caw_content WHERE slug = 'about' LIMIT 1),
  (SELECT footer FROM caw_content WHERE slug = 'about' LIMIT 1)
);
```

Then add the nav link (see §5).

### Edit a page (title)

```sql
UPDATE caw_content SET title = 'New Title | Chris Amaya' WHERE slug = 'contact';
```

### Edit a block’s data

```sql
-- Change hero headline (first block, index 0)
UPDATE caw_content
SET blocks = jsonb_set(blocks, '{0,data,headline}', '"New Headline"')
WHERE slug = 'about';
```

### Add a block to a page

```sql
UPDATE caw_content
SET blocks = blocks || '[{"block_type":"cta","data":{"heading":"...","text":"...","label":"...","href":"/contact"}}]'::jsonb
WHERE slug = 'services';
```

### Remove a block

Rebuild `blocks` without that element (e.g. `jsonb_agg` + filter by index). See `ADDING_CONTENT.md` for full example.

### Remove a page

```sql
DELETE FROM caw_content WHERE slug = 'old-slug';
```

Then remove it from `nav.portfolio` on all rows that reference it.

---

## 9. NPM Scripts & Dependencies

### Scripts (`package.json`)

| Script | Command |
|--------|---------|
| `start` | `node server/index.mjs` |
| `dev` | `node --watch server/index.mjs` |
| `db:up` | `docker compose up -d postgres` |
| `db:seed` | `node scripts/seed-chrisamaya.mjs` |
| `db:seed-missing` | `node scripts/seed-missing-pages.mjs` |
| `db:list` | `node scripts/db-query.mjs list` |
| `db:show` | `node scripts/db-query.mjs show` |
| `db:sql` | `node scripts/db-query.mjs sql` |

### Calculators

chrisamaya.work does **not** host calculators. The `calculator` block links to **https://jumpstartscaling.com/resources/calculators**. To change that URL, edit `server/blocks.js` (calculator case).

### NPM deps (relevant to live site)

- **Fastify + EJS + pg** — server, templates, DB.
- **@fastify/static, @fastify/view** — static files, EJS.

Astro, React, recharts, framer-motion, three.js, etc. are in package.json but the **live site** uses Fastify + EJS. Those deps are for legacy/trash or future use.

---

## 10. Key Files

| File | Purpose |
|------|---------|
| `server/index.mjs` | Routes, handlePage, API |
| `server/blocks.js` | Block rendering (all block types) |
| `server/db.js` | getPageData, pool |
| `views/layout.ejs` | HTML shell, CSS vars, nav/footer include |
| `views/page.ejs` | Renders blocksHtml |
| `views/nav.ejs` | Nav from `nav` prop |
| `views/footer.ejs` | Footer from `footer` prop (some links hardcoded) |
| `scripts/seed-chrisamaya.mjs` | Full seed |
| `scripts/seed-missing-pages.mjs` | Supplemental pages |
| `scripts/db-query.mjs` | Agent DB access (list, show, sql) |
| `schema.sql` | caw_seed, caw_content |

---

## 11. Coolify & Deploy

- **Coolify URL:** http://86.48.23.38:8000
- **caw app UUID:** `wcowowk4gc8o0kowc8wsocgk`
- **Token:** COOLIFY_TOKEN from Coolify → Keys & Tokens
- **DATABASE_URL:** From Coolify → chrisamaya.work (or god-mode-api) → Environment

Seed runs on container start (Dockerfile CMD). No rebuild needed for content changes via DB.

---

## 12. Quick Reference — What the Agent Can Do

| Task | Method |
|------|--------|
| List pages | `npm run db:list` |
| Inspect a page | `npm run db:show -- blog` |
| Edit page title | `UPDATE caw_content SET title = '...' WHERE slug = '...'` |
| Edit block data | `jsonb_set(blocks, '{i,data,field}', '"value"')` |
| Add block | `blocks = blocks || '[{...}]'::jsonb` |
| Add page | `INSERT INTO caw_content (...)` |
| Remove page | `DELETE FROM caw_content WHERE slug = '...'` |
| Fix nav | `UPDATE caw_content SET nav = ...` (see §5) |
| Change footer | `UPDATE caw_content SET footer = '{"tagline":"...","copyright":"..."}'::jsonb` |
| Change colors | Edit `layout.ejs` and `blocks.js` (requires deploy) |
| Add block type | Edit `server/blocks.js` (requires deploy) |
| Re-seed all | `npm run db:seed` (with DATABASE_URL) |
