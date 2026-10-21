import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { accountsPayable } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const {
      vendor, description, amount, amountPaid, billDate, dueDate, datePaid,
      category, status, notes, receiptFilename, receiptUrl,
    } = req.body;

    await db.update(accountsPayable).set({
      ...(vendor !== undefined && { vendor: String(vendor).trim() }),
      ...(description !== undefined && { description: description ? String(description).trim() : null }),
      ...(amount !== undefined && { amount: String(parseFloat(amount).toFixed(2)) }),
      ...(amountPaid !== undefined && { amountPaid: String(parseFloat(amountPaid).toFixed(2)) }),
      ...(billDate !== undefined && { billDate: billDate ? new Date(`${billDate}T00:00:00Z`) : null }),
      ...(dueDate !== undefined && { dueDate: new Date(`${dueDate}T00:00:00Z`) }),
      ...(datePaid !== undefined && { datePaid: datePaid ? new Date(`${datePaid}T00:00:00Z`) : null }),
      ...(category !== undefined && { category }),
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      ...(receiptFilename !== undefined && { receiptFilename }),
      ...(receiptUrl !== undefined && { receiptUrl }),
    }).where(eq(accountsPayable.id, id));

    const [updated] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, id));
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    console.error('PUT /api/payables/:id error:', err);
    res.status(500).json({ error: 'Failed to update payable' });
  }
}
