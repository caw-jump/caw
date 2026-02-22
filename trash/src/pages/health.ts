/**
 * Health check at /health (not /api/health).
 * Coolify and other platforms often check /health — avoid 404 from [...slug].
 */
import type { APIRoute } from 'astro';
import { getPool } from '../lib/db';

export const prerender = false;

export const GET: APIRoute = async () => {
  const p = getPool();
  if (!p) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'DATABASE_URL not set',
        hint: 'Add DATABASE_URL in Coolify env (same as god-mode-api)',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const r = await p.query('SELECT COUNT(*)::int as n FROM caw_content');
    const tables = r.rows[0]?.n ?? 0;
    return new Response(
      JSON.stringify({ ok: true, db: 'connected', tables }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Database query failed',
        detail: msg,
        hint: 'Run seed: DATABASE_URL=... npm run db:seed',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
