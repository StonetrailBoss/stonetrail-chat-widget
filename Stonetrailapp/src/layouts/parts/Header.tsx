import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown } from 'lucide-react';

// ── Careers sub-items ──────────────────────────────────────────────────────────
const careersLinks = [
  { label: 'Our Workplace', href: '/company/careers/our-workplace' },
  { label: 'Message from the CEO', href: '/company/careers/message-from-ceo' },
  { label: 'Career Opportunities', href: '/company/careers/opportunities' },
];

// ── Company dropdown items (Careers first, then flat links) ───────────────────
const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

// ── Destination sub-items ──────────────────────────────────────────────────────
const destinationLinks = [
  { label: 'Main Land St. Vincent', href: '/destination' },
  { label: 'The Grenadines', href: '/destination/grenadines' },
  { label: 'Journal', href: '/blog' },
];

// ── Top-level nav ──────────────────────────────────────────────────────────────
const navLinks = [
  { label: 'Accommodations', href: '/rooms' },
];

// Paths that belong to the Company group (for active-state detection)
const companyPaths = [
  '/about',
  '/contact',
  '/company/careers',
  '/company/careers/our-workplace',
  '/company/careers/message-from-ceo',
  '/company/careers/opportunities',
];

// Paths that belong to the Destination group
const destinationPaths = ['/destination', '/destination/grenadines', '/blog'];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [careersOpen, setCareersOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);
  // Mobile accordion state
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(false);
  const [mobileCareersOpen, setMobileCareersOpen] = useState(false);
  const [mobileDestinationOpen, setMobileDestinationOpen] = useState(false);

  const companyRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setCompanyOpen(false);
    setCareersOpen(false);
    setDestinationOpen(false);
  }, [location.pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) {
        setCompanyOpen(false);
        setCareersOpen(false);
      }
      if (destinationRef.current && !destinationRef.current.contains(e.target as Node)) {
        setDestinationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHome = location.pathname === '/';
  const isCompanyActive = companyPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));
  const isDestinationActive = destinationPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-secondary/97 backdrop-blur-md shadow-sm' : isHome ? 'bg-transparent' : 'bg-secondary'}`}>
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-[72px] sm:h-[100px] lg:h-[140px]">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 z-10 flex items-center">
            <img src="/assets/LogoW.png" alt="Stonetrail Villas" className="h-[56px] sm:h-[80px] lg:h-[125px] w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-10 absolute left-[40%] -translate-x-1/2" aria-label="Main navigation">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`relative text-[10px] tracking-[0.28em] uppercase font-medium transition-colors duration-300 group ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/65 hover:text-primary-foreground'}`}
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-accent/60" />
                )}
              </Link>
            ))}

            {/* Destination dropdown */}
            <div ref={destinationRef} className="relative">
              <button
                onClick={() => setDestinationOpen(!destinationOpen)}
                className={`flex items-center gap-1 text-[10px] tracking-[0.28em] uppercase font-medium transition-colors duration-300 ${isDestinationActive ? 'text-accent' : 'text-primary-foreground/65 hover:text-primary-foreground'}`}
                aria-expanded={destinationOpen}
                aria-haspopup="true"
              >
                Destination
                <ChevronDown size={12} className={`transition-transform duration-200 ${destinationOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDestinationActive && !destinationOpen && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-accent/60" />
              )}

              <AnimatePresence>
                {destinationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' as const }}
                    className="absolute top-full left-0 mt-4 w-52 bg-secondary border border-primary-foreground/10 shadow-lg py-2"
                    role="menu"
                  >
                    {destinationLinks.map(link => (
                      <Link
                        key={link.href}
                        to={link.href}
                        role="menuitem"
                        className={`block px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5'}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Company dropdown */}
            <div ref={companyRef} className="relative">
              <button
                onClick={() => { setCompanyOpen(!companyOpen); setCareersOpen(false); }}
                className={`flex items-center gap-1 text-[10px] tracking-[0.28em] uppercase font-medium transition-colors duration-300 ${isCompanyActive ? 'text-accent' : 'text-primary-foreground/65 hover:text-primary-foreground'}`}
                aria-expanded={companyOpen}
                aria-haspopup="true"
              >
                Company
                <ChevronDown size={12} className={`transition-transform duration-200 ${companyOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCompanyActive && !companyOpen && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-accent/60" />
              )}

              <AnimatePresence>
                {companyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18, ease: 'easeOut' as const }}
                    className="absolute top-full left-0 mt-4 w-52 bg-secondary border border-primary-foreground/10 shadow-lg py-2"
                    role="menu"
                  >
                    {/* Careers sub-menu trigger — first position */}
                    <div className="relative">
                      <button
                        onMouseEnter={() => setCareersOpen(true)}
                        onMouseLeave={() => setCareersOpen(false)}
                        onClick={() => setCareersOpen(!careersOpen)}
                        className={`w-full flex items-center justify-between px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${location.pathname.startsWith('/company/careers') ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5'}`}
                        aria-expanded={careersOpen}
                        aria-haspopup="true"
                      >
                        Careers
                        <ChevronDown size={11} className="rotate-[-90deg] opacity-50" />
                      </button>

                      <AnimatePresence>
                        {careersOpen && (
                          <motion.div
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15, ease: 'easeOut' as const }}
                            onMouseEnter={() => setCareersOpen(true)}
                            onMouseLeave={() => setCareersOpen(false)}
                            className="absolute top-0 right-full mr-1 w-56 bg-secondary border border-primary-foreground/10 shadow-lg py-2"
                            role="menu"
                          >
                            <Link
                              to="/company/careers"
                              role="menuitem"
                              className={`block px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 border-b border-primary-foreground/8 mb-1 ${location.pathname === '/company/careers' ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5'}`}
                            >
                              Careers Overview
                            </Link>
                            {careersLinks.map(link => (
                              <Link
                                key={link.href}
                                to={link.href}
                                role="menuitem"
                                className={`block px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5'}`}
                              >
                                {link.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Flat links — About Us and Contact */}
                    {companyLinks.map(link => (
                      <Link
                        key={link.href}
                        to={link.href}
                        role="menuitem"
                        className={`block px-5 py-3 text-[10px] tracking-[0.2em] uppercase font-medium transition-colors duration-200 ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/5'}`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Right — phone + Book Now + Staff Portal */}
          <div className="hidden lg:flex items-center gap-7 z-10">
            <a href="tel:+17844581000" className="text-[10px] tracking-[0.18em] text-primary-foreground/40 hover:text-primary-foreground/70 transition-colors duration-300 font-light">
              +1 (784) 458-1000
            </a>
            <Link to="/book" className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary-foreground transition-all duration-300">
              Book Now
            </Link>
            <Link to="/staff/login" className="px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase font-light border border-primary-foreground/40 text-primary-foreground/70 hover:border-accent hover:text-accent transition-all duration-300">
              Staff Portal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-3 -mr-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors z-10 touch-manipulation"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="lg:hidden bg-secondary border-t border-primary-foreground/8 overflow-hidden"
          >
            <nav className="flex flex-col px-6 py-6 gap-0" aria-label="Mobile navigation">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-[11px] tracking-[0.28em] uppercase font-medium py-5 border-b border-primary-foreground/6 transition-colors duration-300 touch-manipulation ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/55 hover:text-primary-foreground'}`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Destination accordion */}
              <div className="border-b border-primary-foreground/6">
                <button
                  onClick={() => setMobileDestinationOpen(!mobileDestinationOpen)}
                  className={`w-full flex items-center justify-between text-[11px] tracking-[0.28em] uppercase font-medium py-5 transition-colors duration-300 touch-manipulation ${isDestinationActive ? 'text-accent' : 'text-primary-foreground/55 hover:text-primary-foreground'}`}
                  aria-expanded={mobileDestinationOpen}
                >
                  Destination
                  <ChevronDown size={14} className={`transition-transform duration-200 ${mobileDestinationOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {mobileDestinationOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' as const }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-3 flex flex-col gap-0">
                        {destinationLinks.map(link => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className={`text-[10px] tracking-[0.25em] uppercase font-medium py-3.5 border-b border-primary-foreground/4 transition-colors duration-200 touch-manipulation ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/45 hover:text-primary-foreground'}`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Company accordion */}
              <div className="border-b border-primary-foreground/6">
                <button
                  onClick={() => setMobileCompanyOpen(!mobileCompanyOpen)}
                  className={`w-full flex items-center justify-between text-[11px] tracking-[0.28em] uppercase font-medium py-5 transition-colors duration-300 touch-manipulation ${isCompanyActive ? 'text-accent' : 'text-primary-foreground/55 hover:text-primary-foreground'}`}
                  aria-expanded={mobileCompanyOpen}
                >
                  Company
                  <ChevronDown size={14} className={`transition-transform duration-200 ${mobileCompanyOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {mobileCompanyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' as const }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 pb-3 flex flex-col gap-0">
                        {/* Careers sub-accordion — first position */}
                        <div>
                          <button
                            onClick={() => setMobileCareersOpen(!mobileCareersOpen)}
                            className={`w-full flex items-center justify-between text-[10px] tracking-[0.25em] uppercase font-medium py-3.5 border-b border-primary-foreground/4 transition-colors duration-200 touch-manipulation ${location.pathname.startsWith('/company/careers') ? 'text-accent' : 'text-primary-foreground/45 hover:text-primary-foreground'}`}
                            aria-expanded={mobileCareersOpen}
                          >
                            Careers
                            <ChevronDown size={12} className={`transition-transform duration-200 ${mobileCareersOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <AnimatePresence initial={false}>
                            {mobileCareersOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' as const }}
                                className="overflow-hidden"
                              >
                                <div className="pl-4 pb-2 flex flex-col gap-0">
                                  <Link
                                    to="/company/careers"
                                    className={`text-[10px] tracking-[0.2em] uppercase font-medium py-3 border-b border-primary-foreground/4 transition-colors duration-200 touch-manipulation ${location.pathname === '/company/careers' ? 'text-accent' : 'text-primary-foreground/40 hover:text-primary-foreground'}`}
                                  >
                                    Overview
                                  </Link>
                                  {careersLinks.map(link => (
                                    <Link
                                      key={link.href}
                                      to={link.href}
                                      className={`text-[10px] tracking-[0.2em] uppercase font-medium py-3 border-b border-primary-foreground/4 transition-colors duration-200 touch-manipulation ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/40 hover:text-primary-foreground'}`}
                                    >
                                      {link.label}
                                    </Link>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Flat links — About Us and Contact */}
                        {companyLinks.map(link => (
                          <Link
                            key={link.href}
                            to={link.href}
                            className={`text-[10px] tracking-[0.25em] uppercase font-medium py-3.5 border-b border-primary-foreground/4 transition-colors duration-200 touch-manipulation ${location.pathname === link.href ? 'text-accent' : 'text-primary-foreground/45 hover:text-primary-foreground'}`}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-7 flex flex-col gap-4">
                <a href="tel:+17844581000" className="text-[11px] tracking-[0.18em] text-primary-foreground/35 font-light touch-manipulation">
                  +1 (784) 458-1000
                </a>
                <Link to="/book" className="inline-block w-fit px-7 py-4 text-[11px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary-foreground transition-all duration-300 touch-manipulation">
                  Book Now
                </Link>
                <Link to="/staff/login" className="inline-block w-fit px-7 py-4 text-[11px] tracking-[0.25em] uppercase font-light border border-primary-foreground/40 text-primary-foreground/70 hover:border-accent hover:text-accent transition-all duration-300 touch-manipulation">
                  Staff Portal
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
