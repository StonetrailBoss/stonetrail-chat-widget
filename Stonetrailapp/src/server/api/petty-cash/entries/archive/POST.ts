/**
 * POST /api/petty-cash/entries/archive
 * Archives all active entries for an account up to (and including) a given date.
 * Sets is_archived=1 and stamps archive_ref on each row.
 * Resets the account's opening_balance to the balance at the archive cutoff date.
 *
 * Body: { accountId, archiveRef, upToDate }
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { pettyCashAccount, pettyCashEntry } from '../../../../db/schema.js';
import { eq, and, lte, asc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { accountId, archiveRef, upToDate } = req.body;
    if (!accountId || !archiveRef || !upToDate) {
      return res.status(400).json({ error: 'accountId, archiveRef, upToDate are required' });
    }

    const accId = Number(accountId);

    // Find the last entry on or before upToDate to get the closing balance
    const toArchive = await db.select().from(pettyCashEntry)
      .where(and(
        eq(pettyCashEntry.accountId, accId),
        eq(pettyCashEntry.isArchived, 0),
        lte(pettyCashEntry.entryDate, upToDate),
      ))
      .orderBy(asc(pettyCashEntry.entryDate), asc(pettyCashEntry.id));

    if (toArchive.length === 0) {
      return res.status(400).json({ error: 'No entries found up to that date' });
    }

    const closingBalance = parseFloat(String(toArchive[toArchive.length - 1].runningBalance));

    // Mark them archived
    for (const row of toArchive) {
      await db.update(pettyCashEntry)
        .set({ isArchived: 1, archiveRef })
        .where(eq(pettyCashEntry.id, row.id));
    }

    // Update account: new opening balance = closing balance of archived period
    await db.update(pettyCashAccount)
      .set({ openingBalance: String(closingBalance.toFixed(2)) })
      .where(eq(pettyCashAccount.id, accId));

    // Recalculate running balances for remaining active entries
    const remaining = await db.select().from(pettyCashEntry)
      .where(and(eq(pettyCashEntry.accountId, accId), eq(pettyCashEntry.isArchived, 0)))
      .orderBy(asc(pettyCashEntry.entryDate), asc(pettyCashEntry.id));

    let balance = closingBalance;
    for (const row of remaining) {
      balance += parseFloat(String(row.debit)) - parseFloat(String(row.credit));
      await db.update(pettyCashEntry)
        .set({ runningBalance: String(balance.toFixed(2)) })
        .where(eq(pettyCashEntry.id, row.id));
    }

    await db.update(pettyCashAccount)
      .set({ currentBalance: String(balance.toFixed(2)) })
      .where(eq(pettyCashAccount.id, accId));

    res.json({ ok: true, archivedCount: toArchive.length, newOpeningBalance: closingBalance, newCurrentBalance: balance });
  } catch (err) {
    res.status(500).json({ error: 'Archive failed', message: String(err) });
  }
}
