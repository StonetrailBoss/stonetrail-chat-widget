import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { staffRole, FINANCE_TABS } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { FinanceTab } from '../../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    const { name, description, tabPermissions } = req.body as {
      name?: string;
      description?: string;
      tabPermissions?: string[];
    };

    if (!name?.trim()) return res.status(400).json({ error: 'Role name is required.' });

    // Validate tab keys
    const validTabs = (tabPermissions ?? []).filter(t =>
      (FINANCE_TABS as readonly string[]).includes(t)
    ) as FinanceTab[];

    const id = randomUUID();
    await db.insert(staffRole).values({
      id,
      name: name.trim(),
      description: description?.trim() || null,
      tabPermissions: validTabs,
    });

    const [created] = await db.select().from(staffRole).where(eq(staffRole.id, id));
    return res.status(201).json({ ok: true, role: created });
  } catch (err: unknown) {
    const msg = String(err);
    if (msg.includes('Duplicate entry') || msg.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A role with that name already exists.' });
    }
    return res.status(500).json({ error: 'Failed to create role.', message: msg });
  }
}
