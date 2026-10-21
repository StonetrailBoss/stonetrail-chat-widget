import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { pettyCashEntry } from '../../../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const accountId = Number(req.query.accountId);
    const archived = req.query.archived === '1';

    if (!accountId) return res.status(400).json({ error: 'accountId is required' });

    const rows = await db
      .select()
      .from(pettyCashEntry)
      .where(and(
        eq(pettyCashEntry.accountId, accountId),
        eq(pettyCashEntry.isArchived, archived ? 1 : 0),
      ))
      .orderBy(asc(pettyCashEntry.entryDate), asc(pettyCashEntry.id));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries', message: String(err) });
  }
}
