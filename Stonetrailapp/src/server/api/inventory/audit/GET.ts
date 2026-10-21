import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { auditLog } from '../../../db/schema.js';
import { desc } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const logs = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit log', message: String(error) });
  }
}
