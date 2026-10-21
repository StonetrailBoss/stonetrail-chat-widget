/**
 * GET /api/admin/employees
 * Returns employee names from the employee_rate table for use in staff account forms.
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { employeeRate } from '../../../db/schema.js';
import { asc } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await db
      .select({ id: employeeRate.id, name: employeeRate.employeeName })
      .from(employeeRate)
      .orderBy(asc(employeeRate.employeeName));
    res.json({ employees: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees', message: String(err) });
  }
}
