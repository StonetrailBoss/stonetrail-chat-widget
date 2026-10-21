import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { inventoryItem } from '../../db/schema.js';
import { asc, eq } from 'drizzle-orm';

function generateQcid(id: number): string {
  return `STV-${String(id).padStart(6, '0')}`;
}

export default async function handler(req: Request, res: Response) {
  try {
    const items = await db.select().from(inventoryItem).orderBy(asc(inventoryItem.category), asc(inventoryItem.name));

    // Backfill any existing rows that are missing a QCID
    const missing = items.filter(i => !i.qcid);
    if (missing.length > 0) {
      await Promise.all(
        missing.map(i =>
          db.update(inventoryItem)
            .set({ qcid: generateQcid(i.id) })
            .where(eq(inventoryItem.id, i.id))
        )
      );
      // Re-fetch with QCIDs populated
      const updated = await db.select().from(inventoryItem).orderBy(asc(inventoryItem.category), asc(inventoryItem.name));
      return res.json(updated);
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory', message: String(error) });
  }
}
