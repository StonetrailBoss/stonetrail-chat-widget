import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { staffRole } from '../../../db/schema.js';
import { asc } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const roles = await db.select().from(staffRole).orderBy(asc(staffRole.name));
    res.json({ roles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch roles', message: String(err) });
  }
}
