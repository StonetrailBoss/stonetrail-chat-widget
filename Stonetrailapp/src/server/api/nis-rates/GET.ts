import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await db.execute(sql.raw(`SELECT id, year, employee_rate, employer_rate, effective_note FROM nis_rate ORDER BY year ASC`));
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch NIS rates', message: String(err) });
  }
}
