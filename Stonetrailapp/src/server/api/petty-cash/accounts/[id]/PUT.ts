import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { pettyCashAccount } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const { name, notes, currency } = req.body;
    await db.update(pettyCashAccount).set({
      name,
      notes: notes || null,
      currency: currency || 'EC$',
    }).where(eq(pettyCashAccount.id, id));
    const [row] = await db.select().from(pettyCashAccount).where(eq(pettyCashAccount.id, id));
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update account', message: String(err) });
  }
}
