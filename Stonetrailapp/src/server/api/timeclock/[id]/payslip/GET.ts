/**
 * Generate payslip for a timeclock entry.
 * Applies St. Vincent & the Grenadines (SVG) tax rules:
 *
 * NIS (National Insurance Services):
 *   - Rates are looked up from the nis_rate table by pay period year.
 *   - Falls back to 6.5% employee / 7.0% employer if no rate found.
 *   - Weekly insurable earnings ceiling: EC$1,000
 *
 * PAYE: exempt for this property — always zero.
 * Overtime: 1.5× regular rate (configurable)
 * Holiday: 2.0× regular rate
 */

import type { Request, Response } from 'express';
import { db, pool } from '../../../../db/client.js';
import { timeclockEntry, payslip } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ── SVG Tax Constants ─────────────────────────────────────────────────────────
const NIS_WEEKLY_CEILING = 1000;       // EC$1,000/week insurable ceiling
const NIS_EMPLOYEE_RATE_DEFAULT = 0.065;
const NIS_EMPLOYER_RATE_DEFAULT = 0.070;

async function getNisRatesForYear(year: number): Promise<{ employeeRate: number; employerRate: number }> {
  try {
    const rows = await db.execute(sql.raw(`SELECT employee_rate, employer_rate FROM nis_rate WHERE year = ${year} LIMIT 1`)) as any;
    const data = rows.rows;
    if (Array.isArray(data) && data.length > 0) {
      return {
        employeeRate: parseFloat(String(data[0].employee_rate)),
        employerRate: parseFloat(String(data[0].employer_rate)),
      };
    }
  } catch { /* fall through to defaults */ }
  return { employeeRate: NIS_EMPLOYEE_RATE_DEFAULT, employerRate: NIS_EMPLOYER_RATE_DEFAULT };
}

interface CustomDeduction {
  id: number;
  label: string;
  amount: string;
  is_recurring: number;
  effective_date: string | null;
  end_date: string | null;
  notes: string | null;
}

/**
 * Returns deductions active for the given pay period start date:
 *   effective_date IS NULL OR effective_date <= payPeriodStart
 *   AND end_date IS NULL OR end_date >= payPeriodStart
 */
async function getCustomDeductions(employeeName: string, payPeriodStart: string): Promise<CustomDeduction[]> {
  try {
    const conn = pool;
    const { rows } = await conn.query(
      `SELECT id, label, amount, is_recurring, effective_date, end_date, notes
       FROM employee_deduction
       WHERE LOWER(TRIM(employee_name)) = LOWER(TRIM($1))
         AND (effective_date IS NULL OR effective_date <= $2)
         AND (end_date IS NULL OR end_date >= $3)
       ORDER BY label ASC`,
      [employeeName, payPeriodStart, payPeriodStart] as any[]
    );
    const result = Array.isArray(rows) ? rows as CustomDeduction[] : [];
    if (result.length > 0) {
      console.log(`[payslip] found ${result.length} custom deduction(s) for "${employeeName}" on ${payPeriodStart}:`, result.map(d => `${d.label}=EC${d.amount}`).join(', '));
    } else {
      console.log(`[payslip] no custom deductions found for "${employeeName}" on ${payPeriodStart}`);
    }
    return result;
  } catch (err) {
    console.error('[payslip] getCustomDeductions error:', err);
    return [];
  }
}

function calcPayslip(
  entry: {
    regularHours: string;
    overtimeHours: string;
    holidayHours: string;
    hourlyRate: string;
    allowances: string;
    payPeriodStart: Date | string;
    payPeriodEnd: Date | string;
    nisExempt?: boolean | number;
  },
  overtimeMultiplier = 1,
  nisRates = { employeeRate: NIS_EMPLOYEE_RATE_DEFAULT, employerRate: NIS_EMPLOYER_RATE_DEFAULT },
  customDeductions: CustomDeduction[] = []
) {
  const regularHours = parseFloat(entry.regularHours) || 0;
  const overtimeHours = parseFloat(entry.overtimeHours) || 0;
  const holidayHours = parseFloat(entry.holidayHours) || 0;
  const hourlyRate = parseFloat(entry.hourlyRate) || 0;
  const allowances = parseFloat(entry.allowances) || 0;

  // Pay calculations
  const regularPay = regularHours * hourlyRate;
  const overtimePay = overtimeHours * hourlyRate * overtimeMultiplier;
  const holidayPay = holidayHours * hourlyRate * 1.0;
  const grossPay = regularPay + overtimePay + holidayPay + allowances;

  // Determine pay period length in weeks
  const start = new Date(entry.payPeriodStart);
  const end = new Date(entry.payPeriodEnd);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const weeks = days / 7;

  // NIS — applied to insurable earnings (gross excl. allowances, capped at ceiling)
  const insurableEarnings = Math.min(regularPay + overtimePay + holidayPay, NIS_WEEKLY_CEILING * weeks);
  const nisEmployee = entry.nisExempt ? 0 : parseFloat((insurableEarnings * nisRates.employeeRate).toFixed(2));
  const nisEmployer = entry.nisExempt ? 0 : parseFloat((insurableEarnings * nisRates.employerRate).toFixed(2));

  // PAYE — exempt for this property; always zero
  const payeTax = 0;

  // Custom deductions total
  const customDeductionsTotal = parseFloat(
    customDeductions.reduce((sum, d) => sum + parseFloat(String(d.amount)), 0).toFixed(2)
  );

  const totalDeductions = parseFloat((nisEmployee + payeTax + customDeductionsTotal).toFixed(2));
  const netPay = parseFloat((grossPay - totalDeductions).toFixed(2));

  return {
    regularPay: parseFloat(regularPay.toFixed(2)),
    overtimePay: parseFloat(overtimePay.toFixed(2)),
    holidayPay: parseFloat(holidayPay.toFixed(2)),
    grossPay: parseFloat(grossPay.toFixed(2)),
    nisEmployee,
    nisEmployer,
    nisEmployeeRate: nisRates.employeeRate,
    nisEmployerRate: nisRates.employerRate,
    payeTax,
    customDeductions: customDeductions.map(d => ({
      id: d.id,
      label: d.label,
      amount: parseFloat(String(d.amount)),
      isRecurring: d.is_recurring === 1,
    })),
    customDeductionsTotal,
    totalDeductions,
    netPay,
    overtimeMultiplier,
  };
}

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id));
    const [entry] = await db.select().from(timeclockEntry).where(eq(timeclockEntry.id, id));
    if (!entry) return res.status(404).json({ error: 'Timeclock entry not found' });

    // Overtime multiplier: any positive multiple of 0.5 (default 1)
    const rawMultiplier = parseFloat(String(req.query.overtimeMultiplier ?? '1'));
    const isValid = !isNaN(rawMultiplier) && rawMultiplier > 0 && Math.round(rawMultiplier * 2) === rawMultiplier * 2;
    const overtimeMultiplier = isValid ? rawMultiplier : 1;

    // Look up NIS rates for the pay period year
    const payYear = new Date(entry.payPeriodStart).getFullYear();
    const nisRates = await getNisRatesForYear(payYear);

    // Fetch custom deductions active for this pay period start.
    // entry.payPeriodStart may be a Date object (MySQL DATE column) — use UTC
    // accessors to build YYYY-MM-DD so the SQL date comparison works correctly.
    const psDate = entry.payPeriodStart instanceof Date
      ? entry.payPeriodStart
      : new Date(String(entry.payPeriodStart));
    const periodStart = `${psDate.getUTCFullYear()}-${String(psDate.getUTCMonth() + 1).padStart(2, '0')}-${String(psDate.getUTCDate()).padStart(2, '0')}`;
    const customDeductions = await getCustomDeductions(entry.employeeName, periodStart);

    const calc = calcPayslip(entry, overtimeMultiplier, nisRates, customDeductions);

    // Upsert payslip record
    const existing = await db.select().from(payslip).where(eq(payslip.timeclockEntryId, id));
    if (existing.length > 0) {
      await db.update(payslip).set({
        regularHours: entry.regularHours,
        overtimeHours: entry.overtimeHours,
        holidayHours: entry.holidayHours,
        hourlyRate: entry.hourlyRate,
        allowances: entry.allowances,
        regularPay: String(calc.regularPay),
        overtimePay: String(calc.overtimePay),
        holidayPay: String(calc.holidayPay),
        grossPay: String(calc.grossPay),
        nisEmployee: String(calc.nisEmployee),
        nisEmployer: String(calc.nisEmployer),
        payeTax: String(calc.payeTax),
        totalDeductions: String(calc.totalDeductions),
        netPay: String(calc.netPay),
      }).where(eq(payslip.timeclockEntryId, id));
    } else {
      await db.insert(payslip).values({
        timeclockEntryId: id,
        firstName: entry.firstName || '',
        lastName: entry.lastName || '',
        employeeName: entry.employeeName,
        department: entry.department,
        position: entry.position,
        payPeriodStart: new Date(entry.payPeriodStart),
        payPeriodEnd: new Date(entry.payPeriodEnd),
        regularHours: entry.regularHours,
        overtimeHours: entry.overtimeHours,
        holidayHours: entry.holidayHours,
        hourlyRate: entry.hourlyRate,
        allowances: entry.allowances,
        regularPay: String(calc.regularPay),
        overtimePay: String(calc.overtimePay),
        holidayPay: String(calc.holidayPay),
        grossPay: String(calc.grossPay),
        nisEmployee: String(calc.nisEmployee),
        nisEmployer: String(calc.nisEmployer),
        payeTax: String(calc.payeTax),
        totalDeductions: String(calc.totalDeductions),
        netPay: String(calc.netPay),
      });
    }

    res.json({
      entry,
      payslip: {
        ...entry,
        ...calc,
        nisExempt: entry.nisExempt ?? false,
        overtimeMultiplier,
        bankName: entry.bankName ?? null,
        bankAccount: entry.bankAccount ?? null,
        bankRouting: entry.bankRouting ?? null,
        payDate: entry.payDate ? String(entry.payDate).slice(0, 10) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate payslip', message: String(err) });
  }
}
