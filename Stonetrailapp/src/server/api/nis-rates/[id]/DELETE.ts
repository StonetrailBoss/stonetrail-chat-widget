import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    await db.execute(sql.raw(`DELETE FROM nis_rate WHERE id=${id}`));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete NIS rate', message: String(err) });
  }
}
