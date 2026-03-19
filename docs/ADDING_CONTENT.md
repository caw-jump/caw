# How to Add and Edit Content on chrisamaya.work

The site is **DB-driven**: every page is one row in `caw_content`. Change the database and the site updates immediately — **no rebuild or redeploy** (unless you add a new block type in code).

---

## Quick reference

| Goal | Method |
|------|--------|
| Edit text on an existing page | Update `caw_content.blocks` (or `title`) for that slug |
| Add/remove/reorder sections on a page | Update `caw_content.blocks` for that slug |
| Add a brand‑new page | Insert a new row into `caw_content` |
| Add a “blog post” (article) | Not supported yet; see “Posts and articles” below |

You need **database access**: `DATABASE_URL` from Coolify (chrisamaya.work app → Environment), then use `psql`, a SQL GUI, or a small script.

---

## 1. Editing existing pages

Each page is identified by **slug** (URL path without leading slash). Homepage has slug `''`.

### 1.1 Change the page title

```sql
UPDATE caw_content
SET title = 'Your New Title | Chris Amaya'
WHERE slug = 'contact';
```

### 1.2 Change content inside a block

Content lives in the **blocks** column (JSONB). Each block has:

- `block_type` — e.g. `hero`, `value_prop`, `cta`
- `data` — object with the text and options for that block

**Example: change the hero headline on the About page**

1. See current data:
   ```sql
   SELECT slug, title, blocks FROM caw_content WHERE slug = 'about';
   ```
2. Update one block’s `data`. For example, set the hero headline:
   ```sql
   UPDATE caw_content
   SET blocks = jsonb_set(
     blocks,
     '{0,data,headline}',  -- first block (0), key "data", key "headline"
     '"Your New Headline Here"'
   )
   WHERE slug = 'about';
   ```

**Example: change CTA button text on the same page**

If the second block is the CTA:

```sql
UPDATE caw_content
SET blocks = jsonb_set(
  jsonb_set(blocks, '{1,data,label}', '"Book Now"'),
  '{1,data,href}',
  '"/contact"'
)
WHERE slug = 'about';
```

Use `blocks->0`, `blocks->1`, etc. to inspect: `blocks->0` is the first block, `blocks->1` the second, and so on.

### 1.3 Add a block to an existing page

Append a new block to the `blocks` array.

**Example: add a CTA at the end of the Services page**

```sql
UPDATE caw_content
SET blocks = blocks || '[
  {
    "block_type": "cta",
    "data": {
      "heading": "Ready to Build?",
      "text": "Tell me about your project.",
      "label": "Get in Touch",
      "href": "/contact"
    }
  }
]'::jsonb
WHERE slug = 'services';
```

### 1.4 Remove a block

Rebuild the `blocks` array without that element. In raw SQL you can do:

```sql
-- Remove the second block (index 1) from the About page
UPDATE caw_content
SET blocks = (
  SELECT jsonb_agg(b)
  FROM jsonb_array_elements(blocks) WITH ORDINALITY AS t(b, i)
  WHERE t.i - 1 <> 1
)
WHERE slug = 'about';
```

(Adjust `1` to the 0-based index of the block you want to remove.)

### 1.5 Reorder blocks

Same idea: build a new array in the order you want (e.g. select elements by index and `jsonb_agg` in the new order). Order in the array = order on the page.

---

## 2. Block types and their data

Use these **block_type** values and **data** shapes when editing or adding blocks.

| block_type | Purpose | data fields (all optional unless noted) |
|------------|--------|----------------------------------------|
| **hero** | Top section: badge, headline, CTA | `badge`, `headline` (HTML ok), `subhead`, `cta_label`, `cta_href`, `warning_text` |
| **terminal_problem** | Problem section + “terminal” logs | `eyebrow`, `title`, `body`, `bullets` (array of strings), `terminal_logs` (array of `{ "time": "...", "msg": "..." }`), `status_text` |
| **solution_cards** | 3 cards | `eyebrow`, `title`, `cards` (array of `{ "title", "body", "border_color" }`; `border_color`: `neon-blue`, `neon-green`, `neon-pink`) |
| **authority** | Credibility + stats | `title` (HTML ok), `body` (HTML), `stats` (array of `{ "value", "label" }`) |
| **audit_form** | Lead form (posts to /api/submit-lead) | `title`, `subhead`, `form_title`, `submit_source` |
| **cta** | Single CTA section | `heading`, `text`, `label`, `href` |
| **value_prop** | Title + body (HTML) | `title`, `body` (HTML) |
| **icon_bullets** | Grid of items with icon/title/text | `title`, `bullets` (array of `{ "icon", "title", "text" }`; `icon` can be emoji or character) |
| **calculator** | Section linking to calculators | `section_title` |
| **survey** | Section with links to audit/form | `section_title` |
| **diagnosis** | Video + copy | `eyebrow`, `title`, `body`, `video_src` |

**Example: full hero block**

```json
{
  "block_type": "hero",
  "data": {
    "badge": "SERVICES",
    "headline": "What I Build",
    "subhead": "Custom SaaS, APIs, and automation.",
    "cta_label": "Get Started",
    "cta_href": "/contact",
    "warning_text": ""
  }
}
```

**Example: value_prop with HTML**

```json
{
  "block_type": "value_prop",
  "data": {
    "title": "Why Work With Me",
    "body": "<p>I build systems that scale.</p><p>Read more on <a href=\"/guide/how-i-build\">How I Build</a>.</p>"
  }
}
```

**Example: icon_bullets (e.g. testimonials / features)**

```json
{
  "block_type": "icon_bullets",
  "data": {
    "title": "What Clients Say",
    "bullets": [
      { "icon": "😤", "title": "Zapier keeps breaking", "text": "Self-hosted n8n fixes that." },
      { "icon": "🤯", "title": "Dev team is slow", "text": "14-day sprints. Real deployments." }
    ]
  }
}
```

---

## 3. Adding a new page

Add one row to `caw_content`. The site serves a URL for every slug you add (e.g. slug `pricing` → `https://chrisamaya.work/pricing`).

### 3.1 Required columns

- **slug** — URL path (no leading slash). Home is `''`.
- **title** — Browser tab / SEO title.
- **blocks** — JSONB array of blocks (can be `[]`).
- **palette** — e.g. `emerald` (must match what layout expects).
- **nav** — JSONB; use same structure as other pages so the nav bar is correct.
- **footer** — JSONB; e.g. `{"tagline": "The Unicorn Developer.", "copyright": "Chris Amaya"}`.

### 3.2 Example: new “Pricing” page

```sql
INSERT INTO caw_content (slug, title, blocks, palette, nav, footer)
VALUES (
  'pricing',
  'Pricing | Chris Amaya',
  '[
    {"block_type": "hero", "data": {"badge": "PRICING", "headline": "Transparent Pricing", "subhead": "Minimum engagement $10k. Most projects $15k–50k.", "cta_label": "Discuss Your Project", "cta_href": "/contact"}},
    {"block_type": "value_prop", "data": {"title": "What You Get", "body": "<p>45-min strategy call, written system design, and a clear proposal. No obligation.</p>"}},
    {"block_type": "cta", "data": {"heading": "Ready to Start?", "text": "Book a technical strategy session.", "label": "Book a Call", "href": "/contact"}}
  ]'::jsonb,
  'emerald',
  '{"portfolio": [{"name": "The Problem", "href": "/#hook"}, {"name": "Architecture", "href": "/#solution"}, {"name": "Blog", "href": "/blog"}, {"name": "How I Build", "href": "/guide/how-i-build"}, {"name": "Knowledge Base", "href": "/knowledge-base"}, {"name": "Search", "href": "/search"}], "custom_apps": [{"name": "Python & FastAPI", "href": "/services/custom-apps/python-api"}, {"name": "Astro & React", "href": "/services/custom-apps/frontend"}, {"name": "Full-Stack", "href": "/services/custom-apps/full-stack"}, {"name": "PostgreSQL", "href": "/services/custom-apps/database"}], "growth_tools": [{"name": "Jumpstart Scaling", "href": "https://jumpstartscaling.com"}], "cta": {"label": "INITIATE_HANDSHAKE", "href": "#audit"}}'::jsonb,
  '{"tagline": "The Unicorn Developer.", "copyright": "Chris Amaya"}'::jsonb
);
```

To keep nav consistent, copy `nav` and `footer` from an existing row:

```sql
SELECT nav, footer FROM caw_content WHERE slug = 'about' LIMIT 1;
```

Then use that JSON in your `INSERT`.

### 3.3 Adding the new page to the nav

If you want the new page in the menu, update **every** row’s `nav` that should show the same global nav (or at least the rows you use as source of truth). For example, add to `portfolio`:

```sql
UPDATE caw_content
SET nav = jsonb_set(
  nav,
  '{portfolio}',
  (nav->'portfolio') || '[{"name": "Pricing", "href": "/pricing"}]'::jsonb
)
WHERE slug IN ('', 'about', 'contact', 'services');
```

(Adjust the `WHERE` list to the slugs you want to update.)

---

## 4. Running SQL against production

1. Get **DATABASE_URL** from Coolify → chrisamaya.work → Environment.
2. From your machine (with network access to the DB):
   ```bash
   psql "$DATABASE_URL" -c "SELECT slug, title FROM caw_content ORDER BY slug;"
   ```
3. Or use a GUI (TablePlus, DBeaver, etc.) and paste the same URL.

No app redeploy is needed; the running app reads from Postgres on each request.

---

## 5. Using the seed script to push content

If you prefer to define pages in code and then push them to the DB:

1. Edit **`scripts/seed-chrisamaya.mjs`**:
   - Add or change entries in `CORE_PAGES` or `OFFER_PAGES` (see existing format: slug, title, array of `[block_type, data]`).
2. Run the seed with production `DATABASE_URL`:
   ```bash
   cd chrisamaya-site
   DATABASE_URL='postgresql://...' node scripts/seed-chrisamaya.mjs
   ```
3. The script uses `ON CONFLICT (slug) DO UPDATE`, so it will insert new pages and overwrite existing ones.

This is ideal for “content as code” and for adding new pages that should also exist in the repo. For one-off copy tweaks, SQL is usually faster.

---

## 6. Posts and articles (blog posts)

Right now there is **no separate “posts” or “articles” table**. The **Blog** is a single page (slug `blog`) with fixed blocks. You can:

- **Edit that page** — Change the `value_prop` (or other blocks) on the `blog` slug to change what appears on `/blog`. That’s still one “blog” page, not a list of posts.
- **Add more pages** — You can add many pages (e.g. `blog/my-first-post`, `blog/second-post`) and link to them from the blog page or nav. Each is a normal `caw_content` row with its own blocks. There is no automatic “listing” of posts; you’d maintain links manually or add a simple listing block (e.g. a `value_prop` with links).

To support a real blog with many posts, you’d need:

- A new table (e.g. `caw_articles`) with columns like `slug`, `title`, `body`, `published_at`, etc.
- Code changes: a route like `/blog/[...slug]` that loads from `caw_articles` and a blog index page that lists them.

Until then, “new posts” = new pages in `caw_content` (e.g. slug `blog/post-slug`) and manual links from the main blog page.

---

## 7. Checklist: add a new page

- [ ] Choose a **slug** (e.g. `faq`, `case-studies`).
- [ ] Build the **blocks** array (use block types and data from section 2).
- [ ] Get **nav** and **footer** from an existing row (or keep consistent with seed).
- [ ] Run `INSERT INTO caw_content (...)` (section 3).
- [ ] If the page should appear in the menu, update **nav** on the pages that share the same menu (section 3.3).
- [ ] Open `https://chrisamaya.work/<slug>` to confirm.

---

## 8. Checklist: edit an existing page

- [ ] Find the row: `SELECT slug, title, blocks FROM caw_content WHERE slug = 'your-slug';`
- [ ] Identify the block index (0-based) you want to change.
- [ ] Use `jsonb_set(blocks, '{index,data,field}', '"value"')` to update, or replace the whole `blocks` array.
- [ ] Run `UPDATE caw_content SET ... WHERE slug = '...';`
- [ ] Reload the page on the live site to verify.
