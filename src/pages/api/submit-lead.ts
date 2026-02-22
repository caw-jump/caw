import type { APIRoute } from 'astro';
import { getPool } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  const p = getPool();
  if (!p) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let data: Record<string, unknown> = {};
  const ct = request.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      data = (await request.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }
  } else if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    data = Object.fromEntries(params.entries());
  }

  const source = (data.source as string) || 'chrisamaya';
  const formType = (data.formType as string) || (data.form_type as string) || 'unknown';

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
        (data.problem as string) ?? (data.bottleneck as string) ?? null,
        formType,
        JSON.stringify(data || {}),
      ]
    );
    const leadId = r.rows[0]?.id;
    return new Response(JSON.stringify({ success: true, lead_id: leadId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('submit-lead error:', err);
    return new Response(JSON.stringify({ success: false, error: 'Failed to save lead' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
