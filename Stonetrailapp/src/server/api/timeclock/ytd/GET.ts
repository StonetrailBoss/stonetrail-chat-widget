/**
 * GET /api/timeclock/ytd
 *
 * Returns year-to-date payslip totals aggregated by employee.
 * Query params:
 *   year  — calendar year (default: current year)
 *   name  — filter to a specific employee name (optional)
 *   upTo  — YYYY-MM-DD cutoff: only include periods whose payPeriodEnd <= this date
 *            (default: last day of the year — i.e. full year)
 *
 * Response shape:
 * {
 *   year: number,
 *   upTo: string,
 *   employees: [{
 *     employeeName, department, position,
 *     periods: number,           // pay periods included
 *     regularHours, overtimeHours, holidayHours,
 *     regularPay, overtimePay, holidayPay, allowances,
 *     grossPay,
 *     nisEmployee, nisEmployer, nisTotal,
 *     payeTax, totalDeductions, netPay,
 *     byMonth: { [YYYY-MM]: { grossPay, nisEmployee, nisEmployer, nisTotal, payeTax, netPay, periods } }
 *   }]
 * }
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { payslip } from '../../../db/schema.js';
import { and, gte, lte } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const year = parseInt(String(req.query.year || new Date().getFullYear()));
    const nameFilter = req.query.name ? String(req.query.name) : null;

    // upTo: include all periods whose payPeriodEnd falls on or before this date.
    // Defaults to the last day of the year so a plain year query still returns
    // the full year when no cutoff is needed.
    const upToRaw = req.query.upTo ? String(req.query.upTo) : `${year}-12-31`;
    // Parse as end-of-day UTC so a payPeriodEnd stored as a DATE (midnight UTC)
    // is always <= the cutoff regardless of server timezone offset.
    const upToDate = new Date(`${upToRaw}T23:59:59.999Z`);
    if (isNaN(upToDate.getTime())) {
      return res.status(400).json({ error: 'Invalid upTo date' });
    }

    // yearStart at UTC midnight so the gte comparison is inclusive of Jan 1
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);

    // Fetch all payslips whose pay period starts in the calendar year
    // AND whose pay period ends on or before the upTo cutoff.
    let rows = await db
      .select()
      .from(payslip)
      .where(
        and(
          gte(payslip.payPeriodStart, yearStart),
          lte(payslip.payPeriodEnd, upToDate)
        )
      );

    if (nameFilter) {
      rows = rows.filter(r => r.employeeName.toLowerCase() === nameFilter.toLowerCase());
    }

    // Group by employee
    const employeeMap = new Map<string, {
      employeeName: string;
      department: string;
      position: string;
      periods: number;
      regularHours: number;
      overtimeHours: number;
      holidayHours: number;
      regularPay: number;
      overtimePay: number;
      holidayPay: number;
      allowances: number;
      grossPay: number;
      nisEmployee: number;
      nisEmployer: number;
      payeTax: number;
      totalDeductions: number;
      netPay: number;
      byMonth: Record<string, {
        grossPay: number;
        nisEmployee: number;
        nisEmployer: number;
        nisTotal: number;
        payeTax: number;
        totalDeductions: number;
        netPay: number;
        periods: number;
      }>;
    }>();

    for (const row of rows) {
      const key = row.employeeName;
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employeeName: row.employeeName,
          department: row.department,
          position: row.position,
          periods: 0,
          regularHours: 0,
          overtimeHours: 0,
          holidayHours: 0,
          regularPay: 0,
          overtimePay: 0,
          holidayPay: 0,
          allowances: 0,
          grossPay: 0,
          nisEmployee: 0,
          nisEmployer: 0,
          payeTax: 0,
          totalDeductions: 0,
          netPay: 0,
          byMonth: {},
        });
      }

      const emp = employeeMap.get(key)!;
      const p = (v: string | number | null) => parseFloat(String(v ?? 0)) || 0;

      emp.periods += 1;
      emp.regularHours += p(row.regularHours);
      emp.overtimeHours += p(row.overtimeHours);
      emp.holidayHours += p(row.holidayHours);
      emp.regularPay += p(row.regularPay);
      emp.overtimePay += p(row.overtimePay);
      emp.holidayPay += p(row.holidayPay);
      emp.allowances += p(row.allowances);
      emp.grossPay += p(row.grossPay);
      emp.nisEmployee += p(row.nisEmployee);
      emp.nisEmployer += p(row.nisEmployer);
      emp.payeTax += p(row.payeTax);
      emp.totalDeductions += p(row.totalDeductions);
      emp.netPay += p(row.netPay);

      // Month key from pay period start — handle both Date objects and ISO strings
      const periodStart = row.payPeriodStart instanceof Date
        ? row.payPeriodStart
        : new Date(String(row.payPeriodStart));
      const monthKey = `${periodStart.getUTCFullYear()}-${String(periodStart.getUTCMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      if (!emp.byMonth[monthKey]) {
        emp.byMonth[monthKey] = { grossPay: 0, nisEmployee: 0, nisEmployer: 0, nisTotal: 0, payeTax: 0, totalDeductions: 0, netPay: 0, periods: 0 };
      }
      const m = emp.byMonth[monthKey];
      m.periods += 1;
      m.grossPay += p(row.grossPay);
      m.nisEmployee += p(row.nisEmployee);
      m.nisEmployer += p(row.nisEmployer);
      m.nisTotal = m.nisEmployee + m.nisEmployer;
      m.payeTax += p(row.payeTax);
      m.totalDeductions += p(row.totalDeductions);
      m.netPay += p(row.netPay);
    }

    // Round all totals to 2dp and add nisTotal
    const employees = Array.from(employeeMap.values()).map(emp => {
      const round = (n: number) => parseFloat(n.toFixed(2));
      return {
        ...emp,
        regularHours: round(emp.regularHours),
        overtimeHours: round(emp.overtimeHours),
        holidayHours: round(emp.holidayHours),
        regularPay: round(emp.regularPay),
        overtimePay: round(emp.overtimePay),
        holidayPay: round(emp.holidayPay),
        allowances: round(emp.allowances),
        grossPay: round(emp.grossPay),
        nisEmployee: round(emp.nisEmployee),
        nisEmployer: round(emp.nisEmployer),
        nisTotal: round(emp.nisEmployee + emp.nisEmployer),
        payeTax: round(emp.payeTax),
        totalDeductions: round(emp.totalDeductions),
        netPay: round(emp.netPay),
        byMonth: Object.fromEntries(
          Object.entries(emp.byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, m]) => [month, {
              ...m,
              grossPay: round(m.grossPay),
              nisEmployee: round(m.nisEmployee),
              nisEmployer: round(m.nisEmployer),
              nisTotal: round(m.nisEmployee + m.nisEmployer),
              payeTax: round(m.payeTax),
              totalDeductions: round(m.totalDeductions),
              netPay: round(m.netPay),
            }])
        ),
      };
    }).sort((a, b) => a.employeeName.localeCompare(b.employeeName));

    res.json({ year, upTo: upToRaw, employees });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch YTD data', message: String(err) });
  }
}
