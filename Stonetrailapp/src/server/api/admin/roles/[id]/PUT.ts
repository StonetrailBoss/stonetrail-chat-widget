import type { Request, Response } from 'express';
import { db } from '../../../../db/client.js';
import { staffRole, FINANCE_TABS } from '../../../../db/schema.js';
import { eq, and, ne } from 'drizzle-orm';
import type { FinanceTab } from '../../../../db/schema.js';

export default async function handler(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const { name, description, tabPermissions } = req.body as {
      name?: string;
      description?: string;
      tabPermissions?: string[];
    };

    const [existing] = await db.select({ id: staffRole.id }).from(staffRole).where(eq(staffRole.id, id));
    if (!existing) return res.status(404).json({ error: 'Role not found.' });

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Role name cannot be empty.' });
      const [dup] = await db.select({ id: staffRole.id }).from(staffRole).where(
        and(eq(staffRole.name, name.trim()), ne(staffRole.id, id))
      );
      if (dup) return res.status(409).json({ error: 'A role with that name already exists.' });
    }

    const validTabs = tabPermissions !== undefined
      ? (tabPermissions.filter(t => (FINANCE_TABS as readonly string[]).includes(t)) as FinanceTab[])
      : undefined;

    await db.update(staffRole).set({
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(validTabs !== undefined ? { tabPermissions: validTabs } : {}),
    }).where(eq(staffRole.id, id));

    const [updated] = await db.select().from(staffRole).where(eq(staffRole.id, id));
    return res.json({ ok: true, role: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update role.', message: String(err) });
  }
}
