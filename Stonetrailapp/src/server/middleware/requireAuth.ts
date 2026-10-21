/**
 * requireAuth — Express middleware that enforces authentication.
 *
 * Validates the BetterAuth session from the incoming request cookies/headers
 * and rejects with 401 if the user is not authenticated.
 * Any role (staff or admin) is accepted — use requireAdmin for admin-only routes.
 *
 * Usage:
 *   import { requireAuth } from '../middleware/requireAuth.js';
 *   app.get('/api/inventory', requireAuth, handler);
 */
import type { Request, Response, NextFunction } from 'express';
import { getAuth } from '../../lib/auth/auth.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth();

    const session = await auth.api.getSession({ headers: req.headers as unknown as Headers });

    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
      return;
    }

    // Attach user to request for downstream handlers if needed
    (req as Request & { authUser: typeof session.user }).authUser = session.user;

    next();
  } catch (err) {
    console.error('requireAuth.error', err instanceof Error ? err.message : String(err));
    res.status(500).json({ error: 'Internal server error', message: 'Session validation failed.' });
  }
}
