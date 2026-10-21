import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { pettyCashAccount, pettyCashEntry } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default async function handler(req: Request, res: Response) {
  try {
    const { name, openingBalance, currency, notes, openingDate } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const bal = parseFloat(openingBalance || '0');
    const balStr = bal.toFixed(2);
    const date = openingDate || new Date().toISOString().slice(0, 10);

    const result = await db.insert(pettyCashAccount).values({
      name,
      openingBalance: balStr,
      currentBalance: balStr,
      currency: currency || 'EC$',
      notes: notes || null,
    }).returning();
    const id = Number(result[0].id);

    // Post the opening balance as the first ledger entry so it appears in the date-tracked ledger
    if (bal > 0) {
      await db.insert(pettyCashEntry).values({
        accountId: id,
        txnRef: randomUUID(),
        entryDate: new Date(date),
        description: 'Opening Balance',
        category: 'Opening Balance',
        debit: balStr,
        credit: '0.00',
        runningBalance: balStr,
        reference: null,
        createdBy: null,
      });
    }

    const rows = await db.select().from(pettyCashAccount).where(eq(pettyCashAccount.id, id));
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account', message: String(err) });
  }
}
