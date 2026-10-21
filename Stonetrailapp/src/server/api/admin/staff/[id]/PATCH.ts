import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { user, staffRole } from '../../../../db/schema.js';
import { eq, and, ne } from 'drizzle-orm';

const VALID_ROLES = ['staff', 'admin'] as const;
type Role = typeof VALID_ROLES[number];

export default async function handler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const { role, name, email, staffRoleId } = req.body as {
      role?: string;
      name?: string;
      email?: string;
      staffRoleId?: string | null;
    };

    const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.id, id));
    if (!existing) return res.status(404).json({ error: 'User not found.' });

    let hasUpdate = false;

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role as Role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
      }
      const currentUserId = (req as any).user?.id;
      if (currentUserId && currentUserId === id && role !== 'admin') {
        return res.status(400).json({ error: 'You cannot change your own role.' });
      }
      hasUpdate = true;
    }

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Name cannot be empty.' });
      hasUpdate = true;
    }

    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail) return res.status(400).json({ error: 'Email cannot be empty.' });
      const [dup] = await db.select({ id: user.id }).from(user).where(
        and(eq(user.email, normalizedEmail), ne(user.id, id))
      );
      if (dup) return res.status(409).json({ error: 'That email is already in use.' });
      hasUpdate = true;
    }

    if (staffRoleId !== undefined) {
      // Validate the role exists (unless clearing it)
      if (staffRoleId !== null) {
        const [sr] = await db.select({ id: staffRole.id }).from(staffRole).where(eq(staffRole.id, staffRoleId));
        if (!sr) return res.status(400).json({ error: 'Staff role not found.' });
      }
      hasUpdate = true;
    }

    if (!hasUpdate) return res.status(400).json({ error: 'No valid fields to update.' });

    await db.update(user).set({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(email !== undefined ? { email: email.toLowerCase().trim() } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(staffRoleId !== undefined ? { staffRoleId: staffRoleId ?? null } : {}),
    }).where(eq(user.id, id));

    const [updated] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, staffRoleId: user.staffRoleId, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, id));

    return res.json({ ok: true, user: updated });
  } catch (err) {
    console.error('[admin/staff PATCH] error:', err);
    return res.status(500).json({ error: 'Failed to update user.', message: String(err) });
  }
}
