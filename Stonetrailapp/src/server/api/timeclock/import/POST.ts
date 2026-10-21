/**
 * Bulk import timeclock entries from CSV or JSON.
 * Expected JSON body: { entries: TimeclockEntry[] }
 * Each entry: { firstName, lastName, department, position, payPeriodStart, payPeriodEnd,
 *               regularHours, overtimeHours, holidayHours, hourlyRate, allowances, notes }
 *
 * employeeName is derived as `${firstName} ${lastName}` and stored for backward compatibility.
 *
 * Validation rules:
 *   1. employeeName + payPeriodStart + payPeriodEnd must be unique within the import batch.
 *   2. employeeName + payPeriodStart + payPeriodEnd must not already exist in the database.
 *   Duplicate rows are rejected with a descriptive error listing each conflict.
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { timeclockEntry, employeeRate } from '../../../db/schema.js';
import type { InferInsertModel } from 'drizzle-orm';
import { and, gte, lte, sql } from 'drizzle-orm'; // sql still used in duplicate-check query

type TimeclockInsert = InferInsertModel<typeof timeclockEntry>;

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

export default async function handler(req: Request, res: Response) {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'entries array is required' });
    }

    // Pay date = today (date the file is uploaded) as YYYY-MM-DD string
    const uploadDate = toDateStr(new Date());

    // Load rate card — keyed by employee_name for O(1) lookup
    const rateCards = await db.select().from(employeeRate);
    const rateMap = new Map(rateCards.map(r => [r.employeeName.toLowerCase(), r]));

    // Parse and validate rows
    const rows: TimeclockInsert[] = entries.map((e: any) => {
      const firstName = String(e.firstName || '').trim();
      const lastName  = String(e.lastName  || '').trim();
      const employeeName = firstName && lastName
        ? `${firstName} ${lastName}`
        : String(e.employeeName || `${firstName} ${lastName}`).trim();

      // Look up rate card by name (case-insensitive)
      const card = rateMap.get(employeeName.toLowerCase());

      const payPeriodStart = new Date(e.payPeriodStart);
      const payPeriodEnd   = new Date(e.payPeriodEnd);

      // Nullable varchar/text columns must be null (not '') — empty string causes
      // MySQL2 driver param-count mismatch in some Drizzle versions.
      const notesVal      = e.notes       ? String(e.notes)                    : null;
      const bankNameVal   = e.bankName    ? String(e.bankName).trim()          : (card?.bankName    || null);
      const bankAccountVal= e.bankAccount ? String(e.bankAccount).trim()       : (card?.bankAccount || null);
      const bankRoutingVal= e.bankRouting ? String(e.bankRouting).trim()       : (card?.bankRouting || null);

      const row: TimeclockInsert = {
        firstName,
        lastName,
        employeeName,
        department: String(e.department || card?.department || 'General').trim(),
        position:   String(e.position   || card?.position   || 'Staff').trim(),
        payPeriodStart: payPeriodStart,
        payPeriodEnd:   payPeriodEnd,
        regularHours:  String(isFinite(parseFloat(e.regularHours))  ? parseFloat(e.regularHours)  : 0),
        overtimeHours: String(isFinite(parseFloat(e.overtimeHours)) ? parseFloat(e.overtimeHours) : 0),
        holidayHours:  String(isFinite(parseFloat(e.holidayHours))  ? parseFloat(e.holidayHours)  : 0),
        hourlyRate:    String(isFinite(parseFloat(e.hourlyRate))     ? parseFloat(e.hourlyRate)     : isFinite(parseFloat(card?.hourlyRate ?? '')) ? parseFloat(card!.hourlyRate) : 0),
        allowances:    String(isFinite(parseFloat(e.allowances))    ? parseFloat(e.allowances)     : isFinite(parseFloat(card?.allowances ?? '')) ? parseFloat(card!.allowances) : 0),
        notes:       notesVal,
        bankName:    bankNameVal,
        bankAccount: bankAccountVal,
        bankRouting: bankRoutingVal,
        nisExempt:   (e.nisExempt === true || e.nisExempt === 'true' || !!card?.nisExempt) ? 1 : 0,
        payDate:     new Date(uploadDate),
      };
      return row;
    }).filter((r): r is TimeclockInsert => !!r.employeeName && !!r.payPeriodStart && !!r.payPeriodEnd);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'No valid entries found' });
    }

    // ── Rule 1: Duplicates within the import batch itself ─────────────────────
    const batchKeys = new Set<string>();
    const batchDuplicates: string[] = [];
    for (const row of rows) {
      const key = `${row.employeeName}|${toDateStr(row.payPeriodStart)}|${toDateStr(row.payPeriodEnd)}`;
      if (batchKeys.has(key)) {
        batchDuplicates.push(`"${row.employeeName}" (${row.payPeriodStart} – ${row.payPeriodEnd})`);
      } else {
        batchKeys.add(key);
      }
    }
    if (batchDuplicates.length > 0) {
      return res.status(409).json({
        error: 'Duplicate entries within the import file',
        duplicates: batchDuplicates,
        message: `The following rows appear more than once in the file: ${batchDuplicates.join('; ')}`,
      });
    }

    // ── Rule 2: Conflicts against existing database records ───────────────────
    const minStart = rows.reduce((min, r) => r.payPeriodStart < min ? r.payPeriodStart : min, rows[0].payPeriodStart);
    const maxEnd   = rows.reduce((max, r) => r.payPeriodEnd   > max ? r.payPeriodEnd   : max, rows[0].payPeriodEnd);

    const existing = await db
      .select({
        employeeName: timeclockEntry.employeeName,
        payPeriodStart: timeclockEntry.payPeriodStart,
        payPeriodEnd: timeclockEntry.payPeriodEnd,
      })
      .from(timeclockEntry)
      .where(
        and(
          gte(timeclockEntry.payPeriodStart, sql`${minStart}`),
          lte(timeclockEntry.payPeriodEnd, sql`${maxEnd}`)
        )
      );

    const existingKeys = new Set(
      existing.map(r => `${r.employeeName}|${toDateStr(new Date(r.payPeriodStart))}|${toDateStr(new Date(r.payPeriodEnd))}`)
    );

    const dbConflicts: string[] = [];
    for (const row of rows) {
      const key = `${row.employeeName}|${toDateStr(row.payPeriodStart)}|${toDateStr(row.payPeriodEnd)}`;
      if (existingKeys.has(key)) {
        dbConflicts.push(`"${row.employeeName}" (${row.payPeriodStart} – ${row.payPeriodEnd})`);
      }
    }
    if (dbConflicts.length > 0) {
      return res.status(409).json({
        error: 'Entries already exist for the same employee and pay period',
        duplicates: dbConflicts,
        message: `The following entries already exist in the system: ${dbConflicts.join('; ')}`,
      });
    }

    await db.transaction(async tx => {
      // Batch is atomic: no partially imported payroll file.
      await tx.insert(timeclockEntry).values(rows);
    });
    res.status(201).json({ imported: rows.length, message: `${rows.length} entries imported successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Import failed', message: String(err) });
  }
}
