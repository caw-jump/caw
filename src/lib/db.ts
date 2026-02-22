/**
 * Shared Postgres connection for chrisamaya.work.
 * Uses same DATABASE_URL as god-mode (Coolify internal).
 * SSL: rejectUnauthorized: false for sslmode=require (internal/coolify).
 */
import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool | null {
  const url = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  if (!url || typeof url !== 'string') return null;
  if (!pool) {
    const ssl =
      url.includes('sslmode=require') || url.includes('sslmode=verify')
        ? { rejectUnauthorized: false }
        : false;
    pool = new Pool({
      connectionString: url,
      max: 5,
      ssl,
    });
  }
  return pool;
}

export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  const p = getPool();
  if (!p) throw new Error('DATABASE_URL not set');
  return p.query(sql, params);
}
