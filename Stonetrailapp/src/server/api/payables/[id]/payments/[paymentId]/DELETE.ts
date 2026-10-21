import type { Request, Response } from 'express';
import { db } from '../../../../../db/client.js';
import { payablePayment, accountsPayable } from '../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const payableId = parseInt(String(req.params.id));
    const paymentId = parseInt(String(req.params.paymentId));
    if (isNaN(payableId) || isNaN(paymentId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const [existing] = await db
      .select({ id: payablePayment.id })
      .from(payablePayment)
      .where(and(eq(payablePayment.id, paymentId), eq(payablePayment.payableId, payableId)));

    if (!existing) return res.status(404).json({ error: 'Payment record not found' });

    await db.delete(payablePayment).where(eq(payablePayment.id, paymentId));

    // Recalculate totals on the parent payable
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
      await db.update(accountsPayable).set({
        amountPaid: String(totalPaid.toFixed(2)),
        status: newStatus,
        ...(totalPaid < totalDue ? { datePaid: null } : {}),
      }).where(eq(accountsPayable.id, payableId));
    }

    res.json({ message: 'Payment deleted', totalPaid: totalPaid.toFixed(2) });
  } catch (err) {
    console.error('[payments DELETE]', err);
    res.status(500).json({ error: 'Failed to delete payment', message: String(err) });
  }
}
