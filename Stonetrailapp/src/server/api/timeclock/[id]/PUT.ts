import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { timeclockEntry } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const {
      firstName, lastName, employeeName,
      department, position,
      payPeriodStart, payPeriodEnd,
      regularHours, overtimeHours, holidayHours,
      hourlyRate, allowances, notes, nisExempt, payDate,
    } = req.body;

    const first = String(firstName || '').trim();
    const last  = String(lastName  || '').trim();
    const name  = first && last ? `${first} ${last}` : String(employeeName || '').trim();

    await db.update(timeclockEntry).set({
      firstName: first,
      lastName: last,
      employeeName: name,
      department,
      position,
      payPeriodStart: new Date(payPeriodStart),
      payPeriodEnd: new Date(payPeriodEnd),
      regularHours: String(regularHours),
      overtimeHours: String(overtimeHours),
      holidayHours: String(holidayHours),
      hourlyRate: String(hourlyRate),
      allowances: String(allowances || 0),
      notes: notes || null,
      nisExempt: (nisExempt === true || nisExempt === 'true') ? 1 : 0,
      payDate: payDate ? new Date(payDate) : null,
    }).where(eq(timeclockEntry.id, id));

    res.json({ message: 'Entry updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update entry', message: String(err) });
  }
}
