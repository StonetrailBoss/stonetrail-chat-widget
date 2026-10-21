import { useState } from 'react';
import { Link } from "react-router";
import { Lock, ArrowLeft, Copy, Check } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    name: string;
    email: string;
    resetUrl: string | null;
    emailSent: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate reset link.');
      } else {
        setResult(data);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  async function handleCopy() {
    if (!result?.resetUrl) return;
    await navigator.clipboard.writeText(result.resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return <>
      <Helmet>
        <title>Forgot Password — Stonetrail Villas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-[#1B2A4A] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 border border-[#C9A96E]/50 flex items-center justify-center mx-auto mb-5">
              <Lock size={22} className="text-[#C9A96E]" />
            </div>
            <h1 className="font-heading text-3xl text-white mb-1">Reset Password</h1>
            <p className="text-white/40 text-sm">Stonetrail Villas — Staff Portal</p>
          </div>

          {!result ? <form onSubmit={handleSubmit} className="bg-white p-8 space-y-5">
              <p className="text-[#1B2A4A]/60 text-sm leading-relaxed">
                Enter the staff member's email address. A password reset link will be sent to them directly.
              </p>

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  {error}
                </div>}

              <div>
                <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">
                  Email Address
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#1B2A4A]/15 px-4 py-3 text-sm text-[#1B2A4A] focus:outline-none focus:border-[#C9A96E] transition-colors" placeholder="staff@stonetrailsvg.com" autoComplete="email" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1B2A4A] text-white text-sm tracking-widest uppercase font-medium hover:bg-[#C9A96E] transition-colors duration-200 disabled:opacity-60">
                {loading ? 'Generating…' : 'Generate Reset Link'}
              </button>

              <div className="pt-1 text-center">
                <Link to="/staff/login" className="inline-flex items-center gap-1.5 text-xs text-[#1B2A4A]/40 hover:text-[#C9A96E] transition-colors">
                  <ArrowLeft size={12} />
                  Back to Sign In
                </Link>
              </div>
            </form> : <div className="bg-white p-8 space-y-5">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 px-4 py-3">
                <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-green-800 text-sm font-medium">
                    {result.emailSent ? 'Reset email sent' : 'Reset link generated'}
                  </p>
                  <p className="text-green-700 text-xs mt-0.5">For {result.name} ({result.email})</p>
                </div>
              </div>

              {result.emailSent ? <p className="text-[#1B2A4A]/60 text-sm leading-relaxed">
                  A password reset link has been emailed to <strong>{result.email}</strong>. The link expires in 1 hour.
                </p> : null}

              {/* Show manual URL if email failed or as a fallback */}
              {result.resetUrl && !result.emailSent && <div className="space-y-2">
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2.5">
                    <span className="shrink-0 font-medium">Email delivery failed.</span>
                    <span>Copy and send this link to the staff member manually.</span>
                  </div>
                  <div className="flex items-stretch gap-2">
                    <input readOnly value={result.resetUrl} className="flex-1 border border-[#1B2A4A]/15 px-3 py-2.5 text-xs text-[#1B2A4A] bg-[#1B2A4A]/5 font-mono truncate focus:outline-none" />
                    <button onClick={handleCopy} className="px-3 border border-[#1B2A4A]/15 hover:bg-[#1B2A4A]/5 transition-colors text-[#1B2A4A]/60 hover:text-[#1B2A4A]" title="Copy link">
                      {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[#1B2A4A]/40 text-xs">This link expires in 1 hour.</p>
                </div>}

              <div className="flex gap-3 pt-1">
                <button onClick={() => {
              setResult(null);
              setEmail('');
            }} className="flex-1 py-3 border border-[#1B2A4A]/20 text-[#1B2A4A] text-sm tracking-widest uppercase hover:bg-[#1B2A4A]/5 transition-colors">
                  New Request
                </button>
                <Link to="/staff/login" className="flex-1 py-3 bg-[#1B2A4A] text-white text-sm tracking-widest uppercase text-center hover:bg-[#C9A96E] transition-colors">
                  Back to Login
                </Link>
              </div>
            </div>}
        </div>
      </div>
    </>;
}
