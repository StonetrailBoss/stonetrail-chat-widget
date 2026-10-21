import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { employeeRate } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(employeeRate).where(eq(employeeRate.id, id));
    res.json({ message: 'Employee rate deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee rate', message: String(err) });
  }
}
