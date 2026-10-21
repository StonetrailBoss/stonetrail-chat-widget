import type { Request, Response } from 'express';
import { pool } from '../../../db/client.js';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const conn = pool;
    await conn.query(`DELETE FROM employee_deduction WHERE id = $1`, [id] as any[]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete deduction', message: String(err) });
  }
}
