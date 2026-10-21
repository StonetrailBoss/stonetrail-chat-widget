import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { inventoryItem, auditLog } from '../../../db/schema.js';
import { inArray } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { ids } = req.body as { ids: number[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const numIds = ids.map(Number).filter(Boolean);
    await db.delete(inventoryItem).where(inArray(inventoryItem.id, numIds));
    await db.insert(auditLog).values({
      userId: 'system',
      action: 'DELETE',
      itemId: null,
      details: `Bulk deleted ${numIds.length} item(s): IDs ${numIds.join(', ')}`,
    });
    res.json({ deleted: numIds.length });
  } catch (err) {
    res.status(500).json({ error: 'Bulk delete failed', message: String(err) });
  }
}
