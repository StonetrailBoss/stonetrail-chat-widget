import type { Request, Response } from 'express';
import { db } from '../../db/client.js';
import { inventoryItem, auditLog } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

function generateQcid(id: number): string {
  return `STV-${String(id).padStart(6, '0')}`;
}

export default async function handler(req: Request, res: Response) {
  try {
    const { name, category, quantity, unit, lowStockThreshold, notes, description } = req.body;
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }
    const result = await db.insert(inventoryItem).values({
      name,
      category,
      quantity: Number(quantity) || 0,
      unit: unit || 'units',
      lowStockThreshold: Number(lowStockThreshold) || 5,
      description: description || null,
      notes: notes || null,
    }).returning();
    const insertId = Number(result[0].id);

    // Auto-generate QCID based on the new row's ID
    const qcid = generateQcid(insertId);
    await db.update(inventoryItem).set({ qcid }).where(eq(inventoryItem.id, insertId));

    const newItem = await db.select().from(inventoryItem).where(eq(inventoryItem.id, insertId)).limit(1);

    // Audit log
    await db.insert(auditLog).values({
      userId: 'system',
      action: 'CREATE',
      itemId: insertId,
      details: `Created item: ${name} [${qcid}]`,
    });

    res.status(201).json(newItem[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create item', message: String(error) });
  }
}
