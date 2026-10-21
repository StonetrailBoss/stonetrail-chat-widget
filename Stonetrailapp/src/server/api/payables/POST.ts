import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { accountsPayable } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const {
      vendor, description, amount, amountPaid, billDate, dueDate, datePaid,
      category, status, notes, receiptFilename, receiptUrl,
    } = req.body;

    if (!vendor || !amount || !dueDate) {
      return res.status(400).json({ error: 'vendor, amount, and dueDate are required' });
    }

    const [result] = await db.insert(accountsPayable).values({
      vendor: String(vendor).trim(),
      description: description ? String(description).trim() : null,
      amount: String(parseFloat(amount).toFixed(2)),
      amountPaid: String(parseFloat(amountPaid ?? 0).toFixed(2)),
      billDate: billDate ? new Date(`${billDate}T00:00:00Z`) : null,
      dueDate: new Date(`${dueDate}T00:00:00Z`),
      datePaid: datePaid ? new Date(`${datePaid}T00:00:00Z`) : null,
      category: category || 'General',
      status: status || 'unpaid',
      notes: notes ? String(notes).trim() : null,
      receiptFilename: receiptFilename || null,
      receiptUrl: receiptUrl || null,
    }).returning();

    const insertId = result.id;
    const [rows] = await db.select().from(accountsPayable).where(eq(accountsPayable.id, insertId));
    res.status(201).json(rows);
  } catch (err) {
    console.error('POST /api/payables error:', err);
    res.status(500).json({ error: 'Failed to create payable' });
  }
}
