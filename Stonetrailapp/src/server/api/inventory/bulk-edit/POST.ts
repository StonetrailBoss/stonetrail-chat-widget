import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { inventoryItem, auditLog } from '../../../db/schema.js';
import { inArray } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { ids, patch } = req.body as {
      ids: number[];
      patch: {
        category?: string;
        unit?: string;
        quantity?: number;
        lowStockThreshold?: number;
      };
    };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    if (!patch || Object.keys(patch).length === 0) {
      return res.status(400).json({ error: 'patch object is required' });
    }
    const numIds = ids.map(Number).filter(Boolean);
    const update: Record<string, unknown> = {};
    if (patch.category !== undefined) update.category = patch.category;
    if (patch.unit !== undefined) update.unit = patch.unit;
    if (patch.quantity !== undefined) update.quantity = Number(patch.quantity);
    if (patch.lowStockThreshold !== undefined) update.lowStockThreshold = Number(patch.lowStockThreshold);

    await db.update(inventoryItem).set(update).where(inArray(inventoryItem.id, numIds));
    await db.insert(auditLog).values({
      userId: 'system',
      action: 'UPDATE',
      itemId: null,
      details: `Bulk edited ${numIds.length} item(s): ${Object.keys(update).join(', ')}`,
    });
    res.json({ updated: numIds.length });
  } catch (err) {
    res.status(500).json({ error: 'Bulk edit failed', message: String(err) });
  }
}
