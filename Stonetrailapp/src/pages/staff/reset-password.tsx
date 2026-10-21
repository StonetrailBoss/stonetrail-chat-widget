import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from "react-router";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth/auth-client';
import { Helmet } from '@dr.pogodin/react-helmet';
export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [token]);
  const passwordStrength = (() => {
    if (password.length === 0) return null;
    if (password.length < 8) return {
      label: 'Too short',
      color: 'bg-red-400',
      width: 'w-1/4'
    };
    if (password.length < 12) return {
      label: 'Fair',
      color: 'bg-amber-400',
      width: 'w-2/4'
    };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return {
      label: 'Good',
      color: 'bg-blue-400',
      width: 'w-3/4'
    };
    return {
      label: 'Strong',
      color: 'bg-green-500',
      width: 'w-full'
    };
  })();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token
      });
      if ((result as any)?.error) {
        setError((result as any).error.message || 'Failed to reset password. The link may have expired.');
      } else {
        setSuccess(true);
        setTimeout(() => navigate('/staff/login'), 3000);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return <>
      <Helmet>
        <title>Reset Password — Stonetrail Villas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-[#1B2A4A] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-10">
            <div className="w-14 h-14 border border-[#C9A96E]/50 flex items-center justify-center mx-auto mb-5">
              <Lock size={22} className="text-[#C9A96E]" />
            </div>
            <h1 className="font-heading text-3xl text-white mb-1">New Password</h1>
            <p className="text-white/40 text-sm">Stonetrail Villas — Staff Portal</p>
          </div>

          {success ? <div className="bg-white p-8 text-center space-y-4">
              <CheckCircle size={40} className="text-green-500 mx-auto" />
              <div>
                <p className="text-[#1B2A4A] font-medium text-lg">Password updated</p>
                <p className="text-[#1B2A4A]/50 text-sm mt-1">Redirecting to sign in…</p>
              </div>
              <Link to="/staff/login" className="inline-block w-full py-3.5 bg-[#1B2A4A] text-white text-sm tracking-widest uppercase hover:bg-[#C9A96E] transition-colors">
                Sign In Now
              </Link>
            </div> : <form onSubmit={handleSubmit} className="bg-white p-8 space-y-5">
              {!token && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>Invalid or missing reset token. Please request a new reset link.</span>
                </div>}

              {error && <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>}

              {/* New password */}
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} disabled={!token} className="w-full border border-[#1B2A4A]/15 px-4 py-3 pr-10 text-sm text-[#1B2A4A] focus:outline-none focus:border-[#C9A96E] transition-colors disabled:opacity-50" placeholder="Minimum 8 characters" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2A4A]/30 hover:text-[#1B2A4A]/60" tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {passwordStrength && <div className="mt-2 space-y-1">
                    <div className="h-1 bg-[#1B2A4A]/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                    </div>
                    <p className="text-[10px] text-[#1B2A4A]/40">{passwordStrength.label}</p>
                  </div>}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)} disabled={!token} className="w-full border border-[#1B2A4A]/15 px-4 py-3 pr-10 text-sm text-[#1B2A4A] focus:outline-none focus:border-[#C9A96E] transition-colors disabled:opacity-50" placeholder="Re-enter password" autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1B2A4A]/30 hover:text-[#1B2A4A]/60" tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirm && password !== confirm && <p className="text-[10px] text-red-500 mt-1">Passwords do not match</p>}
                {confirm && password === confirm && confirm.length > 0 && <p className="text-[10px] text-green-600 mt-1">Passwords match</p>}
              </div>

              <button type="submit" disabled={loading || !token} className="w-full py-3.5 bg-[#1B2A4A] text-white text-sm tracking-widest uppercase font-medium hover:bg-[#C9A96E] transition-colors duration-200 disabled:opacity-60">
                {loading ? 'Updating…' : 'Set New Password'}
              </button>

              <div className="pt-1 text-center">
                <Link to="/staff/login" className="text-xs text-[#1B2A4A]/40 hover:text-[#C9A96E] transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </form>}
        </div>
      </div>
    </>;
}
