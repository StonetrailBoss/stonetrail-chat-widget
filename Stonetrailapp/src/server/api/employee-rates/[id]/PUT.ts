import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { employeeRate } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const { firstName, lastName, department, position, hourlyRate, allowances,
            bankName, bankAccount, bankRouting, nisExempt } = req.body;

    const first = String(firstName || '').trim();
    const last  = String(lastName  || '').trim();
    const name  = first && last ? `${first} ${last}` : '';

    await db.update(employeeRate).set({
      firstName: first,
      lastName: last,
      employeeName: name,
      department: String(department || 'General').trim(),
      position: String(position || 'Staff').trim(),
      hourlyRate: String(parseFloat(hourlyRate)),
      allowances: String(parseFloat(allowances || 0)),
      bankName: bankName ? String(bankName).trim() : null,
      bankAccount: bankAccount ? String(bankAccount).trim() : null,
      bankRouting: bankRouting ? String(bankRouting).trim() : null,
      nisExempt: (nisExempt === true || nisExempt === 'true') ? 1 : 0,
    }).where(eq(employeeRate.id, id));

    res.json({ message: 'Employee rate updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee rate', message: String(err) });
  }
}
