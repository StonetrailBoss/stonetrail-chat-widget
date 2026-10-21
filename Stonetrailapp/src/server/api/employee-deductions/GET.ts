import type { Request, Response } from 'express';
import { pool } from '../../db/client.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { employee_name, pay_period_start, pay_period_end } = req.query;

    let query = `SELECT * FROM employee_deduction WHERE 1=1`;
    const params: (string | number)[] = [];

    if (employee_name) {
      query += ` AND LOWER(TRIM(employee_name)) = LOWER(TRIM($${params.length + 1}))`;
      params.push(String(employee_name));
    }

    // When a pay period is supplied, return deductions that are active for that period:
    //   effective_date <= pay_period_start  AND  (end_date IS NULL OR end_date >= pay_period_start)
    if (pay_period_start && pay_period_end) {
      query += ` AND (effective_date IS NULL OR effective_date <= $${params.length + 1})
                 AND (end_date IS NULL OR end_date >= $${params.length + 2})`;
      params.push(String(pay_period_start), String(pay_period_start));
    }

    query += ` ORDER BY label ASC`;

    const conn = pool;
    const { rows } = await conn.query(query, params);
    res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deductions', message: String(err) });
  }
}
