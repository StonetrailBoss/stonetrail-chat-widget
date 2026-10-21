import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { timeclockEntry } from '../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
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

    if (!name || !payPeriodStart || !payPeriodEnd || !hourlyRate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.insert(timeclockEntry).values({
      firstName: first,
      lastName: last,
      employeeName: name,
      department: department || 'General',
      position: position || 'Staff',
      payPeriodStart: new Date(payPeriodStart),
      payPeriodEnd: new Date(payPeriodEnd),
      regularHours: String(regularHours || 0),
      overtimeHours: String(overtimeHours || 0),
      holidayHours: String(holidayHours || 0),
      hourlyRate: String(hourlyRate),
      allowances: String(allowances || 0),
      notes: notes || null,
      nisExempt: (nisExempt === true || nisExempt === 'true') ? 1 : 0,
      payDate: payDate ? new Date(payDate) : null,
    }).returning();

    res.status(201).json({ id: result.id, message: 'Entry created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create timeclock entry', message: String(err) });
  }
}
