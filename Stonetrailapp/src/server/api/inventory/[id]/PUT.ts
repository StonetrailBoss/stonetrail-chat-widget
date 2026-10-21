import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { inventoryItem, auditLog } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    const { name, category, quantity, unit, lowStockThreshold, notes, description, imageUrl } = req.body;

    await db.update(inventoryItem).set({
      name,
      category,
      quantity: Number(quantity),
      unit,
      lowStockThreshold: Number(lowStockThreshold),
      description: description || null,
      notes: notes || null,
      ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
    }).where(eq(inventoryItem.id, id));

    const updated = await db.select().from(inventoryItem).where(eq(inventoryItem.id, id)).limit(1);

    await db.insert(auditLog).values({
      userId: 'system',
      action: 'UPDATE',
      itemId: id,
      details: `Updated item: ${name}`,
    });

    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item', message: String(error) });
  }
}
