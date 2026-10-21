import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { timeclockEntry } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(timeclockEntry).where(eq(timeclockEntry.id, id));
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry', message: String(err) });
  }
}
