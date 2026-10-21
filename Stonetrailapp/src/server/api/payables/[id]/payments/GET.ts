import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { payablePayment } from '../../../../db/schema.js';
import { eq, desc } from 'drizzle-orm';

function toDateStr(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return `${val.getUTCFullYear()}-${String(val.getUTCMonth() + 1).padStart(2, '0')}-${String(val.getUTCDate()).padStart(2, '0')}`;
  }
  return String(val).slice(0, 10);
}

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const rows = await db
      .select()
      .from(payablePayment)
      .where(eq(payablePayment.payableId, id))
      .orderBy(desc(payablePayment.datePaid));

    // Normalise date columns to plain YYYY-MM-DD strings for the client
    const normalised = rows.map(r => ({
      ...r,
      datePaid: toDateStr(r.datePaid),
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));

    res.json(normalised);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payment history', message: String(err) });
  }
}
