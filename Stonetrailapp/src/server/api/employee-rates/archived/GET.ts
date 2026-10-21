import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { employeeRate, timeclockEntry, payslip } from '../../../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    // Fetch all archived employees
    const archived = await db
      .select()
      .from(employeeRate)
      .where(eq(employeeRate.isArchived, 1))
      .orderBy(desc(employeeRate.archivedAt));

    // For each archived employee, fetch their timeclock entries and payslips
    const enriched = await Promise.all(
      archived.map(async (emp) => {
        const [entries, slips] = await Promise.all([
          db
            .select()
            .from(timeclockEntry)
            .where(
              and(
                eq(timeclockEntry.firstName, emp.firstName),
                eq(timeclockEntry.lastName, emp.lastName)
              )
            )
            .orderBy(desc(timeclockEntry.payPeriodStart)),
          db
            .select()
            .from(payslip)
            .where(
              and(
                eq(payslip.firstName, emp.firstName),
                eq(payslip.lastName, emp.lastName)
              )
            )
            .orderBy(desc(payslip.payPeriodStart)),
        ]);

        return {
          ...emp,
          timeclockEntries: entries,
          payslips: slips,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch archived employees', message: String(err) });
  }
}
