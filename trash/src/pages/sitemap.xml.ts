import type { APIRoute } from 'astro';
import { getSitemapUrls } from '../lib/dbLoader';

export const GET: APIRoute = async ({ locals }) => {
  const domain = locals.domain || 'chrisamaya.work';
  const siteUrl = domain.includes('://') ? domain : `https://${domain}`;
  const base = siteUrl.replace(/\/$/, '');
  const urls = await getSitemapUrls(siteUrl);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${base}${path.startsWith('/') ? path : '/' + path}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
