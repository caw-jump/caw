#!/usr/bin/env node
/**
 * Seed for ion-arc.biz / ion-arc.online
 *
 * Requires:
 *   DATABASE_URL (same Postgres as god-mode)
 *   SITE_DB_PREFIX=ion_arc_biz | ion_arc_online (or legacy SITE_KEY=...)
 *   SITE_URL=https://ion-arc.biz | https://ion-arc.online (or SITE_DOMAIN alias)
 *
 * Run:
 *   SITE_DB_PREFIX=ion_arc_biz SITE_URL=https://ion-arc.biz DATABASE_URL="postgresql://..." npm run db:seed-ion-arc
 */
import pg from 'pg';

const { Pool } = pg;

function assertEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function sanitizeSiteKey(siteKey) {
  const allowed = new Set(['ion_arc_biz', 'ion_arc_online']);
  if (!allowed.has(siteKey)) {
    throw new Error(`Invalid SITE_KEY="${siteKey}". Allowed: ${Array.from(allowed).join(', ')}`);
  }
  return siteKey;
}

const SITE_TABLE_PREFIX = sanitizeSiteKey(
  process.env.SITE_DB_PREFIX || process.env.SITE_TABLE_PREFIX || process.env.SITE_KEY,
);
const SITE_URL_RAW = process.env.SITE_URL || process.env.SITE_DOMAIN;
if (!SITE_URL_RAW) throw new Error('Missing required env var: SITE_URL (or SITE_DOMAIN)');
const SITE_URL = SITE_URL_RAW.replace(/\/$/, '');

const DATABASE_URL = assertEnv('DATABASE_URL');

const PAGES_T = `${SITE_TABLE_PREFIX}_pages`;
const SEO_T = `${SITE_TABLE_PREFIX}_seo`;
const ARTICLES_T = `${SITE_TABLE_PREFIX}_articles`;
const LOCATIONS_T = `${SITE_TABLE_PREFIX}_locations`;
const MAP_T = `${SITE_TABLE_PREFIX}_location_article_map`;
const USAGE_T = `${SITE_TABLE_PREFIX}_usage`;

// Blocks must match server/blocks.js supported block types.
function blocksHero({ badge, headline, subhead, cta_label, cta_href }) {
  return [
    {
      block_type: 'hero',
      data: {
        badge,
        headline,
        subhead,
        cta_label,
        cta_href,
      },
    },
  ];
}

const NAV = {
  portfolio: [
    { name: 'Home', href: '/' },
    { name: 'Top', href: '/#hook' },
    { name: 'Articles', href: '/articles' },
    { name: 'Knowledge Base', href: '/knowledge-base' },
    { name: 'Austin', href: '/locations/austin-tx' },
    { name: 'Search', href: '/search' },
  ],
  custom_apps: [],
  growth_tools: [],
  cta: { label: 'INITIATE_HANDSHAKE', href: '#audit' },
};

const FOOTER = {
  tagline: 'Local news, KB depth, and lead capture.',
  copyright : SITE_TABLE_PREFIX === 'ion_arc_biz' ? 'ion-arc.biz' : 'ion-arc.online',
};

const SEO_COMMON = {
  "@context": "https://schema.org",
};

function webPageJsonLd({ name, description, canonical }) {
  return {
    ...SEO_COMMON,
    '@type': 'WebPage',
    name,
    description,
    url: canonical,
  };
}

function articleJsonLd({ title, description, canonical, datePublished }) {
  return {
    ...SEO_COMMON,
    '@type': 'Article',
    headline: title,
    description,
    url: canonical,
    datePublished: datePublished || undefined,
  };
}

function locationJsonLd({ title, canonical, city, region, country }) {
  return {
    ...SEO_COMMON,
    '@type': 'WebPage',
    name: title,
    url: canonical,
    description: `${city}${region ? ', ' + region : ''} ${country ? ', ' + country : ''}`,
  };
}

async function upsertPage(client, { slug, title, blocks, palette = 'emerald' }) {
  await client.query(
    `INSERT INTO ${PAGES_T} (slug, title, blocks, palette, nav, footer)
     VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb)
     ON CONFLICT (slug) DO UPDATE
     SET title = EXCLUDED.title,
         blocks = EXCLUDED.blocks,
         palette = EXCLUDED.palette,
         nav = EXCLUDED.nav,
         footer = EXCLUDED.footer`,
    [slug, title, JSON.stringify(blocks), palette, JSON.stringify(NAV), JSON.stringify(FOOTER)]
  );
}

async function upsertSeo(client, { entity_type, entity_slug, meta_title, meta_description, canonical, json_ld }) {
  await client.query(
    `INSERT INTO ${SEO_T} (entity_type, entity_slug, meta_title, meta_description, canonical, og_image, json_ld)
     VALUES ($1, $2, $3, $4, $5, NULL, $6::jsonb)
     ON CONFLICT (entity_type, entity_slug) DO UPDATE
     SET meta_title = EXCLUDED.meta_title,
         meta_description = EXCLUDED.meta_description,
         canonical = EXCLUDED.canonical,
         json_ld = EXCLUDED.json_ld`,
    [entity_type, entity_slug, meta_title, meta_description, canonical, JSON.stringify(json_ld)]
  );
}

async function upsertArticle(client, { slug, title, type, category, tags, excerpt, html_content }) {
  await client.query(
    `INSERT INTO ${ARTICLES_T} (slug, title, type, category, tags, excerpt, html_content)
     VALUES ($1, $2, $3, $4, $5::text[], $6, $7)
     ON CONFLICT (slug) DO UPDATE
     SET title = EXCLUDED.title,
         type = EXCLUDED.type,
         category = EXCLUDED.category,
         tags = EXCLUDED.tags,
         excerpt = EXCLUDED.excerpt,
         html_content = EXCLUDED.html_content`,
    [slug, title, type, category, tags, excerpt, html_content]
  );
}

async function upsertLocation(client, { slug, city, region, country, latitude, longitude, area_served }) {
  await client.query(
    `INSERT INTO ${LOCATIONS_T} (slug, city, region, country, latitude, longitude, area_served)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (slug) DO UPDATE
     SET city = EXCLUDED.city,
         region = EXCLUDED.region,
         country = EXCLUDED.country,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         area_served = EXCLUDED.area_served`,
    [slug, city, region, country, latitude, longitude, area_served]
  );
}

async function upsertLocationMap(client, { location_slug, article_slug }) {
  await client.query(
    `INSERT INTO ${MAP_T} (location_slug, article_slug)
     VALUES ($1, $2)
     ON CONFLICT (location_slug, article_slug) DO NOTHING`,
    [location_slug, article_slug]
  );
}

function articleHtml({ intro, sections }) {
  const h2s = sections
    .map((s) => `<h2>${s.title}</h2><p>${s.body}</p>`)
    .join('\n');
  return `<p>${intro}</p>\n${h2s}`;
}

async function run() {
  // pg's SSL mode parsing treats `prefer/require/verify-ca` as aliases for `verify-full`
  // and will fail if the server certificate chain isn't trusted in this container.
  // For Coolify/internal Postgres, we want to skip verification (same approach as server/db.js).
  const sslmodeMatch = DATABASE_URL.match(/(?:\?|&)sslmode=([^&]+)/i);
  const sslmode = (sslmodeMatch?.[1] || '').toLowerCase();

  // If sslmode isn't set, default to "skip cert verification" for non-local connections.
  const ssl = sslmode
    ? (sslmode === 'disable' || sslmode === 'disabled' ? false : { rejectUnauthorized: false })
    : (!DATABASE_URL.includes('127.0.0.1') ? { rejectUnauthorized: false } : false);

  const pool = new Pool({ connectionString: DATABASE_URL, ssl });
  const client = await pool.connect();

  try {
    const corePages = [
      {
        slug: '',
        title: FOOTER.copyright,
        blocks: [
          {
            block_type: 'hero',
            data: {
              badge: 'LOCAL GROWTH',
              headline: `ION ARC`,
              subhead: 'News + KB depth + geo pages that convert.',
              cta_label: 'Explore Articles',
              cta_href: '/articles',
            },
          },
          {
            block_type: 'value_prop',
            data: {
              title: 'Built for SEO + lead capture',
              body: '<p>Dynamic archives with Schema.org JSON-LD and usage tracking.</p>',
            },
          },
          {
            block_type: 'audit_form',
            data: {
              title: 'Request a Local SEO Strategy Call',
              subhead: 'Tell us what you want to rank for, and we will map the content plan.',
              form_title: 'INITIATE_HANDSHAKE_PROTOCOL',
              submit_source: `${SITE_TABLE_PREFIX}:lead:homepage`,
            },
          },
        ],
      },
      {
        slug: 'contact',
        title: `Contact | ${FOOTER.copyright}`,
        blocks: [
          {
            block_type: 'hero',
            data: {
              badge: 'GET IN TOUCH',
              headline: 'Contact',
              subhead: 'Send a request and we will respond with next steps.',
              cta_label: 'Send',
              cta_href: '#audit',
            },
          },
          {
            block_type: 'audit_form',
            data: {
              title: 'Request Info',
              subhead: 'Fast intake form to route your request.',
              form_title: 'INITIATE_HANDSHAKE_PROTOCOL',
              submit_source: `${SITE_TABLE_PREFIX}:lead:contact`,
            },
          },
        ],
      },
      {
        slug: 'terms',
        title: `Terms | ${FOOTER.copyright}`,
        blocks: [
          {
            block_type: 'value_prop',
            data: {
              title: 'Terms of Service',
              body: '<p>Placeholder terms. Update via seed.</p>',
            },
          },
        ],
      },
      {
        slug: 'privacy',
        title: `Privacy | ${FOOTER.copyright}`,
        blocks: [
          {
            block_type: 'value_prop',
            data: {
              title: 'Privacy Policy',
              body: '<p>Placeholder privacy. Update via seed.</p>',
            },
          },
        ],
      },
      {
        slug: 'search',
        title: `Search | ${FOOTER.copyright}`,
        blocks: [
          {
            block_type: 'hero',
            data: {
              badge: 'SEARCH',
              headline: 'Search',
              subhead: 'Find articles and guides.',
              cta_label: 'Browse Articles',
              cta_href: '/articles',
            },
          },
          {
            block_type: 'value_prop',
            data: {
              title: 'Tip',
              body: '<p>Use the archives to refine by category and location.</p>',
            },
          },
        ],
      },
      // Placeholder pages (explicit archive routes will render the real content)
      {
        slug: 'articles',
        title: `Articles | ${FOOTER.copyright}`,
        blocks: blocksHero({
          badge: 'ARTICLES',
          headline: 'Articles',
          subhead: 'SEO-safe listings with JSON-LD.',
          cta_label: 'Read',
          cta_href: '/articles',
        }),
      },
      {
        slug: 'knowledge-base',
        title: `Knowledge Base | ${FOOTER.copyright}`,
        blocks: blocksHero({
          badge: 'KB',
          headline: 'Knowledge Base',
          subhead: 'Guides, FAQs, and technical references.',
          cta_label: 'Browse',
          cta_href: '/knowledge-base',
        }),
      },
    ];

    for (const p of corePages) {
      await upsertPage(client, {
        slug: p.slug,
        title: p.title,
        blocks: p.blocks,
        palette: 'emerald',
      });
    }

    // SEO rows for core pages
    await upsertSeo(client, {
      entity_type: 'page',
      entity_slug: '',
      meta_title: FOOTER.copyright,
      meta_description: 'Local news + knowledge base depth with SEO-safe archives.',
      canonical: `${SITE_URL}/`,
      json_ld: webPageJsonLd({ name: FOOTER.copyright, description: 'Local news + knowledge base depth.', canonical: `${SITE_URL}/` }),
    });

    const coreSeo = [
      { slug: 'contact', desc: 'Contact and lead intake.' },
      { slug: 'terms', desc: 'Terms of service.' },
      { slug: 'privacy', desc: 'Privacy policy.' },
      { slug: 'search', desc: 'Search page.' },
      { slug: 'articles', desc: 'Articles archive (dynamic)' },
      { slug: 'knowledge-base', desc: 'Knowledge base archive (dynamic)' },
    ];

    for (const r of coreSeo) {
      const path = `/${r.slug}`;
      const canonical = `${SITE_URL}${path}`;
      await upsertSeo(client, {
        entity_type: 'page',
        entity_slug: r.slug,
        meta_title: `${r.slug.replace(/-/g, ' ')} | ${FOOTER.copyright}`,
        meta_description: r.desc,
        canonical,
        json_ld: webPageJsonLd({ name: `${r.slug.replace(/-/g, ' ')} | ${FOOTER.copyright}`, description: r.desc, canonical }),
      });
    }

    // Archive SEO
    await upsertSeo(client, {
      entity_type: 'archive',
      entity_slug: 'articles',
      meta_title: `Articles | ${FOOTER.copyright}`,
      meta_description: 'SEO-safe articles listing with category and location context.',
      canonical: `${SITE_URL}/articles`,
      json_ld: webPageJsonLd({ name: `Articles | ${FOOTER.copyright}`, description: 'SEO-safe articles listing.', canonical: `${SITE_URL}/articles` }),
    });

    await upsertSeo(client, {
      entity_type: 'archive',
      entity_slug: 'knowledge-base',
      meta_title: `Knowledge Base | ${FOOTER.copyright}`,
      meta_description: 'SEO-safe knowledge base listing by category.',
      canonical: `${SITE_URL}/knowledge-base`,
      json_ld: webPageJsonLd({ name: `Knowledge Base | ${FOOTER.copyright}`, description: 'SEO-safe knowledge base listing.', canonical: `${SITE_URL}/knowledge-base` }),
    });

    // Seed sample location + related content so archives are not empty.
    const LOCATION = {
      slug: 'austin-tx',
      city: 'Austin',
      region: 'TX',
      country: 'US',
      latitude: 30.267153,
      longitude: -97.743057,
      area_served: 'Austin & surrounding areas',
    };
    await upsertLocation(client, LOCATION);

    await upsertSeo(client, {
      entity_type: 'location',
      entity_slug: LOCATION.slug,
      meta_title: `${LOCATION.city}, ${LOCATION.region} | ${FOOTER.copyright}`,
      meta_description: `Explore local SEO news and guides for ${LOCATION.city}.`,
      canonical: `${SITE_URL}/locations/${LOCATION.slug}`,
      json_ld: locationJsonLd({
        title: `${LOCATION.city}, ${LOCATION.region} | ${FOOTER.copyright}`,
        canonical: `${SITE_URL}/locations/${LOCATION.slug}`,
        city: LOCATION.city,
        region: LOCATION.region,
        country: LOCATION.country,
      }),
    });

    const ARTICLES = [
      {
        slug: 'how-to-dominate-austin-roofing-search',
        title: 'How to Dominate Austin Roofing Search',
        type: 'article',
        category: 'Roofing',
        tags: ['roofing', 'austin', 'seo'],
        excerpt: 'A practical framework for local topical authority: content, geo coverage, and on-page SEO.',
        html_content: articleHtml({
          intro: 'This guide shows a local SEO workflow designed for Austin-area roofing keywords.',
          sections: [
            { title: 'Start With Search Intent', body: 'Identify the exact problem your audience is trying to solve and map it to a content type.' },
            { title: 'Publish Geo + Use Internal Links', body: 'Link city pages to article clusters and keep breadcrumbs consistent.' },
            { title: 'Add Schema That Matches the Page', body: 'Use Schema.org JSON-LD that reflects real on-page entities.' },
          ],
        }),
      },
      {
        slug: 'kb-schema-org-json-ld',
        title: 'JSON-LD That Actually Gets Indexed',
        type: 'kb',
        category: 'SEO',
        tags: ['seo', 'schema', 'json-ld'],
        excerpt: 'How to structure Article and WebPage JSON-LD so crawlers can interpret your pages consistently.',
        html_content: articleHtml({
          intro: 'Knowledge-base notes on structured data, canonical URLs, and the JSON-LD placement rules that matter.',
          sections: [
            { title: 'Canonical First', body: 'Make sure canonical URLs match the request path you expect crawlers to index.' },
            { title: 'Use Correct @type', body: 'Prefer schema.org types that match the actual content: Article vs WebPage.' },
            { title: 'Include the Right Fields', body: 'Headline, description, url, and datePublished are the basics that improve consistency.' },
          ],
        }),
      },
    ];

    for (const a of ARTICLES) {
      await upsertArticle(client, a);

      const canonical = `${SITE_URL}/articles/${a.slug}`;
      await upsertSeo(client, {
        entity_type: 'article',
        entity_slug: a.slug,
        meta_title: `${a.title} | ${FOOTER.copyright}`,
        meta_description: a.excerpt,
        canonical,
        json_ld: articleJsonLd({
          title: a.title,
          description: a.excerpt,
          canonical,
          datePublished: null,
        }),
      });
    }

    // Map the sample article(s) to the location page
    await upsertLocationMap(client, { location_slug: LOCATION.slug, article_slug: ARTICLES[0].slug });
    await upsertLocationMap(client, { location_slug: LOCATION.slug, article_slug: ARTICLES[1].slug });

    // KB category archive SEO: store for category page (so listing can be SEO-safe)
    await upsertSeo(client, {
      entity_type: 'kb_category',
      entity_slug: 'SEO',
      meta_title: `Knowledge Base: SEO | ${FOOTER.copyright}`,
      meta_description: 'Articles and guides in the SEO category.',
      canonical: `${SITE_URL}/knowledge-base/category/SEO`,
      json_ld: webPageJsonLd({
        name: `Knowledge Base: SEO | ${FOOTER.copyright}`,
        description: 'Articles and guides in the SEO category.',
        canonical: `${SITE_URL}/knowledge-base/category/SEO`,
      }),
    });

    // Ensure usage table exists (it is created by schema.sql; this is a safety check)
    await client.query(`SELECT 1 FROM ${USAGE_T} LIMIT 1`);

    console.log(JSON.stringify({ message: 'Seed complete', siteTablePrefix: SITE_TABLE_PREFIX, pagesSeeded: corePages.length, articlesSeeded: ARTICLES.length, locationsSeeded: 1 }));
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

