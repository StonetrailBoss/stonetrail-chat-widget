import { useEffect, useRef } from 'react';
import { useLocation } from "react-router";
import { motion, useInView } from 'motion/react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { policies } from 'virtual:content';
function FadeUp({
  children,
  delay = 0,
  className = ''
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: '-60px'
  });
  return <motion.div ref={ref} initial={{
    opacity: 0,
    y: 28
  }} animate={inView ? {
    opacity: 1,
    y: 0
  } : {
    opacity: 0,
    y: 28
  }} transition={{
    duration: 0.75,
    ease: 'easeOut' as const,
    delay
  }} className={className}>
      {children}
    </motion.div>;
}
export default function PoliciesPage() {
  const {
    hash
  } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        }), 100);
      }
    }
  }, [hash]);
  return <>
      <Helmet>
        <title>Policies — Flexible Cancellation, House Rules &amp; Privacy | Stonetrail Villas</title>
        <meta name="description" content="Stonetrail Villas policies: flexible cancellation up to 30 days before arrival, clear house rules, and a commitment to your privacy. Transparent terms for a worry-free stay." />
        <link rel="canonical" href="https://stonetrailvillas.com/policies" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/policies" />
        <meta property="og:title" content="Policies — Flexible Cancellation & House Rules | Stonetrail Villas" />
        <meta property="og:description" content="Flexible cancellation up to 30 days before arrival, clear house rules, and a commitment to your privacy. Transparent terms for a worry-free stay." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Policies | Stonetrail Villas" />
        <meta name="twitter:description" content="Flexible cancellation, clear house rules, and transparent terms for a worry-free stay at Stonetrail Villas." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/policies#webpage',
            name: 'Policies — Stonetrail Villas',
            url: 'https://stonetrailvillas.com/policies',
            description: 'Stonetrail Villas policies: flexible cancellation up to 30 days before arrival, clear house rules, and a commitment to your privacy.',
            isPartOf: {
              '@id': 'https://stonetrailvillas.com/#website'
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [{
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://stonetrailvillas.com/'
              }, {
                '@type': 'ListItem',
                position: 2,
                name: 'Policies',
                item: 'https://stonetrailvillas.com/policies'
              }]
            }
          }, {
            '@type': 'Hotel',
            '@id': 'https://stonetrailvillas.com/#hotel',
            name: 'Stonetrail Villas',
            url: 'https://stonetrailvillas.com',
            checkinTime: 'T15:00',
            checkoutTime: 'T11:00',
            petsAllowed: false,
            smokingAllowed: false,
            termsOfService: 'https://stonetrailvillas.com/policies',
            amenityFeature: [{
              '@type': 'LocationFeatureSpecification',
              name: 'Flexible Cancellation',
              value: true,
              description: 'Full refund for cancellations made 30 or more days before arrival.'
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'No Smoking',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'No Pets',
              value: true
            }]
          }]
        })}</script>
      </Helmet>

      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <section className="bg-[#1A2E28] pt-44 pb-24">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <motion.p initial={{
          opacity: 0,
          y: 14
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.7,
          delay: 0.2,
          ease: 'easeOut' as const
        }} className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">
            {policies.hero.eyebrow}
          </motion.p>
          <motion.h1 initial={{
          opacity: 0,
          y: 22
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.4,
          ease: 'easeOut' as const
        }} className="font-heading text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
            {policies.hero.heading}
          </motion.h1>
        </div>
      </section>

      {/* ── STICKY NAV ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#1A2E28]/8 sticky top-[72px] z-40">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <nav className="flex gap-8 overflow-x-auto py-4 scrollbar-hide">
            {policies.sections.map(s => <a key={s.id} href={`#${s.id}`} className="text-[9px] tracking-[0.28em] uppercase text-[#1A2E28]/45 hover:text-[#2C4A3E] transition-colors duration-300 whitespace-nowrap font-medium">
                {s.num} — {s.title}
              </a>)}
          </nav>
        </div>
      </div>

      {/* ── POLICY SECTIONS ──────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="space-y-24">
            {policies.sections.map(section => <FadeUp key={section.id}>
                <div id={section.id} className="scroll-mt-36">
                  {/* Section header */}
                  <div className="flex items-baseline gap-6 mb-10 pb-6 border-b border-[#1A2E28]/10">
                    <span className="font-heading text-5xl text-[#2C4A3E]/15 leading-none flex-shrink-0">
                      {section.num}
                    </span>
                    <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">{section.title}</h2>
                  </div>

                  {/* Content grid */}
                  <div className="grid md:grid-cols-2 gap-0 border-l border-t border-[#1A2E28]/8">
                    {section.content.map(item => <div key={item.heading} className="border-r border-b border-[#1A2E28]/8 p-7 lg:p-8 hover:bg-white transition-colors duration-300">
                        <h3 className="text-[10px] tracking-[0.22em] uppercase font-medium text-[#2C4A3E] mb-3">
                          {item.heading}
                        </h3>
                        <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">{item.text}</p>
                      </div>)}
                  </div>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── FOOTER NOTE ──────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-t border-[#1A2E28]/8">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#1A2E28]/40 font-light">{policies.footer.lastUpdated}</p>
          <p className="text-xs text-[#1A2E28]/40 font-light">
            Questions?{' '}
            <a href="/contact" className="text-[#2C4A3E] hover:text-[#8B7355] transition-colors duration-300 border-b border-[#8B7355]/40">
              Contact us
            </a>
          </p>
        </div>
      </section>
    </>;
}
