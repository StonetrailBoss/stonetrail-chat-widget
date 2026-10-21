import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { user } from '../../../db/schema.js';
import { asc } from 'drizzle-orm';

export default async function handler(_req: Request, res: Response) {
  try {
    const staff = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffRoleId: user.staffRoleId,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(asc(user.name));

    res.json({ staff });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff', message: String(err) });
  }
}
