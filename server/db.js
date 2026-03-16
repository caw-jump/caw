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

export async function findBestRedirect(slug) {
  const p = getPool();
  if (!p) return null;

  const stopWords = new Set(['the', 'and', 'for', 'with', 'how', 'why', 'what', 'our', 'your', 'page', 'site', 'web', 'app', 'new', 'get', 'can', 'you', 'are', 'was', 'has', 'have', 'this', 'that', 'from', 'all', 'not', 'but']);
  const keywords = slug.replace(/[^a-z0-9]/gi, ' ').split(/\s+/).filter((w) => w.length > 3 && !stopWords.has(w.toLowerCase()));
  if (keywords.length === 0) return null;

  try {
    // 1. Exact prefix match — strip trailing segments
    const parts = slug.split('/');
    for (let i = parts.length; i >= 1; i--) {
      const partial = parts.slice(0, i).join('/');
      const r = await p.query('SELECT slug FROM caw_content WHERE slug = $1 LIMIT 1', [partial]);
      if (r.rows[0]) return { slug: r.rows[0].slug, type: 'page' };
    }

    // 2. Check articles exact slug
    const artExact = await p.query(
      "SELECT slug FROM caw_articles WHERE status = 'published' AND slug = $1 LIMIT 1",
      [slug]
    );
    if (artExact.rows[0]) return { slug: `blog/${artExact.rows[0].slug}`, type: 'article' };

    // 3. Keyword match on pages — require >=2 keyword hits or 1 strong hit (>5 chars)
    const likeConditions = keywords.map((_, i) => `slug ILIKE $${i + 1}`);
    const likeParams = keywords.map((k) => `%${k}%`);
    const minScore = keywords.length >= 2 ? 2 : (keywords[0] && keywords[0].length > 5 ? 1 : 2);
    if (likeConditions.length > 0) {
      const pageMatch = await p.query(
        `SELECT slug, (${likeConditions.map((c) => `CASE WHEN ${c} THEN 1 ELSE 0 END`).join(' + ')}) AS score
         FROM caw_content WHERE ${likeConditions.join(' OR ')}
         ORDER BY score DESC, length(slug) ASC LIMIT 1`,
        likeParams
      );
      if (pageMatch.rows[0] && pageMatch.rows[0].score >= minScore) {
        return { slug: pageMatch.rows[0].slug, type: 'page' };
      }
    }

    // 4. Keyword match on articles — same threshold
    const artLikeConditions = keywords.map((_, i) => `(slug ILIKE $${i + 1} OR title ILIKE $${i + 1})`);
    if (artLikeConditions.length > 0) {
      const artMatch = await p.query(
        `SELECT slug, (${artLikeConditions.map((c) => `CASE WHEN ${c} THEN 1 ELSE 0 END`).join(' + ')}) AS score
         FROM caw_articles WHERE status = 'published' AND (${artLikeConditions.join(' OR ')})
         ORDER BY score DESC LIMIT 1`,
        likeParams
      );
      if (artMatch.rows[0] && artMatch.rows[0].score >= minScore) {
        return { slug: `blog/${artMatch.rows[0].slug}`, type: 'article' };
      }
    }

    return null;
  } catch (err) {
    console.error('[db] findBestRedirect:', err.message);
    return null;
  }
}

export async function autoGeneratePage(slug) {
  const p = getPool();
  if (!p) return null;

  // Block bot/scanner paths
  const blocked = /wp-|\.php|\.env|\.xml|\.json|\.asp|\.cgi|admin|login|xmlrpc|feed\/|cgi-bin|\.well-known|favicon|robots\.txt|sitemap/i;
  if (blocked.test(slug)) return null;

  const keywords = slug.replace(/[^a-z0-9]/gi, ' ').split(/\s+/).filter((w) => w.length > 2);
  if (keywords.length === 0) return null;

  try {
    // Build a readable title from the slug
    const titleWords = slug.split(/[-_\/]/).filter((w) => w.length > 0).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    const title = titleWords.join(' ') + ' | Chris Amaya';

    // Find the best matching existing page to use as a template for nav/footer
    const template = await p.query('SELECT nav, footer, palette FROM caw_content LIMIT 1');
    const nav = template.rows[0]?.nav || {};
    const footer = template.rows[0]?.footer || {};
    const palette = template.rows[0]?.palette || 'emerald';

    // Search all pages for blocks whose data matches our keywords
    const allPages = await p.query('SELECT slug, blocks FROM caw_content');
    const scoredBlocks = [];

    for (const page of allPages.rows) {
      for (const block of (page.blocks || [])) {
        const blockText = JSON.stringify(block.data || {}).toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (blockText.includes(kw.toLowerCase())) score++;
        }
        if (score > 0) {
          scoredBlocks.push({ ...block, score, source: page.slug });
        }
      }
    }

    scoredBlocks.sort((a, b) => b.score - a.score);

    // Pick the best blocks by type — one of each, prioritizing high scores
    const picked = {};
    const blockOrder = ['hero', 'terminal_problem', 'solution_cards', 'icon_bullets', 'value_prop', 'authority', 'audit_form', 'cta'];
    for (const b of scoredBlocks) {
      if (!picked[b.block_type] && blockOrder.includes(b.block_type)) {
        picked[b.block_type] = { block_type: b.block_type, data: b.data };
      }
    }

    // Build a custom hero if we didn't find a matching one
    if (!picked.hero) {
      picked.hero = {
        block_type: 'hero',
        data: {
          badge: titleWords.slice(0, 3).join(' ').toUpperCase(),
          headline: titleWords.join(' '),
          subhead: 'Custom architecture and sovereign infrastructure for scaling agencies.',
          cta_label: '< GET_STARTED />',
          cta_href: '#audit',
        },
      };
    } else {
      // Override the hero headline to match the URL topic
      picked.hero = {
        block_type: 'hero',
        data: {
          ...picked.hero.data,
          badge: titleWords.slice(0, 3).join(' ').toUpperCase(),
          headline: titleWords.join(' '),
        },
      };
    }

    // Always include a CTA
    if (!picked.cta) {
      picked.cta = {
        block_type: 'cta',
        data: { heading: 'Ready to Build?', text: "Let's discuss your project.", label: 'Book a Strategy Call', href: '/contact' },
      };
    }

    // Always include audit form
    if (!picked.audit_form) {
      picked.audit_form = {
        block_type: 'audit_form',
        data: { title: 'Technical Strategy Session', subhead: "Let's audit your stack and find the bottleneck.", form_title: 'INITIATE_HANDSHAKE_PROTOCOL', submit_source: 'ChrisAmayaWork_AutoGen' },
      };
    }

    // Assemble in correct order
    const blocks = blockOrder.filter((t) => picked[t]).map((t) => picked[t]);

    // Find related articles to embed as a value_prop block
    const articleKeywords = keywords.slice(0, 3).map((k) => `%${k}%`);
    let relatedArticles = [];
    if (articleKeywords.length > 0) {
      const artQ = await p.query(
        `SELECT slug, title, excerpt FROM caw_articles
         WHERE status = 'published' AND (${articleKeywords.map((_, i) => `(title ILIKE $${i + 1} OR slug ILIKE $${i + 1})`).join(' OR ')})
         ORDER BY published_at DESC LIMIT 5`,
        articleKeywords
      );
      relatedArticles = artQ.rows;
    }

    // Add related articles as a value_prop block if we found some
    if (relatedArticles.length > 0) {
      const articleLinks = relatedArticles.map((a) => `<li style="margin-bottom:.75rem"><a href="/blog/${a.slug}" style="color:#00FF94;text-decoration:underline;font-weight:700">${a.title}</a>${a.excerpt ? `<br><span style="color:rgba(255,255,255,.5);font-size:.875rem">${a.excerpt}</span>` : ''}</li>`).join('');
      const relBlock = {
        block_type: 'value_prop',
        data: {
          title: 'Related Articles',
          body: `<ul style="list-style:none;padding:0">${articleLinks}</ul>`,
        },
      };
      // Insert before the last CTA
      const ctaIdx = blocks.findIndex((b) => b.block_type === 'cta');
      if (ctaIdx >= 0) blocks.splice(ctaIdx, 0, relBlock);
      else blocks.push(relBlock);
    }

    // Save to database permanently with source tracking
    await p.query(
      `INSERT INTO caw_content (slug, title, blocks, palette, nav, footer, source, created_at)
       VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb, 'auto', NOW())
       ON CONFLICT (slug) DO NOTHING`,
      [slug, title, JSON.stringify(blocks), palette, JSON.stringify(nav), JSON.stringify(footer)]
    );

    return {
      page: { id: slug, title, slug },
      blocks: blocks.map((b) => ({ block_type: b.block_type, data: b.data || {} })),
      palette,
      nav,
      footer,
    };
  } catch (err) {
    console.error('[db] autoGeneratePage:', err.message);
    return null;
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
