import { Link } from '../router';
import { motion } from 'motion/react';

export default function NotFoundPage() {
  return (
    <>
      <title>Page Not Found | Stonetrail Villas</title>
      <meta name="description" content="The page you were looking for could not be found. Return to Stonetrail Villas and explore our luxury villa accommodations in St. Vincent and the Grenadines." />
      <meta name="robots" content="noindex, follow" />

      <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
          >
            <p className="font-heading text-[120px] lg:text-[180px] leading-none text-[#2C4A3E]/10 select-none mb-0">
              404
            </p>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#8B7355] font-medium mb-4 -mt-4">
              Page Not Found
            </p>
            <h1 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">
              This Page Has Checked Out
            </h1>
            <p className="text-[#1A2E28]/55 text-base font-light max-w-md mx-auto mb-12 leading-relaxed">
              The page you were looking for doesn't exist or may have moved. Let us guide you back to your sanctuary.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <span className="inline-block px-10 py-4 bg-[#2C4A3E] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#1A2E28] transition-all duration-300 cursor-pointer">
                  Return Home
                </span>
              </Link>
              <Link to="/rooms">
                <span className="inline-block px-10 py-4 border border-[#2C4A3E]/30 text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#2C4A3E] transition-all duration-300 cursor-pointer">
                  View Our Villas
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
