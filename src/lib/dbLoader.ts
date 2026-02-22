/**
 * Direct Postgres loader for chrisamaya.work.
 * Replaces API calls—no god-mode API dependency.
 */
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  const url = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  if (!url) return null;
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

function resolveDomain(siteUrl: string): string | null {
  const domain = (siteUrl || '').trim().toLowerCase();
  if (!domain) return null;
  try {
    const hasProto = domain.includes('://');
    const url = hasProto ? domain : `https://${domain}`;
    const u = new URL(url);
    return u.hostname || domain;
  } catch {
    return domain;
  }
}

export type PageData = {
  page: { id: string; title: string; slug: string | null; content?: string; schema_json?: unknown };
  blocks: Array<{ id?: string; block_type: string; name?: string; data?: Record<string, unknown> }>;
  palette: string;
  nav: unknown;
  footer: unknown;
  local_seo?: { person?: Record<string, unknown>; service?: Record<string, unknown>; address?: { locality?: string; region?: string; postalCode?: string }; areaServed?: string };
};

async function getSiteId(domain: string): Promise<string | null> {
  const p = getPool();
  if (!p) return null;
  const dom = resolveDomain(domain);
  if (!dom) return null;
  try {
    const r = await p.query(
      "SELECT id FROM sites WHERE status = 'active' AND url ILIKE $1 LIMIT 1",
      [`%${dom}%`]
    );
    return r.rows[0] ? String(r.rows[0].id) : null;
  } catch {
    return null;
  }
}

function parseThemeConfig(tc: unknown): { palette: string; nav: unknown; footer: unknown; local_seo?: unknown } {
  if (!tc || typeof tc !== 'object') return { palette: 'emerald', nav: null, footer: null };
  const o = tc as Record<string, unknown>;
  return {
    palette: (o.palette as string) || 'emerald',
    nav: o.nav ?? null,
    footer: o.footer ?? null,
    local_seo: o.local_seo,
  };
}

export async function getPageData(domain: string, slug: string): Promise<PageData | null> {
  const p = getPool();
  if (!p) return null;
  const siteId = await getSiteId(domain);
  if (!siteId) return null;

  const pageSlug = (slug || '').trim().replace(/^\/+|\/+$/g, '') || '';
  const normalized = pageSlug === 'index' ? '' : pageSlug;

  try {
    const themeRow = await p.query(
      'SELECT theme_config FROM sites WHERE id = $1 LIMIT 1',
      [siteId]
    );
    const theme = parseThemeConfig(themeRow.rows[0]?.theme_config);

    const pageRow = await p.query(
      `SELECT id, site_id, title, slug, content, schema_json
       FROM pages
       WHERE site_id = $1 AND (slug IS NULL OR slug = $2 OR ($2 = '' AND (slug IS NULL OR slug = '')))
       LIMIT 1`,
      [siteId, normalized]
    );
    const page = pageRow.rows[0];
    if (!page) return null;

    const blocksRow = await p.query(
      `SELECT id, block_type, name, data, sort_order
       FROM page_blocks
       WHERE page_id = $1
       ORDER BY sort_order ASC NULLS LAST, created_at ASC`,
      [page.id]
    );
    const blocks = blocksRow.rows.map((r) => ({
      id: r.id ? String(r.id) : undefined,
      block_type: r.block_type,
      name: r.name,
      data: (r.data as Record<string, unknown>) || {},
    }));

    return {
      page: page as PageData['page'],
      blocks,
      palette: theme.palette,
      nav: theme.nav,
      footer: theme.footer,
      ...(theme.local_seo && { local_seo: theme.local_seo as PageData['local_seo'] }),
    };
  } catch {
    return null;
  }
}

export async function getPosts(domain: string): Promise<{ id: string; title: string; slug: string; content?: string; excerpt?: string | null; published_at?: string | null; created_at?: string }[]> {
  const p = getPool();
  if (!p) return [];
  const siteId = await getSiteId(domain);
  if (!siteId) return [];
  try {
    const r = await p.query(
      `SELECT id, title, slug, content, excerpt, published_at, created_at
       FROM posts
       WHERE site_id = $1 AND status = 'published'
       ORDER BY published_at DESC NULLS LAST, created_at DESC
       LIMIT 100`,
      [siteId]
    );
    return r.rows.map((row) => ({
      ...row,
      id: String(row.id),
    }));
  } catch {
    return [];
  }
}

export async function getPostBySlug(domain: string, slug: string): Promise<{ id: string; title: string; slug: string; content: string; excerpt: string | null; published_at: string | null } | null> {
  const posts = await getPosts(domain);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return null;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content ?? '',
    excerpt: post.excerpt ?? null,
    published_at: post.published_at ?? null,
  };
}

export async function getArticles(domain: string, opts?: { category?: string; tag?: string; limit?: number }): Promise<{ id: string; title: string | null; slug: string | null; meta_title: string | null; meta_description: string | null; date_created: string | null; category?: string | null; tags?: string[] | null }[]> {
  const p = getPool();
  if (!p) return [];
  const siteId = await getSiteId(domain);
  if (!siteId) return [];
  const limit = opts?.limit ?? 100;
  try {
    let sql = `SELECT id, title, slug, meta_title, meta_description, date_created, category, tags
               FROM generated_articles
               WHERE site_id = $1 AND is_published = true`;
    const params: (string | number)[] = [siteId];
    let n = 2;
    if (opts?.category) {
      sql += ` AND category = $${n}`;
      params.push(opts.category);
      n++;
    }
    if (opts?.tag) {
      sql += ` AND tags @> $${n}::jsonb`;
      params.push(JSON.stringify([opts.tag]));
      n++;
    }
    sql += ` ORDER BY date_created DESC NULLS LAST LIMIT $${n}`;
    params.push(limit);

    const r = await p.query(sql, params);
    return r.rows.map((row) => ({ ...row, id: String(row.id) }));
  } catch {
    return [];
  }
}

export async function getArticleBySlug(domain: string, slug: string): Promise<{
  id: string; title: string | null; slug: string | null; content: string | null; html_content: string | null;
  meta_title: string | null; meta_description: string | null; og_title?: string | null; og_description?: string | null;
  og_image?: string | null; canonical_url?: string | null; schema_json?: unknown; date_created: string | null;
  category?: string | null; tags?: string[] | null;
} | null> {
  const p = getPool();
  if (!p) return null;
  const siteId = await getSiteId(domain);
  if (!siteId) return null;
  try {
    const r = await p.query(
      `SELECT id, title, slug, content, html_content, meta_title, meta_description,
              og_title, og_description, og_image, canonical_url, schema_json, date_created, category, tags
       FROM generated_articles
       WHERE site_id = $1 AND slug = $2 AND is_published = true
       LIMIT 1`,
      [siteId, slug]
    );
    const row = r.rows[0];
    if (!row) return null;
    return { ...row, id: String(row.id) };
  } catch {
    return null;
  }
}

export async function searchArticles(domain: string, q: string, limit = 50): Promise<{ type: string; slug: string; title: string | null; meta_description: string | null; url: string }[]> {
  const p = getPool();
  if (!p || !q || q.length < 2) return [];
  const siteId = await getSiteId(domain);
  if (!siteId) return [];
  const pattern = `%${q}%`;
  try {
    const r = await p.query(
      `SELECT slug, title, meta_description
       FROM generated_articles
       WHERE site_id = $1 AND is_published = true
         AND (title ILIKE $2 OR content ILIKE $2 OR meta_description ILIKE $2)
       ORDER BY date_created DESC NULLS LAST
       LIMIT $3`,
      [siteId, pattern, limit]
    );
    return r.rows.map((row) => ({
      type: 'article',
      slug: row.slug,
      title: row.title,
      meta_description: row.meta_description,
      url: `/articles/${row.slug}`,
    }));
  } catch {
    return [];
  }
}

export async function getKbCategories(domain: string): Promise<string[]> {
  const p = getPool();
  if (!p) return [];
  const siteId = await getSiteId(domain);
  if (!siteId) return [];
  try {
    const r = await p.query(
      `SELECT DISTINCT category FROM generated_articles
       WHERE site_id = $1 AND is_published = true AND category IS NOT NULL AND category != ''
       ORDER BY category`,
      [siteId]
    );
    return r.rows.map((row) => row.category).filter(Boolean);
  } catch {
    return [];
  }
}

export async function getKbTags(domain: string): Promise<string[]> {
  const p = getPool();
  if (!p) return [];
  const siteId = await getSiteId(domain);
  if (!siteId) return [];
  try {
    const r = await p.query(
      `SELECT DISTINCT jsonb_array_elements_text(tags) AS tag
       FROM generated_articles
       WHERE site_id = $1 AND is_published = true AND tags IS NOT NULL AND jsonb_array_length(tags) > 0
       ORDER BY tag`,
      [siteId]
    );
    return [...new Set(r.rows.map((row) => row.tag).filter(Boolean))];
  } catch {
    return [];
  }
}

export async function getSitemapUrls(domain: string): Promise<string[]> {
  const p = getPool();
  if (!p) return ['/'];
  const siteId = await getSiteId(domain);
  if (!siteId) return ['/'];
  const urls: string[] = ['/', '/blog', '/articles', '/knowledge-base', '/search'];
  try {
    const pageRows = await p.query(
      "SELECT slug FROM pages WHERE site_id = $1 AND (status IS NULL OR status = 'published')",
      [siteId]
    );
    for (const r of pageRows.rows) {
      const s = (r.slug as string || '').trim();
      urls.push(s ? `/${s}` : '/');
    }
    const postRows = await p.query(
      "SELECT slug FROM posts WHERE site_id = $1 AND status = 'published'",
      [siteId]
    );
    for (const r of postRows.rows) {
      if (r.slug) urls.push(`/blog/${r.slug}`);
    }
    const articleRows = await p.query(
      'SELECT slug FROM generated_articles WHERE site_id = $1 AND is_published = true',
      [siteId]
    );
    for (const r of articleRows.rows) {
      if (r.slug) urls.push(`/articles/${r.slug}`);
    }
    return [...new Set(urls)];
  } catch {
    return ['/'];
  }
}
