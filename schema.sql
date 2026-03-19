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

-- ----------------------------
-- ion-arc.biz / ion-arc.online
-- Per-site multi-tenant tables
-- ----------------------------

-- Site: ion_arc_biz
CREATE TABLE IF NOT EXISTS ion_arc_biz_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  palette TEXT NOT NULL DEFAULT 'emerald',
  nav JSONB,
  footer JSONB
);

CREATE TABLE IF NOT EXISTS ion_arc_biz_seo (
  entity_type TEXT NOT NULL,
  entity_slug TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  canonical TEXT,
  og_image TEXT,
  json_ld JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, entity_slug)
);

CREATE TABLE IF NOT EXISTS ion_arc_biz_articles (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'article' or 'kb'
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  excerpt TEXT,
  html_content TEXT,
  date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ion_arc_biz_articles_type_category_idx
  ON ion_arc_biz_articles (type, category);

-- Tags queries are optional but we add an index for efficiency when using array overlap.
CREATE INDEX IF NOT EXISTS ion_arc_biz_articles_tags_gin_idx
  ON ion_arc_biz_articles USING GIN (tags);

CREATE TABLE IF NOT EXISTS ion_arc_biz_locations (
  slug TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  area_served TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ion_arc_biz_location_article_map (
  location_slug TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_slug, article_slug),
  FOREIGN KEY (location_slug) REFERENCES ion_arc_biz_locations (slug) ON DELETE CASCADE,
  FOREIGN KEY (article_slug) REFERENCES ion_arc_biz_articles (slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ion_arc_biz_usage (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'page' | 'article' | 'location'
  entity_slug TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view' | 'search' | 'lead'
  visitor_hash TEXT NOT NULL,
  referrer TEXT,
  search_query TEXT,
  user_agent TEXT,
  lead_id BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- One record per visitor per entity per day (dedupe key)
  UNIQUE (visitor_hash, entity_type, entity_slug, event_type, event_date)
);

CREATE INDEX IF NOT EXISTS ion_arc_biz_usage_entity_idx
  ON ion_arc_biz_usage (entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS ion_arc_biz_usage_event_date_idx
  ON ion_arc_biz_usage (event_type, event_date);


-- Site: ion_arc_online
CREATE TABLE IF NOT EXISTS ion_arc_online_pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  palette TEXT NOT NULL DEFAULT 'emerald',
  nav JSONB,
  footer JSONB
);

CREATE TABLE IF NOT EXISTS ion_arc_online_seo (
  entity_type TEXT NOT NULL,
  entity_slug TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  canonical TEXT,
  og_image TEXT,
  json_ld JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (entity_type, entity_slug)
);

CREATE TABLE IF NOT EXISTS ion_arc_online_articles (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'article' or 'kb'
  category TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  excerpt TEXT,
  html_content TEXT,
  date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ion_arc_online_articles_type_category_idx
  ON ion_arc_online_articles (type, category);

CREATE INDEX IF NOT EXISTS ion_arc_online_articles_tags_gin_idx
  ON ion_arc_online_articles USING GIN (tags);

CREATE TABLE IF NOT EXISTS ion_arc_online_locations (
  slug TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  region TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  area_served TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ion_arc_online_location_article_map (
  location_slug TEXT NOT NULL,
  article_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (location_slug, article_slug),
  FOREIGN KEY (location_slug) REFERENCES ion_arc_online_locations (slug) ON DELETE CASCADE,
  FOREIGN KEY (article_slug) REFERENCES ion_arc_online_articles (slug) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ion_arc_online_usage (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'page' | 'article' | 'location'
  entity_slug TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view' | 'search' | 'lead'
  visitor_hash TEXT NOT NULL,
  referrer TEXT,
  search_query TEXT,
  user_agent TEXT,
  lead_id BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- One record per visitor per entity per day (dedupe key)
  UNIQUE (visitor_hash, entity_type, entity_slug, event_type, event_date)
);

CREATE INDEX IF NOT EXISTS ion_arc_online_usage_entity_idx
  ON ion_arc_online_usage (entity_type, entity_slug);

CREATE INDEX IF NOT EXISTS ion_arc_online_usage_event_date_idx
  ON ion_arc_online_usage (event_type, event_date);
