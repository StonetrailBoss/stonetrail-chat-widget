import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { year, employeeRate, employerRate, effectiveNote } = req.body;
    if (!year || employeeRate == null || employerRate == null) {
      return res.status(400).json({ error: 'year, employeeRate, and employerRate are required' });
    }
    await db.execute(sql.raw(
      `INSERT INTO nis_rate (year, employee_rate, employer_rate, effective_note) VALUES (${Number(year)}, ${Number(employeeRate)}, ${Number(employerRate)}, ${effectiveNote ? `'${String(effectiveNote).replace(/'/g, "''")}'` : 'NULL'})`
    ));
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create NIS rate', message: String(err) });
  }
}
