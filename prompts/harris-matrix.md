# chrisamaya.work — Full Schema & Harris Matrix

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER REQUEST                          │
│                   https://chrisamaya.work                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              COOLIFY (Docker on Hetzner VPS)                 │
│              86.48.23.38:8000                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           FASTIFY SSR SERVER (port 4321)               │  │
│  │           node:22-alpine container                     │  │
│  │                                                        │  │
│  │  server/index.mjs ─── Routes & Request Handling        │  │
│  │  server/db.js     ─── PostgreSQL Pool + Queries        │  │
│  │  server/blocks.js ─── Block → HTML Renderer            │  │
│  │                                                        │  │
│  │  views/layout.ejs ─── HTML Shell (CSS, Nav, Footer)    │  │
│  │  views/page.ejs   ─── Generic Page Template            │  │
│  │  views/blog.ejs   ─── Blog Listing + Articles          │  │
│  │  views/article.ejs── Single Article Template           │  │
│  │  views/404.ejs    ─── Not Found Page                   │  │
│  │  views/nav.ejs    ─── Navigation Partial               │  │
│  │  views/footer.ejs ─── Footer Partial                   │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           POSTGRESQL 16 (shared instance)              │  │
│  │           lo80k4ccg04wsw0okw0gcs0o:5432                │  │
│  │           (also 86.48.23.38:5432 externally)           │  │
│  │                                                        │  │
│  │  caw_content   ─── 20 pages (blocks JSONB)            │  │
│  │  caw_articles  ─── Blog articles (HTML content)        │  │
│  │  caw_seed      ─── Seed metadata (theme, nav)          │  │
│  │  leads         ─── Form submissions                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## I. Database Schema

### Table: `caw_content` (Pages)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `slug` | TEXT | NO (PK) | — | URL path. Empty string = homepage. Example: `services/custom-apps/python-api` |
| `title` | TEXT | NO | — | Page `<title>`. Example: `Python & FastAPI \| Custom Backend \| Chris Amaya` |
| `blocks` | JSONB | NO | `'[]'` | Array of `{block_type, data}` objects. Rendered in order by `blocks.js` |
| `palette` | TEXT | NO | `'emerald'` | Color theme name. Currently only `emerald` is used |
| `nav` | JSONB | YES | — | Navigation config: `{portfolio:[], custom_apps:[], growth_tools:[], cta:{}}` |
| `footer` | JSONB | YES | — | Footer config: `{tagline, copyright}` |
| `local_seo` | JSONB | YES | — | Local SEO overrides (not currently used) |

### Table: `caw_articles` (Blog Posts)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `slug` | TEXT | NO (PK) | — | URL: `/blog/{slug}`. Example: `why-self-hosted-beats-saas` |
| `title` | TEXT | NO | — | Article title |
| `excerpt` | TEXT | YES | — | Short description for cards (<150 chars) |
| `content` | TEXT | NO | — | Full HTML body. Renders inside `<div class="prose prose-invert">` |
| `category` | TEXT | NO | `'infrastructure'` | One of: infrastructure, ai, postgresql, frontend, fastapi, tracking, growth, security |
| `tags` | JSONB | NO | `'[]'` | Array of strings: `["postgres","jsonb"]` |
| `author` | TEXT | NO | `'Chris Amaya'` | Author name |
| `og_image` | TEXT | YES | — | Open Graph image URL |
| `status` | TEXT | NO | `'draft'` | `draft` \| `published` \| `archived` |
| `published_at` | TIMESTAMPTZ | YES | — | Publish date (null = not published) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Auto-set on insert |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Update manually or via ON CONFLICT |

**Indexes:**
- `idx_caw_articles_status` ON (status)
- `idx_caw_articles_category` ON (category)
- `idx_caw_articles_published` ON (published_at DESC) WHERE status = 'published'

### Table: `caw_seed` (Seed Metadata)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `key` | TEXT | NO (PK) | — | `theme`, `homepage_blocks`, or `pages` |
| `value` | JSONB | NO | — | Seed data used by `seed-chrisamaya.mjs` |

### Table: `leads` (Form Submissions)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | NO (PK) | auto | Lead ID |
| `source` | TEXT | YES | — | `ChrisAmayaWork` |
| `name` | TEXT | YES | — | Submitter name |
| `email` | TEXT | YES | — | Submitter email |
| `phone` | TEXT | YES | — | Phone |
| `website` | TEXT | YES | — | Website URL |
| `revenue` | TEXT | YES | — | Revenue range: `500k-1m`, `1m-3m`, `3m+` |
| `budget` | TEXT | YES | — | Budget range: `10k+`, `25k+`, `50k+` |
| `problem` | TEXT | YES | — | Problem description |
| `form_type` | TEXT | YES | — | `architect` |
| `data_json` | JSONB | YES | — | Full form data as JSON |
| `created_at` | TIMESTAMPTZ | YES | `NOW()` | Submission timestamp |

---

## II. Request Flow (Harris Matrix — Stratigraphic Layers)

### Layer 0: DNS & TLS
```
chrisamaya.work → Coolify Proxy (Traefik) → Auto SSL → Container port 4321
```

### Layer 1: HTTP Request → Fastify Router

| Route | Method | Handler | Data Source |
|-------|--------|---------|-------------|
| `/` | GET | `handlePage(req, reply, '')` | `caw_content` WHERE slug = '' |
| `/blog` | GET | Blog listing handler | `caw_content` WHERE slug = 'blog' + `caw_articles` WHERE status = 'published' |
| `/blog/:slug` | GET | Article handler | `caw_articles` WHERE slug = :slug AND status = 'published' |
| `/api/submit-lead` | POST | Lead capture | INSERT INTO `leads` |
| `/api/health` | GET | Health check | SELECT COUNT(*) FROM `caw_content` |
| `/health` | GET | Health check (alt) | SELECT COUNT(*) FROM `caw_content` |
| `/:slug` (catch-all) | GET | `handlePage(req, reply, slug)` | `caw_content` WHERE slug = :slug |

### Layer 2: Database Query

```
getPageData(slug) → SELECT slug, title, blocks, palette, nav, footer FROM caw_content WHERE slug = $1
getArticles()     → SELECT slug, title, excerpt, category, tags, author, og_image, published_at FROM caw_articles WHERE status = 'published' ORDER BY published_at DESC
getArticle(slug)  → SELECT slug, title, excerpt, content, category, tags, author, og_image, published_at FROM caw_articles WHERE slug = $1 AND status = 'published'
```

### Layer 3: Block Rendering (blocks.js)

```
page.blocks (JSONB array) → renderBlocks(blocks) → HTML string
```

Each block object `{block_type, data}` maps to a render function:

```
┌─────────────────────────────────────────────────────────────────┐
│                    BLOCK RENDERING PIPELINE                      │
│                                                                  │
│  blocks[0] ──→ renderBlock({block_type:"hero", data:{...}})     │
│  blocks[1] ──→ renderBlock({block_type:"terminal_problem",...}) │
│  blocks[2] ──→ renderBlock({block_type:"solution_cards",...})   │
│  ...                                                             │
│  Each returns an HTML string. All concatenated = page body.     │
└─────────────────────────────────────────────────────────────────┘
```

### Layer 4: EJS Template Assembly

```
layout.ejs
├── <head> (title, meta, CSS variables, all utility classes)
├── nav.ejs (navigation from page.nav JSONB)
├── <main>
│   ├── page.ejs   → blocksHtml (concatenated block HTML)
│   ├── blog.ejs   → blocksHtml + articleListHtml
│   └── article.ejs → articleHtml
├── footer.ejs (from page.footer JSONB)
└── <script> (mobile drawer JS)
```

---

## III. Block Type Reference (Complete)

### Block Usage Matrix (Harris Grid)

```
                          hero  terminal  solution  authority  audit   cta  value  icon    calc  survey
                                _problem  _cards              _form        _prop  _bullets
─────────────────────────────────────────────────────────────────────────────────────────────────────────
(homepage)                 ●       ●         ●         ●        ●      ·     ·      ·       ●      ●
about                      ●       ●         ●         ●        ●      ●     ·      ●       ·      ·
audit                      ●       ●         ●         ·        ●      ●     ·      ●       ·      ·
blog                       ●       ·         ●         ●        ·      ●     ●      ●       ·      ·
contact                    ●       ·         ●         ·        ●      ●     ●      ●       ·      ·
guide/how-i-build          ●       ●         ●         ·        ●      ●     ●      ●       ·      ·
knowledge-base             ●       ·         ·         ·        ·      ●     ·      ·       ·      ·
privacy                    ●       ·         ·         ·        ·      ●     ●      ·       ·      ·
resources/calculators      ●       ·         ●         ·        ·      ●     ●      ●       ●      ·
search                     ●       ·         ●         ·        ·      ●     ·      ●       ·      ·
services                   ●       ·         ●         ●        ●      ●     ·      ●       ·      ·
services/.../3d-visual     ●       ●         ●         ·        ●      ●     ●      ●       ·      ·
services/.../calculators   ●       ·         ●         ·        ●      ●     ●      ●       ●      ·
services/.../database      ●       ●         ●         ·        ●      ●     ●      ●       ·      ·
services/.../frontend      ●       ●         ●         ·        ●      ●     ●      ●       ·      ·
services/.../full-stack    ●       ●         ●         ·        ●      ●     ●      ●       ·      ·
services/.../google-apis   ●       ·         ●         ·        ●      ●     ●      ●       ·      ·
services/.../python-api    ●       ●         ●         ●        ●      ●     ●      ●       ·      ·
services/.../wordpress     ●       ·         ●         ·        ●      ●     ●      ●       ·      ·
terms                      ●       ·         ·         ·        ·      ●     ●      ·       ·      ·
─────────────────────────────────────────────────────────────────────────────────────────────────────────
TOTAL USAGE               20       9        17         5       14     19    12     15       3      1
```

### Block Type Data Schemas

#### 1. `hero` — Full-screen hero section (used on ALL 20 pages)
```json
{
  "badge": "STATUS: ACCEPTING 2 CLIENTS FOR Q1",
  "headline": "I ARCHITECT SYSTEMS<br class=\"hidden md:block\" />THAT <span class=\"text-neon\">SCALE AGENCIES</span>.",
  "subhead": "Line 1.\nLine 2 (\\n becomes <br>).",
  "cta_label": "< DEPLOY_ARCHITECT />",
  "cta_href": "#audit",
  "warning_text": "// WARNING: Technical Strategy Session Only."
}
```
**Renders**: Dark bg, centered text, neon green badge, large headline, monospace subhead, green CTA button, muted warning.

#### 2. `terminal_problem` — Split layout: text left, terminal right (9 pages)
```json
{
  "eyebrow": "// SYSTEM_CRITICAL_ERROR",
  "title": "The \"Frankenstein\" Stack Is Killing Your Margins.",
  "body": "Description paragraph.",
  "bullets": [
    "⚠ SALES TEAM IS BLIND (CRM not syncing)",
    "⚠ ZAPIER BILL IS SCALING FASTER THAN REVENUE"
  ],
  "terminal_logs": [
    {"time": "09:00:01", "msg": "[ERROR] Webhook Timeout: Zapier webhook failed to respond."},
    {"time": "09:05:23", "msg": "[CRITICAL] Lead Loss: 5 leads failed to sync to GHL."}
  ],
  "status_text": "_ SYSTEM_UNSTABLE"
}
```
**Renders**: 2-column grid. Left: pink eyebrow, white title, muted body, red bullet points. Right: dark terminal box with timestamped log entries and green status.

#### 3. `solution_cards` — 3-column card grid (17 pages)
```json
{
  "eyebrow": "// THE_FIX",
  "title": "Sovereign Infrastructure",
  "cards": [
    {"title": "< INFRASTRUCTURE />", "body": "Description...", "border_color": "neon-blue"},
    {"title": "< INTELLIGENCE />", "body": "Description...", "border_color": "neon-green"},
    {"title": "< REVENUE_PHYSICS />", "body": "Description...", "border_color": "neon-pink"}
  ]
}
```
**Border colors**: `neon-blue` → #00B8FF, `neon-green` → #00FF94, `neon-pink` → #FF00FF
**Renders**: Centered title, 3-col grid of bordered cards with colored left border.

#### 4. `authority` — Social proof with stats (5 pages)
```json
{
  "title": "I Am Not A Freelancer.<br>I Am An Architect.",
  "body": "<p>HTML with <a href=\"...\">links</a> and <strong>bold</strong>.</p>",
  "stats": [
    {"value": "50+", "label": "Systems Built"},
    {"value": "$10M+", "label": "Revenue Supported"}
  ]
}
```
**Renders**: Centered title, prose body, horizontal stat row with green values and muted labels, bordered top/bottom.

#### 5. `audit_form` — Lead capture form (14 pages)
```json
{
  "title": "Technical Strategy Session",
  "subhead": "Let's audit your stack and find the bottleneck.",
  "form_title": "INITIATE_HANDSHAKE_PROTOCOL",
  "submit_source": "ChrisAmayaWork"
}
```
**Renders**: Centered dark form card with: name, email, revenue select, budget select, problem textarea, green submit button. Submits to `/api/submit-lead`. Button shows "ENCRYPTING..." → "TRANSMISSION_SUCCESSFUL" on success.

#### 6. `cta` — Call to action banner (19 pages)
```json
{
  "heading": "Ready to Scale?",
  "text": "Book a strategy call.",
  "href": "#contact",
  "label": "Start Your Moat Audit"
}
```
**Renders**: Centered dark section with heading, muted text, green `.btn-primary` button.

#### 7. `value_prop` — Rich text content block (12 pages)
```json
{
  "title": "Featured: The Sovereign Stack Guide",
  "body": "<p>Full HTML content. Supports <strong>bold</strong>, <code>code</code>, <a href>links</a>, <h3>headings</h3>.</p>"
}
```
**Renders**: Left-aligned title, prose-invert body with full HTML rendering. Max-width 48rem.

#### 8. `icon_bullets` — Icon grid (15 pages)
```json
{
  "title": "Topic Index",
  "bullets": [
    {"icon": "🏗️", "title": "Sovereign Infrastructure", "text": "Description..."},
    {"icon": "🤖", "title": "Private AI Agents", "text": "Description..."},
    {"icon": "🐘", "title": "PostgreSQL Deep Dives", "text": "Description..."}
  ]
}
```
**Renders**: Centered title, 2-3 column grid of bordered cards with large emoji icon, bold title, muted description.

#### 9. `calculator` — Calculator embed section (3 pages)
```json
{"section_title": "Engineering Resources"}
```
**Renders**: Centered title with link to jumpstartscaling.com/resources/calculators.

#### 10. `survey` — Survey/contact redirect (1 page: homepage)
```json
{"section_title": "Let's Build It Right."}
```
**Renders**: Centered title with links to audit form and jumpstartscaling.com/audit.

---

## IV. Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#0B0B0F` | Page background, body |
| `--neon-green` | `#00FF94` | CTAs, badges, links, code, active states |
| `--neon-blue` | `#00B8FF` | Card borders, eyebrows, category labels |
| `--neon-pink` | `#FF00FF` | Warnings, error states, terminal eyebrows |
| `--accent` | `#E8C677` | Gold accent (reserved) |
| `--text-muted` | `rgba(255,255,255,0.70)` | Body text, descriptions |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Section dividers, card borders |
| Background variants | `#050505`, `#0A0A0A`, `#08080A`, `#000` | Section backgrounds (alternating darks) |

### Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Hero headline | Inter/system | 3rem–4.5rem | 900 (black) | #fff |
| Section h2 | Inter/system | 1.5rem–3rem | 700 (bold) | #fff |
| Subsection h3 | Inter/system | 1.125rem | 700 | #fff |
| Body text | Inter/system | 1rem | 400 | rgba(255,255,255,0.70) |
| Code/mono | ui-monospace/Fira Code | 0.875rem | 400 | #00FF94 |
| Badge/eyebrow | ui-monospace | 0.875rem | 400 | #00FF94 or #00B8FF |
| Warning text | ui-monospace | 0.75rem | 400 | rgba(255,255,255,0.50) |
| CTA button | Inter/system | 0.95rem | 700 | #050505 on #00FF94 bg |

### Spacing Scale

| Class | Value | Usage |
|-------|-------|-------|
| `p-6` | 1.5rem | Card padding |
| `p-8` | 2rem | Form padding |
| `py-24` | 6rem top+bottom | Section vertical padding |
| `gap-6` | 1.5rem | Card grid gap |
| `gap-8` | 2rem | Icon grid gap |
| `gap-12` | 3rem | Major section gap |
| `mb-4` → `mb-12` | 1rem → 3rem | Bottom margins |

### Navigation Structure

```json
{
  "portfolio": [
    {"name": "The Problem", "href": "/#hook"},
    {"name": "Architecture", "href": "/#solution"},
    {"name": "Blog", "href": "/blog"},
    {"name": "How I Build", "href": "/guide/how-i-build"},
    {"name": "Knowledge Base", "href": "/knowledge-base"},
    {"name": "Search", "href": "/search"}
  ],
  "custom_apps": [
    {"name": "Python & FastAPI", "href": "/services/custom-apps/python-api"},
    {"name": "Astro & React", "href": "/services/custom-apps/frontend"},
    {"name": "Full-Stack", "href": "/services/custom-apps/full-stack"},
    {"name": "PostgreSQL", "href": "/services/custom-apps/database"},
    {"name": "Google APIs", "href": "/services/custom-apps/google-apis"},
    {"name": "WordPress", "href": "/services/custom-apps/wordpress"},
    {"name": "Calculators", "href": "/services/custom-apps/calculators"},
    {"name": "3D & Visual", "href": "/services/custom-apps/3d-visual"}
  ],
  "growth_tools": [
    {"name": "Jumpstart Scaling", "href": "https://jumpstartscaling.com"},
    {"name": "Growth Retainer", "href": "https://jumpstartscaling.com/services/growth-retainer"},
    {"name": "CRM Build", "href": "https://jumpstartscaling.com/services/crm-transformation"}
  ],
  "cta": {"label": "INITIATE_HANDSHAKE", "href": "#audit"}
}
```

### Footer Structure

```json
{
  "tagline": "The Unicorn Developer.",
  "copyright": "Chris Amaya"
}
```

---

## V. Page Hierarchy (Site Map)

```
chrisamaya.work
├── /                          ← Homepage (7 blocks)
├── /about                     ← About Chris Amaya (7 blocks)
├── /audit                     ← Free Technical Audit (6 blocks)
├── /blog                      ← Blog listing + articles from caw_articles (6 blocks + dynamic)
│   ├── /blog/:slug            ← Individual articles (from caw_articles table)
├── /contact                   ← Contact / Book Strategy (6 blocks)
├── /guide
│   └── /guide/how-i-build     ← Methodology (7 blocks)
├── /knowledge-base            ← Redirect to /blog (2 blocks)
├── /privacy                   ← Privacy Policy (3 blocks)
├── /resources
│   └── /resources/calculators ← Growth Calculators (6 blocks)
├── /search                    ← Search page (4 blocks)
├── /services                  ← Services Overview (6 blocks)
│   └── /services/custom-apps
│       ├── /3d-visual         ← Three.js, Rive & 3D (7 blocks)
│       ├── /calculators       ← React Calculators (7 blocks)
│       ├── /database          ← PostgreSQL Design (7 blocks)
│       ├── /frontend          ← Astro, React & Vite (7 blocks)
│       ├── /full-stack        ← Full-Stack Astro + FastAPI (7 blocks)
│       ├── /google-apis       ← Google Solar/Maps APIs (6 blocks)
│       ├── /python-api        ← Python & FastAPI (8 blocks)
│       └── /wordpress         ← Headless WordPress (6 blocks)
└── /terms                     ← Terms of Service (3 blocks)
```

---

## VI. Content Relationships

### Block → Page Dependencies

```
hero ──────────────── REQUIRED on every page (20/20)
cta ───────────────── Almost every page (19/20, missing only homepage)
solution_cards ────── Most pages (17/20)
icon_bullets ──────── Most pages (15/20)
audit_form ────────── Conversion pages (14/20)
value_prop ────────── Content-heavy pages (12/20)
terminal_problem ──── Pain-point pages (9/20)
authority ─────────── Trust-building pages (5/20)
calculator ────────── Calculator pages only (3/20)
survey ────────────── Homepage only (1/20)
```

### Data Flow: Article → Blog Page

```
caw_articles (status='published')
    │
    ▼
getArticles() in db.js
    │
    ▼
blog.ejs template
    │
    ├── Blog landing blocks (from caw_content slug='blog')
    │   ├── hero
    │   ├── solution_cards (content pillars)
    │   ├── icon_bullets (topic index)
    │   ├── value_prop (sovereign stack guide)
    │   ├── authority (social proof)
    │   └── cta (book a call)
    │
    └── // LATEST_POSTS section
        ├── Article card 1 (title, excerpt, date, category, tags)
        ├── Article card 2
        └── Article card N
```

### Data Flow: Lead Submission

```
audit_form block (HTML form)
    │
    ▼ (client-side fetch)
POST /api/submit-lead
    │
    ▼
INSERT INTO leads (source, name, email, phone, website, revenue, budget, problem, form_type, data_json)
    │
    ▼
Response: {success: true, lead_id: N}
```

---

## VII. Current Articles

| # | Slug | Title | Category | Tags | Published |
|---|------|-------|----------|------|-----------|
| 1 | `postgresql-jsonb-vs-relational` | PostgreSQL: When to Use JSONB vs Relational Columns | postgresql | postgres, jsonb, schema-design | 2026-03-15 |
| 2 | `why-self-hosted-beats-saas` | Why Self-Hosted Beats SaaS Past $1M Revenue | infrastructure | self-hosted, coolify, n8n, saas | 2026-03-14 |
| 3 | `private-llm-deployment-guide` | Deploy Private LLMs on Your Own Hardware | ai | llm, ollama, pgvector, privacy | 2026-03-11 |

---

## VIII. File Structure

```
/workspace
├── server/
│   ├── index.mjs          ← Main Fastify app, all routes
│   ├── db.js              ← getPool(), getPageData(), getArticles(), getArticle()
│   └── blocks.js          ← renderBlocks(), renderBlock() — 10 block types
├── views/
│   ├── layout.ejs         ← HTML shell: <head>, CSS, nav, main, footer, mobile JS
│   ├── page.ejs           ← Generic page: includes layout with blocksHtml
│   ├── blog.ejs           ← Blog listing: blocksHtml + article cards
│   ├── article.ejs        ← Single article: title, meta, content, back link
│   ├── nav.ejs            ← Navigation: logo, links, dropdowns, mobile drawer
│   ├── footer.ejs         ← Footer: tagline, copyright
│   └── 404.ejs            ← Not found page
├── public/                ← Static files (favicon, etc.)
├── scripts/
│   ├── seed-chrisamaya.mjs ← Seeds caw_seed + caw_content (20 pages)
│   └── cursor-ai-admin.sql ← DB role setup
├── prompts/
│   ├── gemini-article-writer.md  ← Gemini prompt for content
│   └── complete-db-seed.sql      ← Full SQL dump of all pages + articles
├── schema.sql             ← DDL: caw_seed, caw_content, caw_articles
├── schema-articles.sql    ← DDL: caw_articles (standalone)
├── docker-compose.yml     ← Local Postgres for dev
├── Dockerfile             ← Production image (node:22-alpine)
├── package.json           ← npm dependencies
└── .env.example           ← Environment template
```
