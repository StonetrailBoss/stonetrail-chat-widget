import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { payablePayment, accountsPayable } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const payableId = parseInt(String(req.params.id));
    if (isNaN(payableId)) return res.status(400).json({ error: 'Invalid id' });

    const { amount, datePaid, method, reference, notes } = req.body;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!datePaid || !/^\d{4}-\d{2}-\d{2}$/.test(datePaid)) {
      return res.status(400).json({ error: 'Date paid is required (YYYY-MM-DD)' });
    }

    // Insert payment record — Drizzle date() expects a Date object
    await db.insert(payablePayment).values({
      payableId,
      amount: String(parseFloat(amount).toFixed(2)),
      datePaid: new Date(`${datePaid}T00:00:00Z`),
      method: method || null,
      reference: reference || null,
      notes: notes || null,
    });

    // Recalculate total paid across all payments for this payable
    const payments = await db
      .select({ amount: payablePayment.amount })
      .from(payablePayment)
      .where(eq(payablePayment.payableId, payableId));

    const totalPaid = payments.reduce((s, p) => s + parseFloat(String(p.amount)), 0);

    const [payable] = await db
      .select({ amount: accountsPayable.amount })
      .from(accountsPayable)
      .where(eq(accountsPayable.id, payableId));

    if (payable) {
      const totalDue = parseFloat(String(payable.amount));
      const newStatus = totalPaid >= totalDue ? 'paid' : 'unpaid';
      if (totalPaid >= totalDue) {
        await db.update(accountsPayable).set({
          amountPaid: String(totalPaid.toFixed(2)),
          status: newStatus,
          datePaid: new Date(`${datePaid}T00:00:00Z`),
        }).where(eq(accountsPayable.id, payableId));
      } else {
        await db.update(accountsPayable).set({
          amountPaid: String(totalPaid.toFixed(2)),
          status: newStatus,
        }).where(eq(accountsPayable.id, payableId));
      }
    }

    res.status(201).json({ message: 'Payment recorded', totalPaid: totalPaid.toFixed(2) });
  } catch (err) {
    console.error('[payments POST]', err);
    res.status(500).json({ error: 'Failed to record payment', message: String(err) });
  }
}
