# AI Handoff — chrisamaya.work + Coolify + Postgres + Seed

Context for AI agents or developers taking over. All credentials use placeholders; fill from Coolify or `.env.local`.

---

## Coolify

### Base URL
```
COOLIFY_URL=http://86.48.23.38:8000
```

### API token
- **Var:** `COOLIFY_TOKEN` or `COOLIFY_API_TOKEN`
- **Where to get:** Coolify UI → Keys & Tokens → Create API token
- **Use:** Scripts read from env or `.env.local` / `god-mode/.env.local`

```bash
# Example
export COOLIFY_TOKEN=your_token_here
```

### App UUIDs (Coolify API)
| App | UUID |
|-----|------|
| chrisamaya.work (caw) | `wcowowk4gc8o0kowc8wsocgk` |
| god-mode-api | `d8ws44sgkcs4wkog8gsokgok` |
| JFactory | `asws8oco480c8s8k8c408css` |

### Relevant scripts (`god-mode/`)
- `scripts/fix-caw-database-url-ssl.mjs` — Fix caw `DATABASE_URL` SSL params
- `scripts/create-chrisamaya-coolify-app.mjs` — Create caw app in Coolify
- `scripts/set-all-coolify-env-vars.mjs` — Set env vars for all apps

### Coolify API usage
```bash
# From god-mode/
COOLIFY_TOKEN=xxx node scripts/fix-caw-database-url-ssl.mjs [--deploy]
COOLIFY_TOKEN=xxx node scripts/create-chrisamaya-coolify-app.mjs [--deploy]
COOLIFY_TOKEN=xxx node scripts/set-all-coolify-env-vars.mjs [--deploy]
```

---

## SSH / server

Coolify runs on `86.48.23.38` (port 8000 for UI). SSH access is configured in Coolify. There is no hardcoded SSH config in this repo; use Coolify’s server settings or your own SSH keys.

- **Coolify UI:** `http://86.48.23.38:8000`
- **SSH:** Same host, standard SSH (user/key from your setup)

---

## Postgres

### Connection
- **Source of truth:** Coolify → god-mode-api (or chrisamaya.work) → Environment Variables → `DATABASE_URL`
- **Typical format (internal):**
  ```
  postgresql://postgres:PASSWORD@lo80k4ccg04wsw0okw0gcs0o:5432/postgres?sslmode=require
  ```
- **SSL:** Append `uselibpqcompat=true&sslmode=require` if missing (pg.js compatibility)
- **Where host comes from:** Coolify internal Docker network hostname for the Postgres service

### chrisamaya.work tables
Schema: `chrisamaya-site/schema.sql`

```sql
-- caw_seed: key-value store for theme, homepage_blocks, pages (JSONB)
-- caw_content: one row per page (slug, title, blocks, palette, nav, footer, local_seo)
```

### Leads
- Stored in `leads` table (created by app)
- Submitted via POST `/api/submit-lead`

---

## Seed

### Main seed
- **Script:** `chrisamaya-site/scripts/seed-chrisamaya.mjs`
- **Effect:** Creates `caw_seed`, `caw_content`; upserts all pages
- **Runs on container start:** Yes (see Dockerfile `CMD`)

```bash
# Local / one-off
cd chrisamaya-site
DATABASE_URL="postgresql://..." node scripts/seed-chrisamaya.mjs
# or
DATABASE_URL="postgresql://..." npm run db:seed
```

### Supplemental seed (missing pages)
- **Script:** `chrisamaya-site/scripts/seed-missing-pages.mjs`
- **Effect:** Adds blog, search, knowledge-base
- **Use when:** Main seed doesn’t have these or you want to add them without redeploy

```bash
cd chrisamaya-site
DATABASE_URL="postgresql://..." node scripts/seed-missing-pages.mjs
# or
DATABASE_URL="postgresql://..." npm run db:seed-missing
```

### Seed from production DB (no redeploy)
- **DATABASE_URL:** Copy from Coolify → chrisamaya.work → Environment
- Run either seed script locally with that URL

### Seeded slugs
| Slug | Type |
|------|------|
| `''` (home) | Homepage |
| about, contact, audit, terms, privacy, services | Core |
| resources/calculators, guide/how-i-build | Core |
| blog, search, knowledge-base | Core |
| services/custom-apps/python-api, frontend, full-stack, database, google-apis, wordpress, calculators, 3d-visual | Offer pages |

### Block types (server/blocks.js)
`hero`, `terminal_problem`, `solution_cards`, `authority`, `audit_form`, `calculator`, `survey`, `cta`, `value_prop`, `icon_bullets`

---

## Docker

### chrisamaya.work Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY server ./server
COPY views ./views
COPY public ./public
COPY scripts ./scripts
COPY schema.sql ./
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["sh", "-c", "node scripts/seed-chrisamaya.mjs 2>/dev/null || true; exec node server/index.mjs"]
```

- Seed runs on every container start (idempotent via `ON CONFLICT DO UPDATE`)
- Server: Fastify + EJS on port 4321

---

## Env vars (reference)

| Var | Where | Purpose |
|-----|-------|---------|
| `DATABASE_URL` | Coolify env | Postgres connection string |
| `COOLIFY_TOKEN` | `.env.local` or env | Coolify API auth |
| `COOLIFY_URL` | optional | Default `http://86.48.23.38:8000` |
| `HOST` | Docker/Coolify | `0.0.0.0` |
| `PORT` | Docker/Coolify | `4321` |

---

## Quick commands

```bash
# Seed from host (use prod DATABASE_URL from Coolify)
cd chrisamaya-site
DATABASE_URL="postgresql://..." npm run db:seed
DATABASE_URL="postgresql://..." npm run db:seed-missing

# Coolify scripts (from god-mode/)
COOLIFY_TOKEN=xxx node scripts/fix-caw-database-url-ssl.mjs --deploy
COOLIFY_TOKEN=xxx node scripts/set-all-coolify-env-vars.mjs --deploy

# Exec into container and seed (only if scripts exist in image)
docker exec -it <container> sh
cd /app && node scripts/seed-missing-pages.mjs
```

---

## Implementation Plan — Direct-DB Architecture

chrisamaya.work uses a **DB-driven shell** — no god-mode API, no factory. Content is read directly from Postgres (`caw_content`). Fastify + EJS render at request time.

### What Lives Where

| Layer | Source | Rebuild? |
|-------|--------|----------|
| **Routes** | Fastify (catch-all `/*`) | Only when adding new route types |
| **Block types** | `server/blocks.js` | Only when adding a new component |
| **Pages, blocks, nav, footer** | `caw_content` | No — DB at request time |
| **Theme, palette** | Per-row in `caw_content` | No |

### Request Flow (Direct DB)

1. Request hits Fastify (e.g. `/contact`).
2. `handlePage()` normalizes path to slug → `getPageData(slug)` queries `caw_content`.
3. Returns `{ page, blocks, palette, nav, footer }`.
4. `renderBlocks(blocks)` maps each `block_type` to HTML in `blocks.js`.
5. EJS layout renders nav, blocks, footer.

### Adding Content Without Rebuild

- Insert/update rows in `caw_content` — seed script or direct SQL.
- New pages appear immediately. No deploy.

---

## Content Reference — Blocks, Pages, SEO

### Block Types (`server/blocks.js`)

Each block: `{ block_type, data }`. Order = array order in `blocks`.

| block_type | Data fields | Notes |
|------------|-------------|-------|
| **hero** | `badge`, `headline`, `subhead`, `cta_label`, `cta_href`, `warning_text` | Headline can include HTML (e.g. `<br>`, `<span>`) |
| **terminal_problem** | `eyebrow`, `title`, `body`, `bullets[]`, `terminal_logs[]` ({time, msg}), `status_text` | Problem/symptom section |
| **solution_cards** | `eyebrow`, `title`, `cards[]` ({title, body, border_color: neon-blue\|neon-green\|neon-pink}) | 3-col grid |
| **authority** | `title`, `body` (HTML), `stats[]` ({value, label}) | Social proof / credibility |
| **audit_form** | `title`, `subhead`, `form_title`, `submit_source` | Posts to `/api/submit-lead` |
| **cta** | `heading`, `text`, `label`, `href` | Conversion block |
| **value_prop** | `title`, `body` (HTML) | 2-col or prose |
| **icon_bullets** | `title`, `bullets[]` ({icon, title, text}) | Feature grid |
| **calculator** | `section_title` | Links to jumpstartscaling calculators |
| **survey** | `section_title` | Links to audit form |
| **diagnosis** | `eyebrow`, `title`, `body`, `video_src` | Video + copy |

### Page Catalog (Seeded)

| Slug | Title | Block layout |
|------|-------|--------------|
| `''` | The One-Stop Architect | hero → terminal_problem → solution_cards → authority → audit_form → calculator → survey |
| about | About \| Chris Amaya | hero, cta |
| contact | Contact \| Chris Amaya | hero, cta |
| audit | Technical Audit | hero, cta |
| terms | Terms of Service | value_prop |
| privacy | Privacy Policy | value_prop |
| services | Services | hero, cta |
| resources/calculators | Calculators | hero, calculator |
| guide/how-i-build | How I Build | hero, value_prop, cta |
| blog | Blog | hero, value_prop, cta |
| search | Search | hero, value_prop, cta |
| knowledge-base | Knowledge Base | hero, value_prop, cta |
| services/custom-apps/python-api | Python & FastAPI | hero, value_prop, cta |
| services/custom-apps/frontend | Astro, React & Vite | hero, value_prop, cta |
| services/custom-apps/full-stack | Full-Stack | hero, value_prop, cta |
| services/custom-apps/database | PostgreSQL | hero, value_prop, cta |
| services/custom-apps/google-apis | Google Solar, Roofing & Maps | hero, value_prop, cta |
| services/custom-apps/wordpress | Headless WordPress | hero, value_prop, cta |
| services/custom-apps/calculators | React Calculators | hero, value_prop, cta |
| services/custom-apps/3d-visual | Three.js, Rive & Spline | hero, value_prop, cta |

### Nav Structure (from seed)

Stored in each row as `nav` JSONB:

```json
{
  "portfolio": [
    { "name": "The Problem", "href": "/#hook" },
    { "name": "Architecture", "href": "/#solution" },
    { "name": "Blog", "href": "/blog" },
    { "name": "How I Build", "href": "/guide/how-i-build" },
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

### Footer Structure

```json
{
  "tagline": "The Unicorn Developer.",
  "copyright": "Chris Amaya"
}
```

### SEO (caw_content.local_seo)

`local_seo` JSONB is supported by the schema but not yet used by the layout. Intended structure:

```json
{
  "meta_title": "Contact | Chris Amaya",
  "meta_description": "Book a technical strategy session.",
  "canonical": "https://chrisamaya.work/contact",
  "og_image": "https://chrisamaya.work/og.jpg",
  "schema": {
    "LocalBusiness": { "name": "Chris Amaya", "url": "https://chrisamaya.work", ... },
    "WebSite": { "url": "https://chrisamaya.work", "potentialAction": { "@type": "SearchAction", "target": "..." } },
    "BreadcrumbList": { "itemListElement": [...] }
  }
}
```

Current layout uses `title` from `page.title` and a fallback `description`. To add per-page meta: extend `handlePage` to pass `local_seo` and render in `layout.ejs`.

### Block Data Shape (for seed / inserts)

```js
// Single block
{ block_type: 'hero', data: { badge: 'ABOUT', headline: 'About Chris', subhead: '...', cta_label: '...', cta_href: '...' } }

// Full page blocks array
[
  { block_type: 'hero', data: { ... } },
  { block_type: 'value_prop', data: { title: '...', body: '<p>HTML</p>' } },
  { block_type: 'cta', data: { heading: '...', text: '...', label: '...', href: '/contact' } }
]
```

---

## Full Implementation Plan (Phases)

Adapted from the original plan — **direct DB only**, no god-mode/factory.

### Phase 1: Content & Blocks

- Ensure all block types in `blocks.js` match seed usage.
- Add `local_seo` to seed for key pages (meta, schema).
- Add new block types as needed: `social_proof`, `glass_card`, `bento_grid`, `icon_bullets` (already present).

### Phase 2: Knowledge Base / Articles

- KB main page: `/knowledge-base` — seeded as placeholder. To add real articles: new table (e.g. `caw_articles`) or extend schema.
- Search: `/search` — placeholder. Full-text search would require indexing `caw_content` or a search service.

### Phase 3: Navigation & SEO

- Nav/footer come from DB per page.
- Add `local_seo` rendering in layout: meta tags, JSON-LD (LocalBusiness, WebSite, BreadcrumbList).

### Phase 4: Caching (Optional)

- Add `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on page responses.
- CDN purge on content update (pluggable).

### Phase 5: Offer Pages

- All 8 offer pages are seeded. Add more blocks (e.g. `icon_bullets`, `diagnosis`) via seed updates if needed.

---

## Key Files

| File | Purpose |
|------|---------|
| `chrisamaya-site/server/index.mjs` | Fastify routes, handlePage, API |
| `chrisamaya-site/server/blocks.js` | Block rendering |
| `chrisamaya-site/server/db.js` | getPageData, pool |
| `chrisamaya-site/views/layout.ejs` | HTML shell, nav, footer |
| `chrisamaya-site/views/page.ejs` | Renders blocksHtml |
| `chrisamaya-site/views/nav.ejs` | Nav from `nav` prop |
| `chrisamaya-site/scripts/seed-chrisamaya.mjs` | Full seed (caw_seed, caw_content) |
| `chrisamaya-site/scripts/seed-missing-pages.mjs` | Supplemental pages |
| `chrisamaya-site/schema.sql` | caw_seed, caw_content |
