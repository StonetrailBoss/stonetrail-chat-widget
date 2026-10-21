import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { timeclockEntry } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const [entry] = await db.select().from(timeclockEntry).where(eq(timeclockEntry.id, id));
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry', message: String(err) });
  }
}
