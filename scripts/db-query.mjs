#!/usr/bin/env node
/**
 * Run DB queries/updates using DATABASE_URL from .env.local.
 * Lets the Cursor agent run DB commands without you pasting credentials.
 *
 * Setup: In chrisamaya-site create .env.local with:
 *   DATABASE_URL=postgres://postgres:PASSWORD@HOST:5432/postgres?sslmode=require&uselibpqcompat=true
 * (Use localhost:5432 if you use an SSH tunnel to the Coolify server.)
 *
 * Usage:
 *   node scripts/db-query.mjs list              # list all page slugs + titles
 *   node scripts/db-query.mjs show <slug>       # show one row (title, blocks count, nav keys)
 *   node scripts/db-query.mjs sql "SELECT ..."   # run one SQL statement (read or write)
 */
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnvLocal() {
  const path = resolve(ROOT, '.env.local');
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const v = m[2].replace(/^["']|["']$/g, '').trim();
      process.env[m[1]] = v;
    }
  }
}

loadEnvLocal();

const { Pool } = pg;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL not set. Create chrisamaya-site/.env.local with DATABASE_URL=postgres://...');
    process.exit(1);
  }
  const ssl = url.includes('sslmode=require') || url.includes('sslmode=verify') ? { rejectUnauthorized: false } : false;
  const pool = new Pool({ connectionString: url, ssl });
  const cmd = process.argv[2];
  const arg = process.argv[3];

  try {
    if (cmd === 'list') {
      const r = await pool.query('SELECT slug, title FROM caw_content ORDER BY slug');
      console.log(JSON.stringify(r.rows, null, 2));
    } else if (cmd === 'show' && arg != null) {
      const slug = arg.trim().replace(/^\/+|\/+$/g) || '';
      const r = await pool.query(
        'SELECT slug, title, jsonb_array_length(blocks) as block_count, nav, footer FROM caw_content WHERE slug = $1',
        [slug]
      );
      if (r.rows.length === 0) {
        console.log(JSON.stringify({ error: 'not_found', slug }));
      } else {
        console.log(JSON.stringify(r.rows[0], null, 2));
      }
    } else if (cmd === 'sql' && process.argv[3] != null) {
      const sql = process.argv.slice(3).join(' ').trim();
      if (!sql) {
        console.error('Usage: node scripts/db-query.mjs sql "SELECT ..."');
        process.exit(1);
      }
      const r = await pool.query(sql);
      if (r.command === 'SELECT') {
        console.log(JSON.stringify(r.rows, null, 2));
      } else {
        console.log(JSON.stringify({ rowCount: r.rowCount, command: r.command }, null, 2));
      }
    } else {
      console.error('Usage: node scripts/db-query.mjs list | show <slug> | sql "<SQL>"');
      process.exit(1);
    }
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
