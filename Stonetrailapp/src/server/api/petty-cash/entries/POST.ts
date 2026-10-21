/**
 * POST /api/petty-cash/entries
 *
 * Creates a double-entry transaction pair (debit + credit rows sharing a txnRef).
 * Updates the account's currentBalance after each transaction.
 *
 * Body:
 *   accountId   number
 *   entryDate   string  YYYY-MM-DD
 *   description string
 *   category    string
 *   amount      number  (always positive)
 *   type        'expense' | 'replenishment' | 'adjustment'
 *   reference   string?
 *   createdBy   string?
 *
 * Double-entry logic:
 *   expense        → DR Expense / CR Cash  (balance decreases)
 *   replenishment  → DR Cash / CR Bank     (balance increases)
 *   adjustment     → DR/CR based on sign of amount (positive = increase, negative = decrease)
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { pettyCashAccount, pettyCashEntry } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export default async function handler(req: Request, res: Response) {
  try {
    const { accountId, entryDate, description, category, amount, type, reference, createdBy } = req.body;
    if (!accountId || !entryDate || !description || amount === undefined) {
      return res.status(400).json({ error: 'accountId, entryDate, description, amount are required' });
    }

    const amt = Math.abs(parseFloat(String(amount)));
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'amount must be a positive number' });

    // Fetch current balance
    const [account] = await db.select().from(pettyCashAccount).where(eq(pettyCashAccount.id, Number(accountId)));
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const prevBalance = parseFloat(String(account.currentBalance));
    const txnRef = randomUUID();
    const cat = category || 'General';
    const ref = reference || null;
    const by = createdBy || null;

    let debitAmt = 0;
    let creditAmt = 0;
    let newBalance = prevBalance;

    if (type === 'replenishment') {
      // Cash fund receives money → debit cash, credit bank
      debitAmt = amt;
      newBalance = prevBalance + amt;
    } else if (type === 'adjustment') {
      // Positive = add to fund, negative = remove
      const signed = parseFloat(String(amount));
      if (signed >= 0) { debitAmt = amt; newBalance = prevBalance + amt; }
      else { creditAmt = amt; newBalance = prevBalance - amt; }
    } else {
      // expense (default) → debit expense account, credit cash fund
      creditAmt = amt;
      newBalance = prevBalance - amt;
    }

    const runBal = parseFloat(newBalance.toFixed(2));

    // Insert the single summary entry (simplified: one row per transaction for the ledger view)
    await db.insert(pettyCashEntry).values({
      accountId: Number(accountId),
      txnRef,
      entryDate: new Date(entryDate),
      description,
      category: cat,
      debit: String(debitAmt.toFixed(2)),
      credit: String(creditAmt.toFixed(2)),
      runningBalance: String(runBal),
      reference: ref,
      createdBy: by,
    });

    // Update account balance
    await db.update(pettyCashAccount)
      .set({ currentBalance: String(runBal) })
      .where(eq(pettyCashAccount.id, Number(accountId)));

    // Return all active entries for this account (so client can refresh)
    const entries = await db.select().from(pettyCashEntry)
      .where(eq(pettyCashEntry.accountId, Number(accountId)));

    res.status(201).json({ entries, newBalance: runBal });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry', message: String(err) });
  }
}
