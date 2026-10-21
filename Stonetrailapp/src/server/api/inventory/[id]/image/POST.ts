import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { inventoryItem, auditLog } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    // Expect base64-encoded file: { filename, data (base64), mimeType }
    const { filename, data, mimeType } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'filename and data are required' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, WebP, and GIF files are allowed' });
    }

    const ext = extname(filename).toLowerCase() || '.jpg';
    const safeName = `inventory-${id}-${Date.now()}${ext}`;
    const uploadDir = join(process.env.UPLOAD_ROOT || './var/uploads', 'inventory');
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(data, 'base64');
    await writeFile(join(uploadDir, safeName), buffer);

    const imageUrl = `/api/uploads/inventory/${safeName}`;

    await db.update(inventoryItem).set({ imageUrl }).where(eq(inventoryItem.id, id));
    await db.insert(auditLog).values({
      userId: 'system',
      action: 'UPDATE',
      itemId: id,
      details: `Uploaded image for item ID ${id}: ${filename}`,
    });

    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed', message: String(err) });
  }
}
