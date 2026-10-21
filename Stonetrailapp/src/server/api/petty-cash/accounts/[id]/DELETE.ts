import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { pettyCashAccount } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    // Soft-delete: mark archived
    await db.update(pettyCashAccount).set({ isArchived: 1 }).where(eq(pettyCashAccount.id, id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account', message: String(err) });
  }
}
