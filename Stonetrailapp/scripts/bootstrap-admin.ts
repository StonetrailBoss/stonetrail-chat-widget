import { getAuth } from '../src/lib/auth/auth';
import { db, closeConnection } from '../src/server/db/client';
import { user } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12) throw Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)');
try {
  const existing = await db.select().from(user).limit(1);
  if (existing.length) throw Error('Bootstrap requires an empty user table; manage existing accounts through staff administration');
  const result = await getAuth().api.signUpEmail({ body: { email, password, name: process.env.ADMIN_NAME || 'Administrator' } });
  await db.update(user).set({role:'admin'}).where(eq(user.id,result.user.id));
  console.log('Administrator created. Remove ADMIN_PASSWORD from the environment.');
} finally { await closeConnection(); }
