/**
 * DELETE /api/admin/staff/:id
 * Delete a staff user account (admin only). Cannot delete yourself.
 */
import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { user, session, account } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const requestingUserId = (req as any).user?.id;

    if (id === requestingUserId) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const [found] = await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.id, id));
    if (!found) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete related rows first to avoid FK constraint errors
    await db.delete(session).where(eq(session.userId, id));
    await db.delete(account).where(eq(account.userId, id));
    await db.delete(user).where(eq(user.id, id));

    return res.json({ ok: true, name: found.name });
  } catch (err) {
    console.error('[admin/staff DELETE] error:', err);
    return res.status(500).json({ error: 'Failed to delete user.', message: String(err) });
  }
}
