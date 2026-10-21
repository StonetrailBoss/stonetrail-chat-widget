import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { getDatabaseConfig } from './config';
import * as schema from './schema';

pg.types.setTypeParser(1082, value => value);
export const pool = new pg.Pool(getDatabaseConfig());
pool.on('error', (error) => console.error('PostgreSQL pool error', error.message));
export const db = drizzle(pool, { schema });
export async function testConnection(): Promise<boolean> {
  try { await pool.query('SELECT 1'); return true; } catch { return false; }
}
export async function closeConnection(): Promise<void> { await pool.end(); }
