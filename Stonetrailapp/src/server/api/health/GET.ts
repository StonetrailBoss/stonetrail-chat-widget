import type { Request, Response } from 'express';
import { pool } from '../../db/client';
export default async function handler(_req: Request, res: Response) {
  try {
    await pool.query('SELECT 1 FROM portal_schema_migrations LIMIT 1');
    res.json({status:'ok',database:'postgresql'});
  } catch {
    res.status(503).json({status:'unavailable',database:'postgresql'});
  }
}
