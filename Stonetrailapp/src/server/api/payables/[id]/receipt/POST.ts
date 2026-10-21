import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { accountsPayable } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export default async function handler(req: Request, res: Response) {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    // Expect base64-encoded file in body: { filename, data (base64), mimeType }
    const { filename, data, mimeType } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'filename and data are required' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed' });
    }

    const ext = extname(filename).toLowerCase() || '.bin';
    const safeName = `payable-${id}-${Date.now()}${ext}`;
    const uploadDir = join(process.env.UPLOAD_ROOT || './var/uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(data, 'base64');
    await writeFile(join(uploadDir, safeName), buffer);

    const receiptUrl = `/api/uploads/receipts/${safeName}`;

    await db.update(accountsPayable).set({
      receiptFilename: filename,
      receiptUrl,
    }).where(eq(accountsPayable.id, id));

    res.json({ receiptFilename: filename, receiptUrl });
  } catch (err) {
    console.error('POST /api/payables/:id/receipt error:', err);
    res.status(500).json({ error: 'Failed to upload receipt' });
  }
}
