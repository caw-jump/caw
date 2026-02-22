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
import { getPageData, getPool } from './db.js';
import { renderBlocks } from './blocks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const fastify = Fastify({ logger: false });
const PORT = parseInt(process.env.PORT || '4321', 10);
const HOST = process.env.HOST || '0.0.0.0';
const SITE_URL = process.env.SITE_URL || 'https://chrisamaya.work';

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
    return { success: true, lead_id: r.rows[0]?.id };
  } catch (err) {
    console.error('submit-lead:', err.message);
    return reply.status(500).send({ success: false, error: 'Failed to save lead' });
  }
});

// API: health — confirms DB control and whether caw_content is loaded
fastify.get('/api/health', async () => {
  const hasUrl = !!process.env.DATABASE_URL;
  const p = getPool();
  if (!p) return { ok: false, error: 'DATABASE_URL not set', db_controlled: true };
  try {
    const r = await p.query('SELECT COUNT(*)::int as n FROM caw_content');
    const n = r.rows[0]?.n ?? 0;
    return { ok: true, db_controlled: true, caw_content_rows: n, content_loaded: n > 0 };
  } catch (e) {
    return { ok: false, error: e.message, db_controlled: true };
  }
});

fastify.get('/health', async (req, reply) => {
  const p = getPool();
  if (!p) return reply.status(503).send({ ok: false, error: 'DATABASE_URL not set' });
  try {
    const r = await p.query('SELECT COUNT(*)::int as n FROM caw_content');
    return { ok: true, caw_content_rows: r.rows[0]?.n ?? 0 };
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

  return reply.viewAsync('page.ejs', {
    title: page.title || 'Chris Amaya',
    description: 'Stop hiring freelancers. Start building an empire.',
    siteName,
    nav: nav || {},
    footer: footer || {},
    palette: palette || 'emerald',
    blocksHtml,
    currentPath: req.url.split('?')[0] || '/',
  });
}

// Page routes — DB-driven, no build
fastify.get('/', (req, reply) => handlePage(req, reply, ''));

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
