import type { Request, Response } from 'express';
import { pool } from '../../db/client.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { employeeName, label, amount, isRecurring, effectiveDate, endDate, notes } = req.body;
    if (!employeeName || !label || amount === undefined) {
      return res.status(400).json({ error: 'employeeName, label and amount are required' });
    }
    const conn = pool;
    const { rows: [result] } = await conn.query(
      `INSERT INTO employee_deduction (employee_name, label, amount, is_recurring, effective_date, end_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        String(employeeName),
        String(label),
        parseFloat(String(amount)),
        isRecurring === false || isRecurring === 0 ? 0 : 1,
        effectiveDate || null,
        endDate || null,
        notes || null,
      ] as any[]
    );
    res.status(201).json({ id: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create deduction', message: String(err) });
  }
}
