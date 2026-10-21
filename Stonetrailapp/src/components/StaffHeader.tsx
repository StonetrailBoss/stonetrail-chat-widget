import { useState, useEffect } from 'react';
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth/auth-client';
interface StaffHeaderProps {
  userName?: string | null;
  userRole?: string | null;
}
export default function StaffHeader({
  userName,
  userRole
}: StaffHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  async function handleSignOut() {
    await signOut();
    window.location.href = '/staff/login';
  }
  const isFinance = location.pathname === '/staff/timeclock';
  const isInventory = location.pathname === '/staff/inventory';
  const isStaffAccess = location.pathname === '/staff/access';
  const isWebsite = location.pathname === '/staff/website';
  return <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#1A2E28]/97 backdrop-blur-md shadow-sm' : 'bg-[#1A2E28]'}`}>
      <div className="w-full px-6 lg:px-10">
        <div className="flex items-center justify-between h-[80px]">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 z-10 flex items-center gap-2">
            <img src="/assets/NLogoW.png" alt="Stonetrail Villas" className="h-12 w-auto object-contain" />
            <span style={{
            fontFamily: "'Outfit', sans-serif"
          }} className="text-white text-base lg:text-lg leading-tight tracking-[0.08em] font-medium">
              Stonetrail Villas
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {userRole === 'admin' && <Link to="/staff/timeclock" className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${isFinance ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                Finance
              </Link>}
            <Link to="/staff/inventory" className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${isInventory ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
              Inventory
            </Link>
            {userRole === 'admin' && <Link to="/staff/access" className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${isStaffAccess ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                Staff Access
              </Link>}
            {userRole === 'admin' && <Link to="/staff/website" className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${isWebsite ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                Website
              </Link>}
          </nav>

          {/* Right — user info + sign out */}
          <div className="hidden lg:flex items-center gap-5 z-10">
            {userName && <span className="text-[11px] tracking-[0.1em] text-white/40 font-light">{userName}</span>}
            {userRole && <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-medium tracking-wide border ${userRole === 'admin' ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-white/8 text-white/45 border-white/10'}`}>
                {userRole === 'admin' ? 'Admin' : 'Staff'}
              </span>}
            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-5 py-2 text-[10px] tracking-[0.2em] uppercase font-light border border-white/25 text-white/60 hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden p-2 text-white/70 hover:text-white transition-colors z-10" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} transition={{
        duration: 0.3,
        ease: 'easeInOut' as const
      }} className="lg:hidden bg-[#1A2E28] border-t border-white/8 overflow-hidden">
            <nav className="flex flex-col px-6 py-6 gap-0">
              {userRole === 'admin' && <Link to="/staff/timeclock" className={`text-[10px] tracking-[0.28em] uppercase font-medium py-4 border-b border-white/6 transition-colors duration-300 ${isFinance ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                  Finance
                </Link>}
              <Link to="/staff/inventory" className={`text-[10px] tracking-[0.28em] uppercase font-medium py-4 border-b border-white/6 transition-colors duration-300 ${isInventory ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                Inventory
              </Link>
              {userRole === 'admin' && <Link to="/staff/access" className={`text-[10px] tracking-[0.28em] uppercase font-medium py-4 border-b border-white/6 transition-colors duration-300 ${isStaffAccess ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                  Staff Access
                </Link>}
              {userRole === 'admin' && <Link to="/staff/website" className={`text-[10px] tracking-[0.28em] uppercase font-medium py-4 border-b border-white/6 transition-colors duration-300 ${isWebsite ? 'text-[#C8B89A]' : 'text-white/55 hover:text-white'}`}>
                  Website
                </Link>}
              <div className="pt-6 flex flex-col gap-4">
                {userName && <span className="text-[10px] tracking-[0.1em] text-white/35 font-light">{userName}</span>}
                <button onClick={handleSignOut} className="inline-flex w-fit items-center gap-2 px-6 py-3 text-[10px] tracking-[0.25em] uppercase font-light border border-white/25 text-white/60 hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </nav>
          </motion.div>}
      </AnimatePresence>
    </header>;
}
