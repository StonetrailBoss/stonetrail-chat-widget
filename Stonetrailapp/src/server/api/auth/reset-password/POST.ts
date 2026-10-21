/**
 * POST /api/auth/reset-password/request
 *
 * Generates a BetterAuth password-reset token and emails the reset link
 * directly to the staff member via the local SMTP relay.
 *
 * Protected: admin only (enforced in entry.ts).
 */
import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { getSecret } from '#airo/secrets';
import { db, pool } from '../../../db/client.js';
import { user } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth/auth.js';

// Transport is created lazily per-request so getSecret() runs after
// secrets are injected at runtime (not at module load time).
function createTransport() {
  const smtpPort = parseInt(String(getSecret('SMTP_PORT') ?? '587'), 10);
  const host: string = String(getSecret('SMTP_HOST') ?? 'localhost');
  const user: string = String(getSecret('SMTP_USER') ?? '');
  const pass: string = String(getSecret('SMTP_PASS') ?? '');
  return nodemailer.createTransport({
    host,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user, pass },
  } as nodemailer.TransportOptions);
}

export default async function handler(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string };
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify user exists
    const [found] = await db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(eq(user.email, normalizedEmail));

    if (!found) {
      return res.status(404).json({ error: 'No account found with that email address.' });
    }

    // Always use the hardcoded production origin — req.protocol returns 'http'
    // behind the reverse proxy and req.get('host') returns the internal host.
    const auth = getAuth();
    const origin = process.env.BETTER_AUTH_URL || 'https://stonetrailvillas.com';
    const redirectTo = `${origin}/staff/reset-password`;

    // Call BetterAuth handler directly using localhost — this is a local function
    // call, not an outbound HTTP request, so the URL just needs to match the
    // path BetterAuth expects. The origin header must match BETTER_AUTH_URL.
    const port = process.env.PORT ?? '3000';
    const internalReq = new Request(`http://127.0.0.1:${port}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', origin },
      body: JSON.stringify({ email: normalizedEmail, redirectTo }),
    });

    const authRes = await auth.handler(internalReq);
    if (!authRes.ok) {
      const body = await authRes.text().catch(() => '');
      console.error('[reset-password/request] BetterAuth rejected request:', authRes.status, body);
    }

    // BetterAuth stores: identifier = `reset-password:{token}`, value = userId
    // We need the token (not the email) — query for the most recent entry for this user
    const conn = pool;
    const { rows } = await conn.query(
      `SELECT identifier, expires_at FROM verification
       WHERE identifier LIKE 'reset-password:%'
       AND value = $1
       ORDER BY expires_at DESC LIMIT 1`,
      [found.id]
    );

    const tokenRow = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    // identifier is "reset-password:{token}" — extract the token part
    const token = tokenRow?.identifier
      ? String(tokenRow.identifier).replace('reset-password:', '')
      : null;

    // Build the URL via BetterAuth's callback redirect path:
    // GET /api/auth/reset-password/{token}?callbackURL=... → redirects to callbackURL?token={token}
    // We skip the redirect and build the final URL directly since we know the token.
    const resetUrl = token
      ? `${origin}/staff/reset-password?token=${encodeURIComponent(token)}`
      : null;

    // Send the reset link by email
    let emailSent = false;
    if (resetUrl) {
      try {
        const transport = createTransport();
        await transport.sendMail({
          from: String(getSecret('SMTP_FROM') ?? 'noreply@stonetrailvillas.com'),
          to: normalizedEmail,
          subject: 'Stonetrail Villas — Password Reset',
          text: [
            `Hi ${found.name},`,
            '',
            'A password reset was requested for your Stonetrail Villas staff account.',
            '',
            'Click the link below to set a new password (expires in 1 hour):',
            '',
            resetUrl,
            '',
            'If you did not request this, you can safely ignore this email.',
            '',
            '— Stonetrail Villas',
          ].join('\n'),
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;color:#1B2A4A">
              <div style="background:#1B2A4A;padding:24px 32px;text-align:center">
                <span style="color:#C9A96E;font-size:18px;font-weight:600;letter-spacing:2px">STONETRAIL VILLAS</span>
              </div>
              <div style="padding:32px;border:1px solid #e5e7eb;border-top:none">
                <p style="margin:0 0 16px">Hi ${found.name},</p>
                <p style="margin:0 0 16px;color:#4b5563">
                  A password reset was requested for your staff account. Click the button below to set a new password.
                  This link expires in <strong>1 hour</strong>.
                </p>
                <div style="text-align:center;margin:32px 0">
                  <a href="${resetUrl}"
                     style="background:#1B2A4A;color:#fff;text-decoration:none;padding:14px 32px;font-size:13px;letter-spacing:2px;text-transform:uppercase;display:inline-block">
                    Reset Password
                  </a>
                </div>
                <p style="margin:0;font-size:12px;color:#9ca3af">
                  If you did not request this, you can safely ignore this email.<br>
                  Or copy this link: <a href="${resetUrl}" style="color:#C9A96E">${resetUrl}</a>
                </p>
              </div>
              <div style="padding:16px 32px;text-align:center">
                <p style="margin:0;font-size:11px;color:#9ca3af">Stonetrail Villas — Staff Portal</p>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error('[reset-password/request] email send failed:', emailErr);
        // Fall through — still return the reset URL so admin can relay manually
      }
    }

    return res.json({
      ok: true,
      name: found.name,
      email: normalizedEmail,
      emailSent,
      // Always return the URL as a fallback in case email delivery fails
      resetUrl,
      message: emailSent
        ? `Reset link sent to ${normalizedEmail}.`
        : resetUrl
          ? 'Email delivery failed. Copy and send this link to the staff member manually.'
          : 'Reset request submitted but no token was generated.',
    });
  } catch (err) {
    console.error('[reset-password/request] error:', err);
    return res.status(500).json({ error: 'Failed to generate reset link.', message: String(err) });
  }
}
