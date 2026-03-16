import pg from 'pg';

let pool = null;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    const url = process.env.DATABASE_URL;
    // Cloud/Coolify Postgres: skip cert verify for TLS connections
    const ssl = url.includes('sslmode=require') || url.includes('sslmode=no-verify') || !url.includes('127.0.0.1')
      ? { rejectUnauthorized: false }
      : false;
    pool = new pg.Pool({ connectionString: url, ssl });
  }
  return pool;
}

export async function getPageData(slug) {
  const p = getPool();
  if (!p) return null;
  const normalized = (slug || '').trim().replace(/^\/+|\/+$/g, '').replace(/^index$/, '') || '';
  try {
    const r = await p.query(
      `SELECT slug, title, blocks, palette, nav, footer, local_seo FROM caw_content WHERE slug = $1 LIMIT 1`,
      [normalized]
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
  } catch (err) {
    console.error('[db] getPageData:', err.message);
    return null;
  }
}

export async function getArticles({ category, limit = 20, offset = 0 } = {}) {
  const p = getPool();
  if (!p) return [];
  try {
    const params = [];
    let where = "status = 'published'";
    if (category) {
      params.push(category);
      where += ` AND category = $${params.length}`;
    }
    params.push(limit, offset);
    const r = await p.query(
      `SELECT slug, title, excerpt, category, tags, author, og_image, published_at
       FROM caw_articles WHERE ${where}
       ORDER BY published_at DESC NULLS LAST
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return r.rows;
  } catch (err) {
    console.error('[db] getArticles:', err.message);
    return [];
  }
}

export async function getArticle(slug) {
  const p = getPool();
  if (!p) return null;
  try {
    const r = await p.query(
      `SELECT slug, title, excerpt, content, category, tags, author, og_image, published_at
       FROM caw_articles WHERE slug = $1 AND status = 'published' LIMIT 1`,
      [slug]
    );
    return r.rows[0] || null;
  } catch (err) {
    console.error('[db] getArticle:', err.message);
    return null;
  }
}
