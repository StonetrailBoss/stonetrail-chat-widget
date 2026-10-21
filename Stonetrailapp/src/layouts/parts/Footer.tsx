import { Link } from "react-router";
import { Phone, Mail, MessageCircle, Instagram, Facebook } from 'lucide-react';
export default function Footer() {
  return <>
    <footer className="bg-[#111E1A] text-white/55">

      {/* ── BOOK DIRECT BANNER ───────────────────────────────────────────── */}
      <div className="border-b border-white/8">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 sm:gap-6">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#C8B89A]/80 mb-2 font-medium">
              Best Rate Guaranteed
            </p>
            <p className="text-white/70 text-base font-light">
              Book directly with us for exclusive benefits and the lowest rate.
            </p>
          </div>
          <Link to="/book" className="flex-shrink-0 w-full sm:w-auto text-center px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-medium bg-[#C8B89A] text-[#1A2E28] hover:bg-white transition-all duration-300 touch-manipulation">
            Reserve Your Villa
          </Link>
        </div>
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
      <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-8">

          {/* Brand — wider column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-4">
            <img src="/assets/NLogoW.png" alt="Stonetrail Villas" className="h-14 w-auto object-contain mb-6 opacity-80" />
            <p className="text-sm leading-relaxed text-white/38 max-w-xs font-light">
              A boutique collection of private villas nestled in the heart of St. Vincent and the Grenadines — where the Caribbean meets refined luxury.
            </p>
            <div className="flex gap-4 mt-8">
              <a href="https://www.instagram.com/stonetrailvillas" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-8 h-8 border border-white/12 flex items-center justify-center transition-all duration-300 hover:border-[#E1306C]/50 text-white/28 hover:text-[#E1306C]">
                <Instagram size={13} />
              </a>
              <a href="https://www.facebook.com/stonetrailvillas" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-8 h-8 border border-white/12 flex items-center justify-center transition-all duration-300 hover:border-[#1877F2]/50 text-white/28 hover:text-[#1877F2]">
                <Facebook size={13} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-[9px] tracking-[0.35em] uppercase text-white/28 mb-6 font-medium">Explore</h4>
            <ul className="space-y-3">
              {[{
                label: 'Villas & Suites',
                href: '/rooms'
              }, {
                label: 'The Destination',
                href: '/destination'
              }, {
                label: 'About Us',
                href: '/about'
              }, {
                label: 'Contact',
                href: '/contact'
              }, {
                label: 'Reservations',
                href: '/book'
              }, {
                label: 'Staff Portal',
                href: '/staff/login'
              }].map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Policies */}
          <div className="lg:col-span-2">
            <h4 className="text-[9px] tracking-[0.35em] uppercase text-white/28 mb-6 font-medium">Policies</h4>
            <ul className="space-y-3">
              {[{
                label: 'House Rules',
                href: '/policies#house-rules'
              }, {
                label: 'Cancellation',
                href: '/policies#cancellation'
              }, {
                label: 'Privacy Policy',
                href: '/policies#privacy'
              }, {
                label: 'Terms & Conditions',
                href: '/policies#terms'
              }].map(link => <li key={link.href}>
                  <Link to={link.href} className="text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h4 className="text-[9px] tracking-[0.35em] uppercase text-white/28 mb-6 font-medium">Contact</h4>
            <ul className="space-y-4">
              <li>
                <a href="tel:+17844581000" className="flex items-center gap-3 text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300 group">
                  <Phone size={12} className="flex-shrink-0 text-[#C8B89A]/50 group-hover:text-[#C8B89A] transition-colors duration-300" />
                  +1 (784) 458-1000
                </a>
              </li>
              <li>
                <a href="mailto:info@stonetrailvillas.com" className="flex items-start gap-3 text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300 group break-all">
                  <Mail size={12} className="flex-shrink-0 text-[#C8B89A]/50 mt-0.5 group-hover:text-[#C8B89A] transition-colors duration-300" />
                  info@stonetrailvillas.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/17844931800" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300 group">
                  <MessageCircle size={12} className="flex-shrink-0 text-[#C8B89A]/50 group-hover:text-[#C8B89A] transition-colors duration-300" />
                  WhatsApp: +1 (784) 493-1800
                </a>
              </li>
              <li className="pt-2">
                <p className="text-xs text-white/25 leading-relaxed font-light">
                  Indian Bay, Villa,<br />St. Vincent and the Grenadines, VC0100
                </p>
              </li>
              <li className="pt-2">
                <a href="https://g.page/r/Cfaz0-iCGC_sEBM/review" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-light text-white/42 hover:text-[#C8B89A] transition-colors duration-300 group">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0 text-[#C8B89A]/50 group-hover:text-[#C8B89A] transition-colors duration-300">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Leave us a Google Review
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── BOTTOM BAR ───────────────────────────────────────────────────── */}
      <div className="border-t border-white/6">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-white/20 font-light tracking-wide">
            &copy; {new Date().getFullYear()} The Ballantyne Ltd T/A Stonetrail Villas. All rights reserved.
          </p>
          <p className="text-[10px] text-white/15 font-light tracking-wide">
            St. Vincent and the Grenadines, West Indies
          </p>
        </div>
      </div>

    </footer>

    {/* Tawk.to chat widget anchor — script loaded globally in App.tsx */}
  </>;
}
