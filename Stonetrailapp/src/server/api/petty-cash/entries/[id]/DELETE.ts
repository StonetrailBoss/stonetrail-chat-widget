/**
 * DELETE /api/petty-cash/entries/:id
 * Removes a single entry and recalculates running balances for all subsequent
 * entries in the same account, then updates the account's currentBalance.
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { pettyCashAccount, pettyCashEntry } from '../../../../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });

    // Fetch the entry to delete
    const [entry] = await db.select().from(pettyCashEntry).where(eq(pettyCashEntry.id, id));
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const accountId = entry.accountId;

    // Delete it
    await db.delete(pettyCashEntry).where(eq(pettyCashEntry.id, id));

    // Recalculate running balances from scratch for this account
    const [account] = await db.select().from(pettyCashAccount).where(eq(pettyCashAccount.id, accountId));
    if (!account) return res.json({ ok: true });

    const remaining = await db.select().from(pettyCashEntry)
      .where(and(eq(pettyCashEntry.accountId, accountId), eq(pettyCashEntry.isArchived, 0)))
      .orderBy(asc(pettyCashEntry.entryDate), asc(pettyCashEntry.id));

    let balance = parseFloat(String(account.openingBalance));
    for (const row of remaining) {
      balance += parseFloat(String(row.debit)) - parseFloat(String(row.credit));
      await db.update(pettyCashEntry)
        .set({ runningBalance: String(balance.toFixed(2)) })
        .where(eq(pettyCashEntry.id, row.id));
    }

    await db.update(pettyCashAccount)
      .set({ currentBalance: String(balance.toFixed(2)) })
      .where(eq(pettyCashAccount.id, accountId));

    res.json({ ok: true, newBalance: balance });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry', message: String(err) });
  }
}
