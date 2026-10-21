import { useSession } from '@/lib/auth/auth-client';
import { useNavigate } from "react-router";
import { useEffect } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import StaffHeader from '@/components/StaffHeader';
import PromoVideoManager from '@/components/PromoVideoManager';
export default function WebsiteManagementPage() {
  const {
    session,
    user: sessionUser,
    isPending
  } = useSession();
  const navigate = useNavigate();
  const user = sessionUser as {
    name?: string;
    email?: string;
    role?: string;
  } | undefined;
  useEffect(() => {
    if (!isPending && (!session || user?.role !== 'admin')) {
      navigate('/staff/login');
    }
  }, [isPending, session, user, navigate]);
  if (isPending) {
    return <div className="min-h-screen bg-[#1A2E28] flex items-center justify-center">
        <div className="text-white/50">Loading…</div>
      </div>;
  }
  return <div className="min-h-screen bg-[#1A2E28] text-white">
      <Helmet>
        <title>Website Management — Stonetrail Villas Staff</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <StaffHeader userName={user?.name || user?.email} userRole={user?.role} />
      <main className="w-full px-6 pt-[96px] pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Website Management</h1>
          <p className="text-white/40 text-sm mt-1">Manage website content and promotional media</p>
        </div>
        <PromoVideoManager />
      </main>
    </div>;
}
