/**
 * GET /api/employee-deductions/ytd
 *
 * Returns year-to-date totals per custom deduction label for a given employee.
 *
 * Query params:
 *   employee_name  — required
 *   year           — calendar year (default: current year)
 *   upTo           — YYYY-MM-DD cutoff: include periods whose pay_period_end <= this date
 *                    (default: last day of the year)
 *   periods        — number of pay periods already counted in the YTD window (for recurring deductions)
 *
 * Response: { [label: string]: number }
 *   Each key is a deduction label; value is the total EC$ deducted YTD.
 *
 * Logic:
 *   - effective_date: the date from which the deduction starts applying (inclusive).
 *   - end_date: the date after which the deduction stops applying (inclusive).
 *   - Recurring deductions: amount × number of pay periods that fall within
 *     [max(yearStart, effective_date), min(upTo, end_date)].
 *     We fetch the actual payslip count for this employee within that window.
 *   - One-time deductions: included if their effective_date falls within [yearStart, upTo]
 *     and end_date is null or >= effective_date.
 */
import type { Request, Response } from 'express';
import { pool } from '../../../db/client.js';

export default async function handler(req: Request, res: Response) {
  try {
    const employeeName = req.query.employee_name ? String(req.query.employee_name) : '';
    if (!employeeName) return res.status(400).json({ error: 'employee_name is required' });

    const year    = parseInt(String(req.query.year  || new Date().getFullYear()));
    const upTo    = req.query.upTo ? String(req.query.upTo) : `${year}-12-31`;
    const yearStart = `${year}-01-01`;

    const conn = pool;

    // Fetch all deductions for this employee (case-insensitive match)
    const { rows } = await conn.query(
      `SELECT label, amount, is_recurring, effective_date, end_date
       FROM employee_deduction
       WHERE LOWER(TRIM(employee_name)) = LOWER(TRIM($1))`,
      [employeeName] as any[]
    );

    const totals: Record<string, number> = {};

    for (const row of (Array.isArray(rows) ? rows : [])) {
      const label        = String(row.label);
      const amount       = parseFloat(String(row.amount)) || 0;
      const effectiveRaw = row.effective_date ? String(row.effective_date).slice(0, 10) : null;
      const endRaw       = row.end_date       ? String(row.end_date).slice(0, 10)       : null;

      if (row.is_recurring) {
        // Window for this recurring deduction within the YTD range:
        //   windowStart = max(yearStart, effectiveDate ?? yearStart)
        //   windowEnd   = min(upTo, endDate ?? upTo)
        const windowStart = effectiveRaw && effectiveRaw > yearStart ? effectiveRaw : yearStart;
        const windowEnd   = endRaw && endRaw < upTo ? endRaw : upTo;

        if (windowStart > windowEnd) continue; // deduction not active in this year/window

        // Count payslip periods for this employee within the window
        const { rows: countRows } = await conn.query(
          `SELECT COUNT(*) AS cnt FROM payslip
           WHERE employee_name = $1
             AND pay_period_start >= $2
             AND pay_period_end   <= $3`,
          [employeeName, windowStart, windowEnd] as any[]
        );
        const periodsInWindow: number = parseInt(String(countRows?.[0]?.cnt ?? 0)) || 0;

        if (periodsInWindow > 0) {
          totals[label] = (totals[label] ?? 0) + parseFloat((amount * periodsInWindow).toFixed(2));
        }
      } else {
        // One-time: apply if effective_date falls within [yearStart, upTo]
        // and end_date is null or >= effective_date (sanity check)
        if (!effectiveRaw) continue;
        if (effectiveRaw < yearStart || effectiveRaw > upTo) continue;
        if (endRaw && endRaw < effectiveRaw) continue;
        totals[label] = (totals[label] ?? 0) + amount;
      }
    }

    // Round all values to 2dp
    for (const key of Object.keys(totals)) {
      totals[key] = parseFloat(totals[key].toFixed(2));
    }

    res.json(totals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch custom deductions YTD', message: String(err) });
  }
}
