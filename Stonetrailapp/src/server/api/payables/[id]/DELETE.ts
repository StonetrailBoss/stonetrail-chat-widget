import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { accountsPayable } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    await db.delete(accountsPayable).where(eq(accountsPayable.id, id));
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/payables/:id error:', err);
    res.status(500).json({ error: 'Failed to delete payable' });
  }
}
