/**
 * GET /api/me/permissions
 * Returns the current user's finance tab permissions.
 * - admin role → all tabs
 * - custom staffRoleId → tabs from that role
 * - staff with no role → no tabs
 */
import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { user, staffRole, FINANCE_TABS } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { toWebRequest } from '@/lib/auth/express-adapter';
import { getAuth } from '@/lib/auth/auth.js';

export default async function handler(req: Request, res: Response) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: toWebRequest(req).headers });
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

    const [u] = await db
      .select({ role: user.role, staffRoleId: user.staffRoleId })
      .from(user)
      .where(eq(user.id, session.user.id));

    if (!u) return res.status(404).json({ error: 'User not found' });

    // Admins get all tabs
    if (u.role === 'admin') {
      return res.json({ tabs: [...FINANCE_TABS], isAdmin: true });
    }

    // Staff with a custom role
    if (u.staffRoleId) {
      const [role] = await db
        .select({ tabPermissions: staffRole.tabPermissions })
        .from(staffRole)
        .where(eq(staffRole.id, u.staffRoleId));

      if (role) {
        return res.json({ tabs: role.tabPermissions ?? [], isAdmin: false });
      }
    }

    // Staff with no role — no access
    return res.json({ tabs: [], isAdmin: false });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch permissions', message: String(err) });
  }
}
