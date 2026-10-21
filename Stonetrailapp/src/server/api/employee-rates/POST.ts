import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { employeeRate } from '../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { firstName, lastName, department, position, hourlyRate, allowances,
            bankName, bankAccount, bankRouting, nisExempt } = req.body;

    const first = String(firstName || '').trim();
    const last  = String(lastName  || '').trim();
    if (!first || !last || !hourlyRate) {
      return res.status(400).json({ error: 'firstName, lastName and hourlyRate are required' });
    }
    const name = `${first} ${last}`;

    const [result] = await db.insert(employeeRate).values({
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
    }).returning();

    res.status(201).json({ id: result.id, message: 'Employee rate created' });
  } catch (err: any) {
    if ((err?.cause?.code ?? err?.code) === '23505') {
      return res.status(409).json({ error: 'An employee with that name already exists in the rate card' });
    }
    res.status(500).json({ error: 'Failed to create employee rate', message: String(err) });
  }
}
