-- chrisamaya.work minimal schema: 2 tables only (no factory schema)

-- Table 1: Complete seed data
CREATE TABLE IF NOT EXISTS caw_seed (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Table 2: Content for Astro shell (one row per page)
CREATE TABLE IF NOT EXISTS caw_content (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  palette TEXT NOT NULL DEFAULT 'emerald',
  nav JSONB,
  footer JSONB,
  local_seo JSONB
);
