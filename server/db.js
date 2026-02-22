import pg from 'pg';

let pool = null;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    const ssl = process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false;
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl });
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
