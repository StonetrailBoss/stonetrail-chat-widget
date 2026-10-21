import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { employeeRate } from '../../db/schema.js';
import { asc, eq } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    // Only return active (non-archived) employees
    const rates = await db
      .select()
      .from(employeeRate)
      .where(eq(employeeRate.isArchived, 0))
      .orderBy(asc(employeeRate.employeeName));
    res.json(rates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee rates', message: String(err) });
  }
}
