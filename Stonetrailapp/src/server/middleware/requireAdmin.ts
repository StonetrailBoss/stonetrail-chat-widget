/**
 * requireAdmin — Express middleware that enforces admin-only access.
 *
 * Validates the BetterAuth session from the incoming request cookies/headers
 * and rejects with 401/403 if the user is not authenticated or not an admin.
 *
 * Usage:
 *   import { requireAdmin } from '../middleware/requireAdmin.js';
 *   app.get('/api/timeclock', requireAdmin, handler);
 */
import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '../../lib/auth/auth.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth();

    // BetterAuth's api.getSession() validates the session token from cookies/headers.
    const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    const role = (session.user as { role?: string }).role;
    if (role !== 'admin') {
      res.status(403).json({ error: 'Forbidden', message: 'Admin access required.' });
      return;
    }

    // Attach user to request for downstream handlers if needed
    (req as Request & { adminUser: typeof session.user }).adminUser = session.user;

    next();
  } catch (err) {
    console.error('requireAdmin.error', err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: 'Internal server error', message: 'Session validation failed.' });
  }
}
