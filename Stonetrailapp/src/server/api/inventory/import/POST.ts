import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { inventoryItem, auditLog } from '../../../db/schema.js';

interface ImportRow {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  notes?: string;
}

export default async function handler(req: Request, res: Response) {
  try {
    const rows: ImportRow[] = req.body.items;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      if (!row.name || !row.category) {
        results.skipped++;
        results.errors.push(`Skipped row — missing name or category: ${JSON.stringify(row)}`);
        continue;
      }
      try {
        const result = await db.insert(inventoryItem).values({
          name: String(row.name).trim(),
          category: String(row.category).trim(),
          quantity: Number(row.quantity) || 0,
          unit: String(row.unit || 'units').trim(),
          lowStockThreshold: Number(row.lowStockThreshold) || 5,
          notes: row.notes ? String(row.notes).trim() : null,
        }).returning();
        const insertId = Number(result[0].id);
        await db.insert(auditLog).values({
          userId: 'system-import',
          action: 'CREATE',
          itemId: insertId,
          details: `Bulk import: ${row.name}`,
        });
        results.inserted++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Failed to insert "${row.name}": ${String(err)}`);
      }
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: 'Import failed', message: String(error) });
  }
}
