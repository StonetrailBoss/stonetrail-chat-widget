import type { Request, Response } from 'express';
import { getAuth } from '@/lib/auth/auth.js';
import { db } from '../../../db/client.js';
import { user, staffRole } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function handler(req: Request, res: Response) {
  try {
    const { name, email, password, role, staffRoleId } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      staffRoleId?: string | null;
    };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = role === 'admin' ? 'admin' : 'staff';

    // Validate staffRoleId if provided
    if (staffRoleId && assignedRole === 'staff') {
      const [sr] = await db.select({ id: staffRole.id }).from(staffRole).where(eq(staffRole.id, staffRoleId));
      if (!sr) return res.status(400).json({ error: 'Staff role not found.' });
    }

    // Check for duplicate email
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, normalizedEmail));

    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    // Use BetterAuth to create the user so the password is hashed correctly
    const auth = getAuth();
    const origin = process.env.BETTER_AUTH_URL || 'https://stonetrailvillas.com';
    const port = process.env.PORT ?? '3000';

    const authRes = await auth.handler(
      new Request(`http://127.0.0.1:${port}/api/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      })
    );

    if (!authRes.ok) {
      const body = await authRes.text().catch(() => '');
      console.error('[admin/staff POST] BetterAuth sign-up failed:', authRes.status, body);
      return res.status(500).json({ error: 'Failed to create account.' });
    }

    // Set role and staffRoleId
    const updatePayload: Record<string, unknown> = {};
    if (assignedRole !== 'staff') updatePayload.role = assignedRole;
    if (staffRoleId && assignedRole === 'staff') updatePayload.staffRoleId = staffRoleId;

    if (Object.keys(updatePayload).length > 0) {
      await db.update(user).set(updatePayload).where(eq(user.email, normalizedEmail));
    }

    // Return the created user
    const [created] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, staffRoleId: user.staffRoleId, createdAt: user.createdAt })
      .from(user)
      .where(eq(user.email, normalizedEmail));

    return res.status(201).json({ ok: true, user: created });
  } catch (err) {
    console.error('[admin/staff POST] error:', err);
    return res.status(500).json({ error: 'Failed to create user.', message: String(err) });
  }
}
