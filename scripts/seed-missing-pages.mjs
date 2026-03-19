#!/usr/bin/env node
/**
 * Supplemental seed — inserts nav-linked pages (blog, search, knowledge-base) into caw_content.
 * Run against production DB without rebuild or redeploy.
 *
 *   DATABASE_URL="postgresql://..." node scripts/seed-missing-pages.mjs
 *
 * Safe to run multiple times (upserts).
 */
import pg from 'pg';

const { Pool } = pg;

const THEME = {
  palette: 'emerald',
  nav: {
    portfolio: [
      { name: 'The Problem', href: '/#hook' },
      { name: 'Architecture', href: '/#solution' },
      { name: 'Blog', href: '/blog' },
      { name: 'How I Build', href: '/guide/how-i-build' },
      { name: 'Knowledge Base', href: '/knowledge-base' },
      { name: 'Search', href: '/search' },
    ],
    custom_apps: [
      { name: 'Python & FastAPI', href: '/services/custom-apps/python-api' },
      { name: 'Astro & React', href: '/services/custom-apps/frontend' },
      { name: 'Full-Stack', href: '/services/custom-apps/full-stack' },
      { name: 'PostgreSQL', href: '/services/custom-apps/database' },
      { name: 'Google APIs', href: '/services/custom-apps/google-apis' },
      { name: 'WordPress', href: '/services/custom-apps/wordpress' },
      { name: 'Calculators', href: '/services/custom-apps/calculators' },
      { name: '3D & Visual', href: '/services/custom-apps/3d-visual' },
    ],
    growth_tools: [
      { name: 'Jumpstart Scaling', href: 'https://jumpstartscaling.com' },
      { name: 'Growth Retainer', href: 'https://jumpstartscaling.com/services/growth-retainer' },
      { name: 'CRM Build', href: 'https://jumpstartscaling.com/services/crm-transformation' },
    ],
    cta: { label: 'INITIATE_HANDSHAKE', href: '#audit' },
  },
  footer: { tagline: 'The Unicorn Developer.', copyright: 'Chris Amaya' },
};

function blockSpecsToBlocks(specs) {
  return specs.map((spec) => {
    const bt = Array.isArray(spec) ? spec[0] : spec;
    const data = Array.isArray(spec) && spec.length >= 2 ? spec[1] : {};
    return { block_type: bt, data };
  });
}

const MISSING_PAGES = [
  [
    'blog',
    'Blog | Chris Amaya',
    [
      ['hero', { badge: 'BLOG', headline: 'Blog', subhead: 'Technical insights on architecture, automation, and scaling agencies.', cta_label: 'Read Latest', cta_href: '#posts' }],
      ['value_prop', { title: 'Coming Soon', body: 'Articles on PostgreSQL, FastAPI, Astro, and sovereign infrastructure. Check back soon.' }],
      ['cta', { heading: 'Get Technical Insights', text: 'Book a strategy session for tailored advice.', label: 'Book a Call', href: '/contact' }],
    ],
  ],
  [
    'search',
    'Search | Chris Amaya',
    [
      ['hero', { badge: 'SEARCH', headline: 'Search', subhead: 'Find content across chrisamaya.work.', cta_label: 'Home', cta_href: '/' }],
      ['value_prop', { title: 'Site Search', body: 'Full-text search coming soon. In the meantime, use the nav or <a href="/guide/how-i-build">How I Build</a>, <a href="/services">Services</a>, and <a href="/resources/calculators">Calculators</a>.' }],
      ['cta', { heading: 'Need Something Specific?', text: 'Describe what you\'re looking for and we can point you there.', label: 'Get in Touch', href: '/contact' }],
    ],
  ],
  [
    'knowledge-base',
    'Knowledge Base | Chris Amaya',
    [
      ['hero', { badge: 'KB', headline: 'Knowledge Base', subhead: 'Guides, FAQs, and technical references.', cta_label: 'How I Build', cta_href: '/guide/how-i-build' }],
      ['value_prop', { title: 'Growing Collection', body: 'Documentation on architecture patterns, API design, and deployment. Start with <a href="/guide/how-i-build">How I Build</a> or explore <a href="/services">Services</a>.' }],
      ['cta', { heading: 'Can\'t Find What You Need?', text: 'Ask directly. I answer technical questions.', label: 'Book a Call', href: '/contact' }],
    ],
  ],
];

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL required. Example: DATABASE_URL="postgresql://..." node scripts/seed-missing-pages.mjs');
    process.exit(1);
  }
  const ssl = url.includes('sslmode=require') || url.includes('sslmode=verify') ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: url, ssl });
  const client = await pool.connect();
  try {
    for (const [slug, title, blockSpecs] of MISSING_PAGES) {
      const blocks = blockSpecsToBlocks(blockSpecs);
      await client.query(
        `INSERT INTO caw_content (slug, title, blocks, palette, nav, footer)
         VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb)
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, blocks = EXCLUDED.blocks, palette = EXCLUDED.palette, nav = EXCLUDED.nav, footer = EXCLUDED.footer`,
        [slug, title, JSON.stringify(blocks), THEME.palette, JSON.stringify(THEME.nav), JSON.stringify(THEME.footer)]
      );
      console.log('Upserted:', slug);
    }
    console.log('Done. %d pages added/updated. No rebuild required.', MISSING_PAGES.length);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
