/**
 * Health check: verifies DATABASE_URL is set and caw_content is reachable.
 * GET /api/health
 */
import type { APIRoute } from 'astro';
import { getPool } from '../../lib/db';

export const GET: APIRoute = async () => {
  const ok = { ok: true, db: 'connected', tables: 0 };
  const p = getPool();
  if (!p) {
    return new Response(
      JSON.stringify({ ok: false, error: 'DATABASE_URL not set', hint: 'Add DATABASE_URL in Coolify env (same as god-mode-api)' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  try {
    const r = await p.query('SELECT COUNT(*)::int as n FROM caw_content');
    ok.tables = r.rows[0]?.n ?? 0;
    return new Response(JSON.stringify(ok), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Database query failed',
        detail: msg,
        hint: 'Ensure seed ran: DATABASE_URL=... npm run db:seed',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
