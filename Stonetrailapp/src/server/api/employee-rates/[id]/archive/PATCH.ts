/**
 * PATCH /api/employee-rates/:id/archive
 *
 * Toggles the archived state of an employee rate card.
 * Body: { archive: boolean }
 *   true  → marks as archived (employee left)
 *   false → restores to active (re-hired or correction)
 *
 * Associated timeclock entries and payslips are NOT deleted —
 * they remain queryable via GET /api/employee-rates/archived.
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { employeeRate } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const archive: boolean = req.body?.archive !== false; // default true

    await db
      .update(employeeRate)
      .set({
        isArchived: archive ? 1 : 0,
        archivedAt: archive ? new Date() : null,
      })
      .where(eq(employeeRate.id, id));

    res.json({
      message: archive ? 'Employee archived successfully' : 'Employee restored successfully',
      archived: archive,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update archive status', message: String(err) });
  }
}
