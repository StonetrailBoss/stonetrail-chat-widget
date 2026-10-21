import { useState } from 'react';
import { useNavigate, useLocation, Link } from "react-router";
import { signIn } from '@/lib/auth/auth-client';
import { Helmet } from '@dr.pogodin/react-helmet';
export default function StaffLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {
    from?: {
      pathname: string;
    };
  })?.from?.pathname || '/staff/inventory';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: from
      });
      if (result.error) {
        setError(result.error.message || 'Invalid credentials. Please try again.');
      } else {
        navigate(from, {
          replace: true
        });
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return <>
      <Helmet>
        <title>Staff Login — Stonetrail Villas</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-[#1B2A4A] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Logo / Brand */}
          <div className="text-center mb-10">
            <img src="/assets/NLogoW.png" alt="Stonetrail Villas" className="h-28 w-auto mx-auto mb-6 object-contain" />
            <h1 className="font-heading text-3xl text-white mb-1">Staff Portal</h1>
            <p className="text-white/40 text-sm">Stonetrail Villas — Internal Access</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 space-y-5">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
                {error}
              </div>}
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">
                Email Address
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-[#1B2A4A]/15 px-4 py-3 text-sm text-[#1B2A4A] focus:outline-none focus:border-[#C9A96E] transition-colors" placeholder="staff@stonetrailsvg.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-[10px] tracking-widest uppercase text-[#1B2A4A]/50 mb-2">
                Password
              </label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-[#1B2A4A]/15 px-4 py-3 text-sm text-[#1B2A4A] focus:outline-none focus:border-[#C9A96E] transition-colors" placeholder="••••••••" autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1B2A4A] text-white text-sm tracking-widest uppercase font-medium hover:bg-[#C9A96E] transition-colors duration-200 disabled:opacity-60">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="text-center pt-1">
              <Link to="/staff/forgot-password" className="text-xs text-[#1B2A4A]/40 hover:text-[#C9A96E] transition-colors">
                Forgot password?
              </Link>
            </div>
          </form>

          <p className="text-center text-white/25 text-xs mt-6">
            This portal is for authorised Stonetrail Villas staff only.
          </p>
        </div>
      </div>
    </>;
}
