import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { timeclockEntry } from '../../db/schema.js';
import { desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const entries = await db.select().from(timeclockEntry).orderBy(desc(timeclockEntry.payPeriodEnd));
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeclock entries', message: String(err) });
  }
}
