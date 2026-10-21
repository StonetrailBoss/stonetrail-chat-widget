import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { accountsPayable } from '../../db/schema.js';
import { desc } from 'drizzle-orm';

function toDateStr(val: unknown): string | null {
  if (!val) return null;
  if (val instanceof Date) {
    return `${val.getUTCFullYear()}-${String(val.getUTCMonth() + 1).padStart(2, '0')}-${String(val.getUTCDate()).padStart(2, '0')}`;
  }
  return String(val).slice(0, 10);
}

export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await db.select().from(accountsPayable).orderBy(desc(accountsPayable.dueDate));
    const normalised = rows.map(r => ({
      ...r,
      billDate: toDateStr(r.billDate),
      dueDate: toDateStr(r.dueDate) ?? '',
      datePaid: toDateStr(r.datePaid),
      bankTransactionDate: toDateStr(r.bankTransactionDate),
    }));
    res.json(normalised);
  } catch (err) {
    console.error('GET /api/payables error:', err);
    res.status(500).json({ error: 'Failed to fetch payables' });
  }
}
