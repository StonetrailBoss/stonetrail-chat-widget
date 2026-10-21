import { db } from './db/client.js';
import { user } from './db/schema.js';
import { eq } from 'drizzle-orm';

const accounts = [
  { name: 'Ayessa', email: 'ayessa@stonetrailvillas.com', password: 'B@ll0ntyne' },
  { name: 'Oona',   email: 'oonahaynes5@gmail.com',      password: 'stonetr@1l' },
];

const baseUrl = 'http://localhost:20010';

async function seed() {
  for (const acct of accounts) {
    const existing = await db.select().from(user).where(eq(user.email, acct.email));
    if (existing.length > 0) {
      console.log(`⚠️  ${acct.email} already exists — skipping.`);
      continue;
    }
    const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': baseUrl },
      body: JSON.stringify({ name: acct.name, email: acct.email, password: acct.password }),
    });
    if (!res.ok) {
      console.error(`❌ Failed to create ${acct.email}:`, await res.text());
    } else {
      await db.update(user).set({ role: 'staff' }).where(eq(user.email, acct.email));
      console.log(`✅ Created: ${acct.email} (role: staff)`);
    }
  }
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
