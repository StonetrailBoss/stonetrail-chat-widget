/**
 * Seed script: creates the first staff/admin account.
 * Run with: npx tsx src/server/seed-admin.ts
 */
import { db } from './db/client.js';
import { user } from './db/schema.js';
import { eq } from 'drizzle-orm';

// ── Config — change these before running ─────────────────────────────────────
const ADMIN_NAME = 'Admin';
const ADMIN_EMAIL = 'admin@stonetrailvillas.com';
const ADMIN_PASSWORD = 'StonetrailAdmin2024!';
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding first staff account...');

  // Check if user already exists
  const existing = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL));
  if (existing.length > 0) {
    console.log(`✅ User ${ADMIN_EMAIL} already exists — skipping.`);
    process.exit(0);
  }

  // Use BetterAuth's sign-up API endpoint to create the account properly
  // (this ensures the password is hashed with BetterAuth's scrypt algorithm)
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:20010';
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': baseUrl,
    },
    body: JSON.stringify({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('❌ Failed to create account:', res.status, text);
    process.exit(1);
  }

  // Set role to 'admin'
  await db.update(user).set({ role: 'admin' }).where(eq(user.email, ADMIN_EMAIL));

  console.log('✅ Staff account created successfully!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Role:     admin`);
  console.log('');
  console.log('⚠️  Please change the password after first login.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
