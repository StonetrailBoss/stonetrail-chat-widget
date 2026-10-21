import pg from 'pg';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL is required');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(748236109)");
  await client.query('CREATE TABLE IF NOT EXISTS portal_schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  const files = (await readdir(new URL('../drizzle/', import.meta.url))).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await readFile(new URL('../drizzle/' + file, import.meta.url), 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    const { rows } = await client.query('SELECT checksum FROM portal_schema_migrations WHERE name=$1', [file]);
    if (rows.length) {
      if (rows[0].checksum !== hash) throw Error('Applied migration changed: ' + file);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO portal_schema_migrations(name, checksum) VALUES ($1,$2)', [file, hash]);
      await client.query('COMMIT');
      console.log('Applied', file);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock(748236109)').catch(() => {});
  await client.end();
}
