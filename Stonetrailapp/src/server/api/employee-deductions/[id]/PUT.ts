import type { Request, Response } from 'express';
import { pool } from '../../../db/client.js';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const { employeeName, label, amount, isRecurring, effectiveDate, endDate, notes } = req.body;
    const conn = pool;
    await conn.query(
      `UPDATE employee_deduction SET employee_name=$1, label=$2, amount=$3, is_recurring=$4, effective_date=$5, end_date=$6, notes=$7 WHERE id=$8`,
      [
        String(employeeName),
        String(label),
        parseFloat(String(amount)),
        isRecurring === false || isRecurring === 0 ? 0 : 1,
        effectiveDate || null,
        endDate || null,
        notes || null,
        id,
      ] as any[]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update deduction', message: String(err) });
  }
}
