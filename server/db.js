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

export async function searchContent(query, limit = 30) {
  const p = getPool();
  if (!p) return { articles: [], pages: [] };
  const q = `%${query}%`;
  try {
    const [articles, pages] = await Promise.all([
      p.query(
        `SELECT slug, title, excerpt, category, tags, published_at,
                ts_rank(to_tsvector('english', title || ' ' || COALESCE(excerpt,'') || ' ' || content), plainto_tsquery('english', $1)) AS rank
         FROM caw_articles WHERE status = 'published'
           AND (title ILIKE $2 OR excerpt ILIKE $2 OR content ILIKE $2)
         ORDER BY rank DESC, published_at DESC LIMIT $3`,
        [query, q, limit]
      ),
      p.query(
        `SELECT slug, title FROM caw_content
         WHERE title ILIKE $1 OR blocks::text ILIKE $1
         ORDER BY slug LIMIT 10`,
        [q]
      ),
    ]);
    return { articles: articles.rows, pages: pages.rows };
  } catch (err) {
    console.error('[db] searchContent:', err.message);
    return { articles: [], pages: [] };
  }
}

export async function getRelatedArticles(slug, category, limit = 3) {
  const p = getPool();
  if (!p) return [];
  try {
    const r = await p.query(
      `SELECT slug, title, excerpt, category, tags, published_at
       FROM caw_articles
       WHERE status = 'published' AND slug != $1 AND category = $2
       ORDER BY published_at DESC LIMIT $3`,
      [slug, category, limit]
    );
    if (r.rows.length < limit) {
      const fill = await p.query(
        `SELECT slug, title, excerpt, category, tags, published_at
         FROM caw_articles
         WHERE status = 'published' AND slug != $1 AND slug != ALL($2::text[])
         ORDER BY published_at DESC LIMIT $3`,
        [slug, r.rows.map((x) => x.slug), limit - r.rows.length]
      );
      return [...r.rows, ...fill.rows];
    }
    return r.rows;
  } catch (err) {
    console.error('[db] getRelatedArticles:', err.message);
    return [];
  }
}

export async function getArticleNav(slug) {
  const p = getPool();
  if (!p) return { prev: null, next: null };
  try {
    const [prev, next] = await Promise.all([
      p.query(
        `SELECT slug, title FROM caw_articles
         WHERE status = 'published' AND published_at < (SELECT published_at FROM caw_articles WHERE slug = $1)
         ORDER BY published_at DESC LIMIT 1`,
        [slug]
      ),
      p.query(
        `SELECT slug, title FROM caw_articles
         WHERE status = 'published' AND published_at > (SELECT published_at FROM caw_articles WHERE slug = $1)
         ORDER BY published_at ASC LIMIT 1`,
        [slug]
      ),
    ]);
    return { prev: prev.rows[0] || null, next: next.rows[0] || null };
  } catch (err) {
    console.error('[db] getArticleNav:', err.message);
    return { prev: null, next: null };
  }
}

export async function getCategoryCounts() {
  const p = getPool();
  if (!p) return {};
  try {
    const r = await p.query(
      `SELECT category, COUNT(*)::int AS count
       FROM caw_articles WHERE status = 'published'
       GROUP BY category ORDER BY count DESC`
    );
    const counts = {};
    for (const row of r.rows) counts[row.category] = row.count;
    return counts;
  } catch (err) {
    console.error('[db] getCategoryCounts:', err.message);
    return {};
  }
}

export async function getRecentArticles(limit = 5) {
  const p = getPool();
  if (!p) return [];
  try {
    const r = await p.query(
      `SELECT slug, title, excerpt, category, tags, published_at
       FROM caw_articles WHERE status = 'published'
       ORDER BY published_at DESC LIMIT $1`,
      [limit]
    );
    return r.rows;
  } catch (err) {
    console.error('[db] getRecentArticles:', err.message);
    return [];
  }
}

export async function getArticlesForService(serviceSlug) {
  const p = getPool();
  if (!p) return [];
  const categoryMap = {
    'python-api': 'fastapi',
    'frontend': 'frontend',
    'database': 'postgresql',
    'full-stack': 'infrastructure',
    'google-apis': 'tracking',
    'wordpress': 'frontend',
    'calculators': 'growth',
    '3d-visual': 'frontend',
  };
  const cat = categoryMap[serviceSlug] || null;
  if (!cat) return [];
  try {
    const r = await p.query(
      `SELECT slug, title, excerpt, category, published_at
       FROM caw_articles WHERE status = 'published' AND category = $1
       ORDER BY published_at DESC LIMIT 3`,
      [cat]
    );
    return r.rows;
  } catch (err) {
    console.error('[db] getArticlesForService:', err.message);
    return [];
  }
}
