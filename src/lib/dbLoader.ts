/**
 * Direct Postgres loader for chrisamaya.work (caw_content table).
 * Minimal schema: caw_content. Same DATABASE_URL as god-mode.
 */
import { getPool } from './db';

export type PageData = {
  page: { id: string; title: string; slug: string | null; content?: string; schema_json?: unknown };
  blocks: Array<{ id?: string; block_type: string; name?: string; data?: Record<string, unknown> }>;
  palette: string;
  nav: unknown;
  footer: unknown;
  local_seo?: { person?: Record<string, unknown>; service?: Record<string, unknown>; address?: { locality?: string; region?: string; postalCode?: string }; areaServed?: string };
};

export async function getPageData(slug: string): Promise<PageData | null> {
  const p = getPool();
  if (!p) {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.warn('[dbLoader] DATABASE_URL not set');
    }
    return null;
  }

  const normalized = (slug || '').trim().replace(/^\/+|\/+$/g, '').replace(/^index$/, '') || '';

  try {
    const r = await p.query(
      `SELECT slug, title, blocks, palette, nav, footer, local_seo FROM caw_content WHERE slug = $1 LIMIT 1`,
      [normalized]
    );
    const row = r.rows[0];
    if (!row) return null;

    const blocks = (row.blocks as Array<{ block_type: string; data?: Record<string, unknown> }>) || [];
    const blocksMapped = blocks.map((b) => ({
      block_type: b.block_type,
      data: (b.data as Record<string, unknown>) || {},
    }));

    return {
      page: {
        id: row.slug,
        title: row.title || '',
        slug: row.slug || null,
      },
      blocks: blocksMapped,
      palette: (row.palette as string) || 'emerald',
      nav: row.nav ?? null,
      footer: row.footer ?? null,
      ...(row.local_seo && { local_seo: row.local_seo as PageData['local_seo'] }),
    };
  } catch (err) {
    console.error('[dbLoader] getPageData error:', err instanceof Error ? err.message : err);
    return null;
  }
}

export async function getPosts(_domain?: string): Promise<{ id: string; title: string; slug: string; content?: string; excerpt?: string | null; published_at?: string | null; created_at?: string }[]> {
  return [];
}

export async function getPostBySlug(_domain: string, _slug: string): Promise<{ id: string; title: string; slug: string; content: string; excerpt: string | null; published_at: string | null } | null> {
  return null;
}

export async function getArticles(_domain: string, _opts?: { category?: string; tag?: string; limit?: number }): Promise<{ id: string; title: string | null; slug: string | null; meta_title: string | null; meta_description: string | null; date_created: string | null; category?: string | null; tags?: string[] | null }[]> {
  return [];
}

export async function getArticleBySlug(_domain: string, _slug: string): Promise<{
  id: string; title: string | null; slug: string | null; content: string | null; html_content: string | null;
  meta_title: string | null; meta_description: string | null; og_title?: string | null; og_description?: string | null;
  og_image?: string | null; canonical_url?: string | null; schema_json?: unknown; date_created: string | null;
  category?: string | null; tags?: string[] | null;
} | null> {
  return null;
}

export async function searchArticles(_domain: string, _q: string, _limit = 50): Promise<{ type: string; slug: string; title: string | null; meta_description: string | null; url: string }[]> {
  return [];
}

export async function getKbCategories(_domain: string): Promise<string[]> {
  return [];
}

export async function getKbTags(_domain: string): Promise<string[]> {
  return [];
}

export async function getSitemapUrls(_domain?: string): Promise<string[]> {
  const p = getPool();
  if (!p) return ['/', '/blog', '/articles', '/knowledge-base', '/search'];
  try {
    const r = await p.query('SELECT slug FROM caw_content');
    const urls = ['/', '/blog', '/articles', '/knowledge-base', '/search'];
    for (const row of r.rows) {
      const s = (row.slug as string || '').trim();
      urls.push(s ? `/${s}` : '/');
    }
    return [...new Set(urls)];
  } catch {
    return ['/', '/blog', '/articles', '/knowledge-base', '/search'];
  }
}
