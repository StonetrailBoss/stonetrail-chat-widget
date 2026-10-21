import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { sql } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const { year, employeeRate, employerRate, effectiveNote } = req.body;
    if (!year || employeeRate == null || employerRate == null) {
      return res.status(400).json({ error: 'year, employeeRate, and employerRate are required' });
    }
    const note = effectiveNote ? `'${String(effectiveNote).replace(/'/g, "''")}'` : 'NULL';
    await db.execute(sql.raw(
      `UPDATE nis_rate SET year=${Number(year)}, employee_rate=${Number(employeeRate)}, employer_rate=${Number(employerRate)}, effective_note=${note} WHERE id=${id}`
    ));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update NIS rate', message: String(err) });
  }
}
