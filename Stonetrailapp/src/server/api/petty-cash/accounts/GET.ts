import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { pettyCashAccount } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const accounts = await db
      .select()
      .from(pettyCashAccount)
      .where(eq(pettyCashAccount.isArchived, 0));
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch accounts', message: String(err) });
  }
}
