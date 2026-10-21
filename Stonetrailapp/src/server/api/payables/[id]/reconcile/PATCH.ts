import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { accountsPayable } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { reconciled, bankTransactionId, bankTransactionDate, bankTransactionNote } = req.body;

    await db.update(accountsPayable).set({
      reconciled: reconciled ? 1 : 0,
      bankTransactionId: bankTransactionId ? String(bankTransactionId).trim() : null,
      bankTransactionDate: bankTransactionDate ? new Date(bankTransactionDate) : null,
      bankTransactionNote: bankTransactionNote ? String(bankTransactionNote).trim() : null,
    }).where(eq(accountsPayable.id, id));

    const [updated] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PATCH /api/payables/:id/reconcile error:', err);
    res.status(500).json({ error: 'Failed to reconcile payable' });
  }
}
