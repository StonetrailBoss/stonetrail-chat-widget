import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { staffRole, user } from '../../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);

    const [existing] = await db.select({ id: staffRole.id }).from(staffRole).where(eq(staffRole.id, id));
    if (!existing) return res.status(404).json({ error: 'Role not found.' });

    // Unassign this role from any users before deleting
    await db.update(user).set({ staffRoleId: null }).where(eq(user.staffRoleId, id));
    await db.delete(staffRole).where(eq(staffRole.id, id));

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete role.', message: String(err) });
  }
}
