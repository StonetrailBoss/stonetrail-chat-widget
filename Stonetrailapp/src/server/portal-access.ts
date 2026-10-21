import type { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth';
import { toWebRequest } from '@/lib/auth/express-adapter';
import { db } from './db/client';
import { user, staffRole, type FinanceTab } from './db/schema';

// The exported project had UI route guards but no equivalent API middleware.
export async function portalAccess(req: Request, res: Response, next: NextFunction) {
  const path = req.path;
  const finance: [string, FinanceTab[]][] = [
    ['/api/timeclock', ['records','reports']],
    ['/api/employee-rates', ['rates']],
    ['/api/employee-deductions', ['rates','records']],
    ['/api/nis-rates', ['rates']],
    ['/api/payables', ['payables']],
    ['/api/uploads/receipts', ['payables']],
    ['/api/petty-cash', ['petty-cash']],
  ];
  const financeRule = finance.find(([prefix]) => path === prefix || path.startsWith(prefix + '/'));
  const adminOnly = path.startsWith('/api/admin/') ||
    path === '/api/auth/reset-password' || path === '/api/auth/reset-password/request' ||
    path === '/api/auth/sign-up/email' || path.startsWith('/api/reviews-agent');
  const staffOnly = path.startsWith('/api/inventory') || path.startsWith('/api/me/') ||
    path.startsWith('/api/uploads/') || path === '/api/chat';
  if (!adminOnly && !staffOnly && !financeRule) return next();
  try {
    const auth = await getAuth().api.getSession({ headers: toWebRequest(req).headers });
    if (!auth?.user) return res.status(401).json({ error: 'Staff sign-in required' });
    const [person] = await db.select().from(user).where(eq(user.id, auth.user.id));
    if (!person) return res.status(401).json({ error: 'Staff account not found' });
    if (person.role === 'admin') return next();
    if (adminOnly) return res.status(403).json({ error: 'Administrator access required' });
    if (financeRule) {
      const [role] = person.staffRoleId
        ? await db.select().from(staffRole).where(eq(staffRole.id, person.staffRoleId)) : [];
      if (!financeRule[1].some(tab => role?.tabPermissions?.includes(tab)))
        return res.status(403).json({ error: 'Finance permission required' });
      // Reports permission grants read-only access.
      if (req.method !== 'GET' && !role?.tabPermissions?.includes(financeRule[1][0]))
        return res.status(403).json({ error: 'Write permission required' });
    }
    return next();
  } catch {
    return res.status(503).json({ error: 'Staff authentication unavailable' });
  }
}
