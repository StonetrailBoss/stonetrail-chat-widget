import { useSession } from '@/lib/auth/auth-client';
import { useNavigate } from "react-router";
import { useEffect } from 'react';
import StaffHeader from '@/components/StaffHeader';
import StaffManagementPanel from '@/components/staff/StaffManagementPanel';
export default function StaffAccessPage() {
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
    return <div className="min-h-screen bg-[#0D1B17] flex items-center justify-center">
        <div className="text-white/50">Loading…</div>
      </div>;
  }
  return <div className="min-h-screen bg-[#0D1B17] text-white">
      <StaffHeader userName={user?.name || user?.email} userRole={user?.role} />
      <main className="w-full px-6 pt-[96px] pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Staff Access</h1>
          <p className="text-white/40 text-sm mt-1">Manage custom roles and staff accounts</p>
        </div>
        <StaffManagementPanel />
      </main>
    </div>;
}
