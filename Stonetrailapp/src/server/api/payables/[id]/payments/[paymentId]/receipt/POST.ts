import type { Request, Response } from 'express';
import { db } from '../../../../../../db/client.js';
import { payablePayment } from '../../../../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';

export default async function handler(req: Request, res: Response) {
  try {
    const payableId  = parseInt(String(req.params.id), 10);
    const paymentId  = parseInt(String(req.params.paymentId), 10);
    if (isNaN(payableId) || isNaN(paymentId)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const { filename, data, mimeType } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ error: 'filename and data are required' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (mimeType && !allowedTypes.includes(mimeType)) {
      return res.status(400).json({ error: 'Only JPEG, PNG, WebP, and PDF files are allowed' });
    }

    // Verify the payment belongs to this payable
    const [existing] = await db
      .select({ id: payablePayment.id })
      .from(payablePayment)
      .where(and(eq(payablePayment.id, paymentId), eq(payablePayment.payableId, payableId)));

    if (!existing) return res.status(404).json({ error: 'Payment record not found' });

    const ext      = extname(filename).toLowerCase() || '.bin';
    const safeName = `payment-${paymentId}-${Date.now()}${ext}`;
    const uploadDir = join(process.env.UPLOAD_ROOT || './var/uploads', 'receipts');
    await mkdir(uploadDir, { recursive: true });

    // data is raw base64 (no data-URL prefix)
    const buffer = Buffer.from(data, 'base64');
    await writeFile(join(uploadDir, safeName), buffer);

    const receiptUrl = `/api/uploads/receipts/${safeName}`;

    await db.update(payablePayment).set({
      receiptFilename: filename,
      receiptUrl,
    }).where(eq(payablePayment.id, paymentId));

    res.json({ receiptFilename: filename, receiptUrl });
  } catch (err) {
    console.error('POST /api/payables/:id/payments/:paymentId/receipt error:', err);
    res.status(500).json({ error: 'Receipt upload failed', message: String(err) });
  }
}
