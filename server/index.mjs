#!/usr/bin/env node
/**
 * chrisamaya.work SSR server — Fastify + EJS + pg.
 * No build. Templates and DB rendered at request time. 0 rebuild latency.
 */
import Fastify from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import {
  getPageData,
  getPool,
  getSeo,
  getArticles,
  getArticleBySlug,
  getKbCategories,
  getKbTags,
  getLocationBySlug,
  getRelatedArticlesForLocation,
  logUsage,
} from './db.js';
import { renderBlocks } from './blocks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const fastify = Fastify({ logger: false });
const PORT = parseInt(process.env.PORT || '4321', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SITE_URL = process.env.SITE_URL || process.env.SITE_DOMAIN || 'https://chrisamaya.work';

const SITE_TABLE_PREFIX_ALLOWED = new Set(['ion_arc_biz', 'ion_arc_online']);
function getSiteTablePrefix() {
  // Back-compat:
  // - legacy env: SITE_KEY=ion_arc_biz|ion_arc_online
  // - preferred env: SITE_DB_PREFIX or SITE_TABLE_PREFIX (same values)
  const v = process.env.SITE_DB_PREFIX || process.env.SITE_TABLE_PREFIX || process.env.SITE_KEY;
  return v && SITE_TABLE_PREFIX_ALLOWED.has(v) ? v : null;
}
const SITE_TABLE_PREFIX = getSiteTablePrefix();
const IS_ION_ARC = !!SITE_TABLE_PREFIX;

await fastify.register(fastifyView, {
  engine: { ejs },
  root: join(ROOT, 'views'),
  defaultContext: { siteUrl: SITE_URL },
  viewExt: 'ejs',
});

await fastify.register(fastifyStatic, {
  root: join(ROOT, 'public'),
  prefix: '/',
});

// API: submit lead
fastify.post('/api/submit-lead', async (req, reply) => {
  const p = getPool();
  if (!p) {
    return reply.status(503).send({ success: false, error: 'Database unavailable' });
  }
  let data = {};
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/json')) {
    data = req.body || {};
  } else if (ct.includes('application/x-www-form-urlencoded')) {
    data = req.body || {};
  }
  const source = data.source || 'ChrisAmayaWork';
  const formType = data.form_type || data.formType || 'unknown';
  try {
    const r = await p.query(
      `INSERT INTO leads (source, name, email, phone, website, revenue, budget, problem, form_type, data_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        source,
        data.name ?? '',
        data.email ?? '',
        data.phone ?? null,
        data.website ?? null,
        data.revenue ?? null,
        data.budget ?? null,
        data.problem ?? data.bottleneck ?? null,
        formType,
        JSON.stringify(data || {}),
      ]
    );
    const leadId = r.rows[0]?.id;

    // Optional: attribute lead event to ion-arc entity usage table.
    if (IS_ION_ARC && typeof source === 'string' && source.startsWith(`${SITE_TABLE_PREFIX}:lead:`)) {
      const parts = source.split(':');
      // Expected patterns:
      //  - ion_arc_biz:lead:article:<article-slug>
      //  - ion_arc_biz:lead:location:<location-slug>
      //  - ion_arc_biz:lead:contact
      //  - ion_arc_biz:lead:homepage
      const entityKind = parts[2];
      const entitySlug = parts[3];

      let entity_type = null;
      let entity_slug = null;
      if (entityKind === 'article' && entitySlug) {
        entity_type = 'article';
        entity_slug = entitySlug;
      } else if (entityKind === 'location' && entitySlug) {
        entity_type = 'location';
        entity_slug = entitySlug;
      } else if (entityKind) {
        entity_type = 'page';
        // homepage should map to slug ''
        entity_slug = entityKind === 'homepage' ? '' : entityKind;
      }

      if (entity_type && entity_slug != null) {
        const visitor_hash = getVisitorHash(req);
        const referrer = req.headers.referer || null;
        const user_agent = req.headers['user-agent'] || null;

        await logUsage({
          entity_type,
          entity_slug,
          event_type: 'lead',
          visitor_hash,
          referrer,
          user_agent,
          lead_id: leadId,
          event_date: eventDateISO(),
        });
      }
    }

    return { success: true, lead_id: leadId };
  } catch (err) {
    console.error('submit-lead:', err.message);
    return reply.status(500).send({ success: false, error: 'Failed to save lead' });
  }
});

function getVisitorHash(req) {
  const ip = (req.headers['x-forwarded-for'] || '').toString().split(',')[0]?.trim()
    || req.ip
    || '';
  const ua = (req.headers['user-agent'] || '').toString();
  const raw = `v1|${ip}|${ua}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function eventDateISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getSiteChrome(req) {
  // For ion-arc apps, nav/footer/palette come from the seeded homepage row (slug '').
  // For legacy, getPageData('') keeps existing behavior.
  const home = await getPageData('');
  return {
    siteName: home?.footer?.copyright || 'Chris Amaya',
    nav: home?.nav || {},
    footer: home?.footer || {},
    palette: home?.palette || 'emerald',
  };
}

// API: health — confirms DB control and whether caw_content is loaded
fastify.get('/api/health', async () => {
  const hasUrl = !!process.env.DATABASE_URL;
  const p = getPool();
  if (!p) return { ok: false, error: 'DATABASE_URL not set', db_controlled: true };
  try {
    const table = IS_ION_ARC ? `${SITE_TABLE_PREFIX}_pages` : 'caw_content';
    const r = await p.query(`SELECT COUNT(*)::int as n FROM ${table}`);
    const n = r.rows[0]?.n ?? 0;
    return {
      ok: true,
      db_controlled: true,
      rows: n,
      content_loaded: n > 0,
      table,
    };
  } catch (e) {
    return { ok: false, error: e.message, db_controlled: true };
  }
});

fastify.get('/health', async (req, reply) => {
  const p = getPool();
  if (!p) return reply.status(503).send({ ok: false, error: 'DATABASE_URL not set' });
  try {
    const table = IS_ION_ARC ? `${SITE_TABLE_PREFIX}_pages` : 'caw_content';
    const r = await p.query(`SELECT COUNT(*)::int as n FROM ${table}`);
    return { ok: true, rows: r.rows[0]?.n ?? 0, table };
  } catch (e) {
    return reply.status(503).send({ ok: false, error: e.message });
  }
});

// Page handler — DB-driven, no build
async function handlePage(req, reply, slug) {
  const pageData = await getPageData(slug);
  if (!pageData) {
    reply.code(404);
    return reply.viewAsync('404.ejs', { siteName: 'Chris Amaya', currentPath: req.url.split('?')[0] || '/' });
  }

  const { page, blocks, palette, nav, footer } = pageData;
  const siteName = footer?.copyright || 'Chris Amaya';
  const blocksHtml = renderBlocks(blocks);
  const seo = pageData.seo || null;
  const titleOut = seo?.meta_title || page.title || 'Chris Amaya';
  const descriptionOut = seo?.meta_description || 'Stop hiring freelancers. Start building an empire.';
  const canonicalOut = seo?.canonical || null;
  const jsonLd = seo?.json_ld || null;

  return reply.viewAsync('page.ejs', {
    title: titleOut,
    description: descriptionOut,
    siteName,
    nav: nav || {},
    footer: footer || {},
    palette: palette || 'emerald',
    blocksHtml,
    currentPath: req.url.split('?')[0] || '/',
    canonical: canonicalOut,
    jsonLd,
  });
}

// Page routes — DB-driven, no build
fastify.get('/', (req, reply) => handlePage(req, reply, ''));

// ---------------------------
// ion-arc archives + details
// ---------------------------

if (IS_ION_ARC) {
  fastify.get('/articles', async (req, reply) => {
    const chrome = await getSiteChrome(req);
    const visitor_hash = getVisitorHash(req);
    const referrer = req.headers.referer || null;
    const user_agent = req.headers['user-agent'] || null;
    const q = req.query?.q ? String(req.query.q) : null;
    const category = req.query?.category ? String(req.query.category) : null;
    const tag = req.query?.tag ? String(req.query.tag) : null;

    // Track archive view vs search refinement.
    await logUsage({
      entity_type: 'page',
      entity_slug: 'articles',
      event_type: q ? 'search' : 'view',
      visitor_hash,
      referrer,
      search_query: q || null,
      user_agent,
      event_date: eventDateISO(),
    });

    const seo = await getSeo('archive', 'articles');
    const articles = await getArticles({ type: 'article', q, category, tag, limit: 50 });

    return reply.viewAsync('articles-index.ejs', {
      title: seo?.meta_title || 'Articles',
      description: seo?.meta_description || 'Articles listing.',
      canonical: seo?.canonical || `${SITE_URL}/articles`,
      jsonLd: seo?.json_ld || null,
      siteName: chrome.siteName,
      nav: chrome.nav,
      footer: chrome.footer,
      palette: chrome.palette,
      currentPath: req.url.split('?')[0] || '/articles',
      articles,
    });
  });

  fastify.get('/articles/:slug', async (req, reply) => {
    const chrome = await getSiteChrome(req);
    const { slug } = req.params || {};
    const visitor_hash = getVisitorHash(req);
    const referrer = req.headers.referer || null;
    const user_agent = req.headers['user-agent'] || null;

    await logUsage({
      entity_type: 'article',
      entity_slug: slug,
      event_type: 'view',
      visitor_hash,
      referrer,
      user_agent,
      event_date: eventDateISO(),
    });

    const article = await getArticleBySlug(slug);
    if (!article) {
      reply.code(404);
      return reply.viewAsync('404.ejs', {
        siteName: chrome.siteName,
        currentPath: req.url.split('?')[0] || '/',
      });
    }

    const seo = article.seo || (await getSeo('article', article.slug));

    const rawHtml = article.html_content || '<p>Content coming soon.</p>';

    function estimateReadTime(html) {
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = text ? text.split(/\s+/).length : 0;
      return Math.max(1, Math.ceil(words / 200));
    }

    function slugify(text) {
      return (text || '')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    function sectionedSections(html) {
      const tocHeadings = [];
      const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
      for (const h of h2Matches) {
        tocHeadings.push(h.replace(/<h2[^>]*>|<\/h2>/gi, '').replace(/<[^>]+>/g, '').trim());
      }
      const parts = html.split(/(?=<h2[\s>])/i);
      const sections = [];
      let alt = 'dark';
      for (let i = 0; i < parts.length; i++) {
        let part = parts[i].trim();
        if (!part) continue;
        part = part.replace(/<h2([^>]*)>([^<]*)<\/h2>/gi, (_, attrs, content) => {
          const text = content.replace(/<[^>]+>/g, '').trim();
          const id = slugify(text) || `section-${i}`;
          return `<h2 id="${id}"${attrs}>${content}</h2>`;
        });
        sections.push({ class: `section ${alt}`, html: part });
        alt = alt === 'dark' ? 'light' : 'dark';
      }
      if (sections.length === 0) {
        sections.push({ class: 'section dark', html });
      }
      return { sections, tocHeadings };
    }

    const readTime = estimateReadTime(rawHtml);
    const { sections, tocHeadings } = sectionedSections(rawHtml);
    const hasToc = tocHeadings.length >= 3;

    const submitSource = `${SITE_TABLE_PREFIX}:lead:article:${article.slug}`;
    const auditFormHtml = renderBlocks([
      {
        block_type: 'audit_form',
        data: {
          title: 'Technical Strategy Session',
          subhead: 'Tell us what you are trying to rank for. We will route your request.',
          form_title: 'INITIATE_HANDSHAKE_PROTOCOL',
          submit_source: submitSource,
        },
      },
    ]);

    const breadcrumbs = article.type === 'kb'
      ? [
          { name: 'Knowledge Base', url: '/knowledge-base' },
          { name: 'Articles', url: '/articles' },
          { name: article.title || article.slug, url: `/articles/${article.slug}` },
        ]
      : [
          { name: 'Articles', url: '/articles' },
          { name: article.title || article.slug, url: `/articles/${article.slug}` },
        ];

    return reply.viewAsync('article-detail.ejs', {
      title: seo?.meta_title || `${article.title || article.slug} | ${chrome.siteName}`,
      description: seo?.meta_description || article.excerpt || '',
      canonical: seo?.canonical || `${SITE_URL}/articles/${article.slug}`,
      jsonLd: seo?.json_ld || null,
      siteName: chrome.siteName,
      nav: chrome.nav,
      footer: chrome.footer,
      palette: chrome.palette,
      currentPath: req.url.split('?')[0] || `/articles/${article.slug}`,
      article,
      readTime,
      sections,
      tocHeadings,
      hasToc,
      breadcrumbs,
      auditFormHtml,
    });
  });

  fastify.get('/knowledge-base', async (req, reply) => {
    const chrome = await getSiteChrome(req);
    const visitor_hash = getVisitorHash(req);
    const referrer = req.headers.referer || null;
    const user_agent = req.headers['user-agent'] || null;
    const q = req.query?.q ? String(req.query.q) : null;

    await logUsage({
      entity_type: 'page',
      entity_slug: 'knowledge-base',
      event_type: q ? 'search' : 'view',
      visitor_hash,
      referrer,
      search_query: q || null,
      user_agent,
      event_date: eventDateISO(),
    });

    const seo = await getSeo('archive', 'knowledge-base');
    const [articles, categories, tags] = await Promise.all([
      getArticles({ type: 'kb', q, limit: 100 }),
      getKbCategories(),
      getKbTags(30),
    ]);

    return reply.viewAsync('knowledge-base-index.ejs', {
      title: seo?.meta_title || `Knowledge Base`,
      description: seo?.meta_description || 'Knowledge base listing.',
      canonical: seo?.canonical || `${SITE_URL}/knowledge-base`,
      jsonLd: seo?.json_ld || null,
      siteName: chrome.siteName,
      nav: chrome.nav,
      footer: chrome.footer,
      palette: chrome.palette,
      currentPath: req.url.split('?')[0] || '/knowledge-base',
      articles,
      categories,
      tags,
    });
  });

  fastify.get('/knowledge-base/category/:slug', async (req, reply) => {
    const chrome = await getSiteChrome(req);
    const visitor_hash = getVisitorHash(req);
    const referrer = req.headers.referer || null;
    const user_agent = req.headers['user-agent'] || null;
    const category = req.params?.slug ? String(req.params.slug) : '';

    await logUsage({
      entity_type: 'page',
      entity_slug: `kb_category:${category}`,
      event_type: 'view',
      visitor_hash,
      referrer,
      user_agent,
      event_date: eventDateISO(),
    });

    const seo = await getSeo('kb_category', category);
    const articles = await getArticles({ type: 'kb', category, limit: 100 });

    return reply.viewAsync('knowledge-base-category.ejs', {
      title: seo?.meta_title || `${category} | Knowledge Base`,
      description: seo?.meta_description || `Articles in ${category}.`,
      canonical: seo?.canonical || `${SITE_URL}/knowledge-base/category/${encodeURIComponent(category)}`,
      jsonLd: seo?.json_ld || null,
      siteName: chrome.siteName,
      nav: chrome.nav,
      footer: chrome.footer,
      palette: chrome.palette,
      currentPath: req.url.split('?')[0] || `/knowledge-base/category/${encodeURIComponent(category)}`,
      category,
      articles,
    });
  });

  fastify.get('/locations/:slug', async (req, reply) => {
    const chrome = await getSiteChrome(req);
    const { slug } = req.params || {};
    const visitor_hash = getVisitorHash(req);
    const referrer = req.headers.referer || null;
    const user_agent = req.headers['user-agent'] || null;

    await logUsage({
      entity_type: 'location',
      entity_slug: slug,
      event_type: 'view',
      visitor_hash,
      referrer,
      user_agent,
      event_date: eventDateISO(),
    });

    const location = await getLocationBySlug(slug);
    if (!location) {
      reply.code(404);
      return reply.viewAsync('404.ejs', {
        siteName: chrome.siteName,
        currentPath: req.url.split('?')[0] || '/',
      });
    }

    const seo = await getSeo('location', location.slug);
    const related = await getRelatedArticlesForLocation(location.slug);

    const submitSource = `${SITE_TABLE_PREFIX}:lead:location:${location.slug}`;
    const auditFormHtml = renderBlocks([
      {
        block_type: 'audit_form',
        data: {
          title: 'Technical Strategy Session',
          subhead: `Request a local SEO plan for ${location.city}.`,
          form_title: 'INITIATE_HANDSHAKE_PROTOCOL',
          submit_source: submitSource,
        },
      },
    ]);

    return reply.viewAsync('location-detail.ejs', {
      title: seo?.meta_title || `${location.city}${location.region ? ', ' + location.region : ''}`,
      description: seo?.meta_description || `Local articles for ${location.city}.`,
      canonical: seo?.canonical || `${SITE_URL}/locations/${location.slug}`,
      jsonLd: seo?.json_ld || null,
      siteName: chrome.siteName,
      nav: chrome.nav,
      footer: chrome.footer,
      palette: chrome.palette,
      currentPath: req.url.split('?')[0] || `/locations/${location.slug}`,
      location,
      related,
      auditFormHtml,
    });
  });
}

fastify.setNotFoundHandler(async (req, reply) => {
  const pathname = (req.url || '/').replace(/\?.*$/, '').replace(/\/$/, '') || '/';
  if (pathname.startsWith('/api') || pathname.startsWith('/health')) {
    return reply.status(404).send({ error: 'Not found' });
  }
  const slug = pathname === '/' ? '' : pathname.replace(/^\/+/, '');
  if (slug.includes('.') && !pathname.endsWith('/')) {
    return reply.status(404).send('Not found');
  }
  return handlePage(req, reply, slug);
});

try {
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`chrisamaya.work SSR on http://${HOST}:${PORT}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
