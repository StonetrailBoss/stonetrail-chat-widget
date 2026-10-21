import { useRef } from 'react';
import { Link } from "react-router";
import { motion, useInView } from 'motion/react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { about } from 'virtual:content';
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
export default function AboutPage() {
  return <>
      <Helmet>
        <title>About Stonetrail Villas — Family-Owned Boutique Hotel, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Stonetrail Villas is a refined boutique retreat in St. Vincent and the Grenadines — founded by hands-on owners committed to privacy, personalised service, and an experience guided by integrity. Your trails to the exceptional." />
        <link rel="canonical" href="https://stonetrailvillas.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/about" />
        <meta property="og:title" content="About Stonetrail Villas — Family-Owned Boutique Hotel, St. Vincent & The Grenadines" />
        <meta property="og:description" content="A refined boutique retreat in St. Vincent and the Grenadines — founded by hands-on owners committed to privacy, personalised service, and integrity." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/about/team" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Stonetrail Villas — Family-Owned Boutique Hotel" />
        <meta name="twitter:description" content="A refined boutique retreat in St. Vincent and the Grenadines — founded by hands-on owners committed to privacy, personalised service, and integrity." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/about/team" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'AboutPage',
            '@id': 'https://stonetrailvillas.com/about#webpage',
            name: 'About Stonetrail Villas',
            url: 'https://stonetrailvillas.com/about',
            description: 'Stonetrail Villas is a family-owned boutique retreat in St. Vincent and the Grenadines, committed to privacy, personalised service, and exceptional Caribbean hospitality.',
            isPartOf: {
              '@id': 'https://stonetrailvillas.com/#website'
            },
            about: {
              '@id': 'https://stonetrailvillas.com/#organization'
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
                name: 'About',
                item: 'https://stonetrailvillas.com/about'
              }]
            }
          }, {
            '@type': 'Hotel',
            '@id': 'https://stonetrailvillas.com/#organization',
            name: 'Stonetrail Villas',
            url: 'https://stonetrailvillas.com',
            foundingDate: '2018',
            description: 'A family-owned boutique collection of private luxury villas in St. Vincent and the Grenadines, offering refined Caribbean hospitality with ocean views, tropical gardens, and personalised concierge service.',
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Indian Bay, Villa',
              addressLocality: 'Kingstown',
              addressRegion: 'St. Vincent',
              postalCode: 'VC0100',
              addressCountry: 'VC'
            },
            telephone: '+1(784) 458-1000',
            email: 'info@stonetrailvillas.com',
            sameAs: ['https://www.instagram.com/stonetrailvillas', 'https://www.facebook.com/stonetrailvillas']
          }]
        })}</script>
      </Helmet>

      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <section className="relative pt-44 pb-24 overflow-hidden bg-[#1A2E28]">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{
        backgroundImage: `url('/assets/superior-bd7.JPG')`
      }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2E28]/60 to-[#1A2E28]" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6 lg:px-12">
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
            {about.hero.eyebrow}
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
        }} className="font-heading text-5xl lg:text-6xl xl:text-7xl text-white leading-tight max-w-2xl">
            {about.hero.heading}
          </motion.h1>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-36 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* Image */}
            <FadeUp className="relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img src="/assets/family.png" alt="The owners and family of Stonetrail Villas" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-5 -right-5 w-2/3 h-2/3 border border-[#2C4A3E]/15 pointer-events-none" />
            </FadeUp>

            {/* Text */}
            <div className="space-y-7 lg:pt-4">
              <FadeUp delay={0.1}>
                <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-2 font-medium">{about.story.eyebrow}</p>
                <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28] leading-tight mb-6">
                  {about.story.heading}
                </h2>
              </FadeUp>
              {about.story.paragraphs.map((p, i) => (
                <FadeUp key={p.id} delay={0.15 + i * 0.05}>
                  <p className="text-[#1A2E28]/65 text-base leading-relaxed font-light">
                    {p.text}
                  </p>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-14">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">{about.values.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">{about.values.heading}</h2>
          </FadeUp>

          <div className="grid sm:grid-cols-2 gap-0 border-l border-t border-[#1A2E28]/10">
            {about.values.items.map((v, i) => <FadeUp key={v.id} delay={i * 0.08}>
                <div className="border-r border-b border-[#1A2E28]/10 p-8 lg:p-10 hover:bg-[#F5F0E8] transition-colors duration-300">
                  <p className="font-heading text-4xl text-[#2C4A3E]/15 mb-4 leading-none">{v.num}</p>
                  <h3 className="font-heading text-xl text-[#1A2E28] mb-3">{v.title}</h3>
                  <p className="text-sm text-[#1A2E28]/55 leading-relaxed font-light">{v.desc}</p>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED DIVIDER ───────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/assets/garden retreat family 19.JPG')`
      }} />
        <div className="absolute inset-0 bg-[#1A2E28]/78" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="max-w-xl">
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">{about.quote.eyebrow}</p>
            <blockquote className="font-heading text-3xl lg:text-4xl text-white leading-tight">
              {about.quote.text}
            </blockquote>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">{about.cta.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">{about.cta.heading}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
                {about.cta.primaryLabel}
              </Link>
              <Link to="/contact" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                {about.cta.secondaryLabel}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>;
}
