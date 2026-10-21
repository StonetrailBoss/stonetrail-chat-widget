import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { inventoryItem, auditLog } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    const existing = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Item not found' });

    await db.delete(inventoryItem).where(eq(inventoryItem.id, id));

    await db.insert(auditLog).values({
      userId: 'system',
      action: 'DELETE',
      itemId: id,
      details: `Deleted item: ${existing[0].name}`,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item', message: String(error) });
  }
}
