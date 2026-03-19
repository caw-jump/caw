import pg from 'pg';

let pool = null;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    let url = process.env.DATABASE_URL;
    const sslmodeMatch = url.match(/(?:\?|&)sslmode=([^&]+)/i);
    const sslmode = (sslmodeMatch?.[1] || '').toLowerCase();

    // pg/libpq can treat `prefer/require/verify-ca` as verify-full regardless of our TLS options.
    // Rewrite to `no-verify` for Coolify/internal Postgres so runtime + seed both work.
    if (sslmodeMatch && sslmode !== 'disable' && sslmode !== 'disabled' && sslmode !== 'no-verify' && sslmode !== 'no_verify') {
      url = url.replace(/([?&])sslmode=[^&]+/i, '$1sslmode=no-verify');
    } else if (!url.includes('127.0.0.1')) {
      // If sslmode isn't present but we're not local, still skip cert verification.
      // (Matches earlier behavior, but now works reliably with libpq sslmode semantics.)
      // Note: we do NOT rewrite sslmode here.
    }

    // Cloud/Coolify Postgres: skip cert verify for TLS connections
    const ssl = !url.includes('127.0.0.1') ? { rejectUnauthorized: false } : false;
    pool = new pg.Pool({ connectionString: url, ssl });
  }
  return pool;
}

const SITE_TABLE_PREFIX_ALLOWED = new Set(['ion_arc_biz', 'ion_arc_online']);
function getSiteTablePrefix() {
  // Back-compat:
  // - legacy env: SITE_KEY=ion_arc_biz|ion_arc_online
  // - preferred env: SITE_DB_PREFIX or SITE_TABLE_PREFIX (same values as SITE_KEY)
  const v = process.env.SITE_DB_PREFIX || process.env.SITE_TABLE_PREFIX || process.env.SITE_KEY;
  return v && SITE_TABLE_PREFIX_ALLOWED.has(v) ? v : null;
}

function normalizeSlug(slug) {
  return (slug || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/^index$/, '')
    .trim();
}

function getSiteTables(siteKey) {
  // All table names are derived from a hard allowlist table prefix.
  return {
    pagesT: `${siteKey}_pages`,
    seoT: `${siteKey}_seo`,
    articlesT: `${siteKey}_articles`,
    locationsT: `${siteKey}_locations`,
    mapT: `${siteKey}_location_article_map`,
    usageT: `${siteKey}_usage`,
  };
}

export async function getPageData(slug) {
  const p = getPool();
  if (!p) return null;

  const normalized = normalizeSlug(slug) || '';
  const siteKey = getSiteTablePrefix();

  try {
    if (!siteKey) {
      // Legacy shell (god-mode pages)
      const r = await p.query(
        `SELECT slug, title, blocks, palette, nav, footer, local_seo
         FROM caw_content
         WHERE slug = $1
         LIMIT 1`,
        [normalized],
      );
      const row = r.rows[0];
      if (!row) return null;
      const blocks = (row.blocks || []).map((b) => ({ block_type: b.block_type, data: b.data || {} }));
      return {
        page: { id: row.slug, title: row.title || '', slug: row.slug || null },
        blocks,
        palette: row.palette || 'emerald',
        nav: row.nav ?? null,
        footer: row.footer ?? null,
        local_seo: row.local_seo,
      };
    }

    const { pagesT, seoT } = getSiteTables(siteKey);
    const r = await p.query(
      `SELECT slug, title, blocks, palette, nav, footer
       FROM ${pagesT}
       WHERE slug = $1
       LIMIT 1`,
      [normalized],
    );
    const row = r.rows[0];
    if (!row) return null;
    const blocks = (row.blocks || []).map((b) => ({ block_type: b.block_type, data: b.data || {} }));

    const seoRow = await p.query(
      `SELECT meta_title, meta_description, canonical, og_image, json_ld
       FROM ${seoT}
       WHERE entity_type = 'page' AND entity_slug = $1
       LIMIT 1`,
      [normalized],
    );
    const seo = seoRow.rows[0] || null;

    return {
      page: { id: row.slug, title: row.title || '', slug: row.slug || null },
      blocks,
      palette: row.palette || 'emerald',
      nav: row.nav ?? null,
      footer: row.footer ?? null,
      seo: seo ? {
        meta_title: seo.meta_title,
        meta_description: seo.meta_description,
        canonical: seo.canonical,
        og_image: seo.og_image,
        json_ld: seo.json_ld,
      } : null,
    };
  } catch (err) {
    console.error('[db] getPageData:', err.message);
    return null;
  }
}

export async function getSeo(entityType, entitySlug) {
  const p = getPool();
  if (!p) return null;

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return null;

  const { seoT } = getSiteTables(siteKey);
  const r = await p.query(
    `SELECT meta_title, meta_description, canonical, og_image, json_ld
     FROM ${seoT}
     WHERE entity_type = $1 AND entity_slug = $2
     LIMIT 1`,
    [entityType, entitySlug],
  );
  return r.rows[0] || null;
}

export async function getArticleBySlug(slug) {
  const p = getPool();
  if (!p) return null;

  const normalized = normalizeSlug(slug);
  const siteKey = getSiteTablePrefix();
  if (!siteKey) return null;

  const { articlesT, seoT } = getSiteTables(siteKey);
  const r = await p.query(
    `SELECT a.slug,
            a.title,
            a.type,
            a.category,
            a.tags,
            a.excerpt,
            a.html_content,
            a.date_created,
            a.published_at,
            s.meta_title,
            s.meta_description,
            s.canonical,
            s.og_image,
            s.json_ld
     FROM ${articlesT} a
     LEFT JOIN ${seoT} s
       ON s.entity_type = 'article'
      AND s.entity_slug = a.slug
     WHERE a.slug = $1
     LIMIT 1`,
    [normalized],
  );

  const row = r.rows[0];
  if (!row) return null;

  return {
    slug: row.slug,
    title: row.title,
    type: row.type,
    category: row.category,
    tags: row.tags || [],
    excerpt: row.excerpt,
    html_content: row.html_content,
    date_created: row.date_created,
    published_at: row.published_at,
    seo: row.meta_title || row.meta_description || row.canonical || row.json_ld
      ? {
          meta_title: row.meta_title,
          meta_description: row.meta_description,
          canonical: row.canonical,
          og_image: row.og_image,
          json_ld: row.json_ld,
        }
      : null,
  };
}

export async function getArticles(opts = {}) {
  const p = getPool();
  if (!p) return [];

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return [];

  const { articlesT, seoT } = getSiteTables(siteKey);
  const type = opts.type || 'article'; // 'article' | 'kb'
  const category = opts.category || null;
  const tag = opts.tag || null;
  const limit = Math.min(Math.max(parseInt(opts.limit || '50', 10) || 50, 1), 200);
  const q = opts.q ? String(opts.q).trim() : null;

  const where = [`a.type = $1`];
  const params = [type];
  let idx = 2;

  if (category) {
    where.push(`a.category = $${idx++}`);
    params.push(category);
  }
  if (tag) {
    where.push(`a.tags @> ARRAY[$${idx++}]::text[]`);
    params.push(tag);
  }
  if (q) {
    where.push(`(a.title ILIKE '%' || $${idx++} || '%' OR COALESCE(a.excerpt,'') ILIKE '%' || $${idx++} || '%')`);
    params.push(q);
    params.push(q);
    // note: this uses 2 placeholders for q (title + excerpt)
  }

  const r = await p.query(
    `SELECT a.slug,
            a.title,
            a.category,
            a.tags,
            a.excerpt,
            a.date_created,
            COALESCE(s.meta_description, a.excerpt) AS meta_description,
            s.canonical,
            s.json_ld
     FROM ${articlesT} a
     LEFT JOIN ${seoT} s
       ON s.entity_type = 'article'
      AND s.entity_slug = a.slug
     WHERE ${where.join(' AND ')}
     ORDER BY a.date_created DESC
     LIMIT $${idx++}`,
    [...params, limit],
  );

  return (r.rows || []).map((row) => ({
    id: row.slug,
    slug: row.slug,
    title: row.title,
    category: row.category,
    tags: row.tags || [],
    excerpt: row.excerpt,
    meta_description: row.meta_description,
    date_created: row.date_created,
  }));
}

export async function getKbCategories() {
  const p = getPool();
  if (!p) return [];

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return [];

  const { articlesT } = getSiteTables(siteKey);
  const r = await p.query(
    `SELECT DISTINCT category
     FROM ${articlesT}
     WHERE type = 'kb'
       AND category IS NOT NULL
       AND category <> ''
     ORDER BY category ASC`,
  );
  return (r.rows || []).map((x) => x.category);
}

export async function getKbTags(limit = 30) {
  const p = getPool();
  if (!p) return [];

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return [];

  const { articlesT } = getSiteTables(siteKey);
  const lim = Math.min(Math.max(parseInt(String(limit), 10) || 30, 1), 100);

  const r = await p.query(
    `SELECT tag, COUNT(*)::int AS c
     FROM (
       SELECT unnest(tags) AS tag
       FROM ${articlesT}
       WHERE type = 'kb'
     ) t
     WHERE tag IS NOT NULL AND tag <> ''
     GROUP BY tag
     ORDER BY c DESC, tag ASC
     LIMIT $1`,
    [lim],
  );
  return (r.rows || []).map((x) => x.tag);
}

export async function getLocationBySlug(slug) {
  const p = getPool();
  if (!p) return null;

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return null;

  const normalized = normalizeSlug(slug);
  const { locationsT } = getSiteTables(siteKey);

  const r = await p.query(
    `SELECT slug, city, region, country, latitude, longitude, area_served
     FROM ${locationsT}
     WHERE slug = $1
     LIMIT 1`,
    [normalized],
  );
  const row = r.rows[0];
  if (!row) return null;
  return row;
}

export async function getRelatedArticlesForLocation(locationSlug) {
  const p = getPool();
  if (!p) return [];

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return [];

  const normalized = normalizeSlug(locationSlug);
  const { mapT, articlesT, seoT } = getSiteTables(siteKey);

  const r = await p.query(
    `SELECT a.slug,
            a.title,
            a.type,
            a.category,
            a.tags,
            a.excerpt,
            a.date_created,
            COALESCE(s.meta_description, a.excerpt) AS meta_description
     FROM ${mapT} m
     JOIN ${articlesT} a ON a.slug = m.article_slug
     LEFT JOIN ${seoT} s
       ON s.entity_type = 'article'
      AND s.entity_slug = a.slug
     WHERE m.location_slug = $1
     ORDER BY a.date_created DESC
     LIMIT 50`,
    [normalized],
  );

  return (r.rows || []).map((row) => ({
    slug: row.slug,
    title: row.title,
    type: row.type,
    category: row.category,
    tags: row.tags || [],
    excerpt: row.excerpt,
    meta_description: row.meta_description,
    date_created: row.date_created,
  }));
}

export async function logUsage(input) {
  const p = getPool();
  if (!p) return;

  const siteKey = getSiteTablePrefix();
  if (!siteKey) return;

  const { usageT } = getSiteTables(siteKey);
  const {
    entity_type,
    entity_slug,
    event_type,
    visitor_hash,
    referrer,
    search_query,
    user_agent,
    lead_id,
    event_date,
  } = input;

  const r = await p.query(
    `INSERT INTO ${usageT}
      (entity_type, entity_slug, event_type, visitor_hash, referrer, search_query, user_agent, lead_id, event_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (visitor_hash, entity_type, entity_slug, event_type, event_date)
     DO NOTHING`,
    [
      entity_type,
      entity_slug,
      event_type,
      visitor_hash,
      referrer ?? null,
      search_query ?? null,
      user_agent ?? null,
      lead_id ?? null,
      event_date ?? new Date().toISOString().slice(0, 10),
    ],
  );

  return r.rowCount;
}
