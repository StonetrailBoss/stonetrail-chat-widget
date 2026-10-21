import { useRef, useState, useEffect } from 'react';
import { Link } from "react-router";
import { motion, useInView } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
import GoogleReviews from '@/components/GoogleReviews';
import { getRandomPromoVideo, toEmbedUrl } from '@/lib/promoVideos';
import { home } from 'virtual:content';

// ─── Structured data ──────────────────────────────────────────────────────────
const SITE = 'https://stonetrailvillas.com';
const hotelSchema = {
  '@context': 'https://schema.org',
  '@graph': [
  // ── WebSite ────────────────────────────────────────────────────────────
  {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: 'Stonetrail Villas',
    url: `${SITE}/`,
    description: 'Boutique private luxury villas in St. Vincent and the Grenadines.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE}/rooms?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'en'
  },
  // ── Hotel ──────────────────────────────────────────────────────
  {
    '@type': 'Hotel',
    '@id': `${SITE}/#organization`,
    name: 'Stonetrail Villas',
    url: `${SITE}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE}/assets/Nlogo.png`,
      width: 400,
      height: 120
    },
    image: `${SITE}/assets/og-image.jpg`,
    telephone: '+1(784) 458-1000',
    email: 'info@stonetrailvillas.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Indian Bay, Villa',
      addressLocality: 'Kingstown',
      addressRegion: 'St. Vincent',
      postalCode: 'VC0100',
      addressCountry: 'VC'
    },
    sameAs: ['https://www.instagram.com/stonetrailvillas', 'https://www.facebook.com/stonetrailvillas']
  },
  // ── Hotel ─────────────────────────────────────────────────────────────
  {
    '@type': 'Hotel',
    '@id': `${SITE}/#hotel`,
    name: 'Stonetrail Villas',
    alternateName: 'Stone Trail Villas',
    description: 'A boutique collection of private luxury villas in St. Vincent and the Grenadines, offering refined Caribbean hospitality with ocean views, tropical gardens, and personalised concierge service.',
    url: `${SITE}/`,
    telephone: '+1(784) 458-1000',
    email: 'info@stonetrailvillas.com',
    image: [`${SITE}/assets/og-image.jpg`, `${SITE}/assets/superior-living1.JPG`, `${SITE}/assets/superior-living4.JPG`],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Indian Bay, Villa',
      addressLocality: 'Kingstown',
      addressRegion: 'St. Vincent',
      postalCode: 'VC0100',
      addressCountry: 'VC'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 13.2528,
      longitude: -61.1971
    },
    hasMap: 'https://maps.google.com/?q=13.2528,-61.1971',
    priceRange: '$$$',
    starRating: {
      '@type': 'Rating',
      ratingValue: '5',
      bestRating: '5'
    },
    checkinTime: 'T15:00',
    checkoutTime: 'T11:00',
    numberOfRooms: 7,
    currenciesAccepted: 'USD, XCD',
    paymentAccepted: 'Credit Card, Cash',
    areaServed: [{
      '@type': 'State',
      name: 'St Vincent and the Grenadines'
    }, {
      '@type': 'City',
      name: 'Calliaqua'
    }, {
      '@type': 'City',
      name: 'Kingstown'
    }, {
      '@type': 'City',
      name: 'Arnos Vale'
    }, {
      '@type': 'AdministrativeArea',
      name: 'St. George'
    }, {
      '@type': 'Place',
      name: 'Young Island'
    }],
    amenityFeature: [{
      '@type': 'LocationFeatureSpecification',
      name: 'Private Villa',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Concierge Service',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Airport Transfer',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Free Wi-Fi',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Air Conditioning',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Private Garden',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Ocean View',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Fully Equipped Kitchen',
      value: true
    }, {
      '@type': 'LocationFeatureSpecification',
      name: 'Daily Housekeeping',
      value: true
    }],
    makesOffer: [{
      '@type': 'Offer',
      name: 'Superior Villa',
      description: '3-bedroom private villa with vaulted ceilings and ocean views.',
      url: `${SITE}/rooms/superior-villa`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 185,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }, {
      '@type': 'Offer',
      name: 'Honeymoon Suite',
      description: 'Romantic 1-bedroom suite with four-poster king bed and private patio.',
      url: `${SITE}/rooms/honeymoon-suite`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 165,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }, {
      '@type': 'Offer',
      name: 'Presidential Suite',
      description: 'Ultimate Caribbean luxury with private king bedroom and dedicated sitting room.',
      url: `${SITE}/rooms/presidential-suite`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 185,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }, {
      '@type': 'Offer',
      name: 'Garden Family Villa',
      description: 'Spacious 2-bedroom family villa with tropical garden setting.',
      url: `${SITE}/rooms/garden-family-villa`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 168,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }, {
      '@type': 'Offer',
      name: 'Garden Junior Suite',
      description: 'Intimate 1-bedroom suite with kitchenette and private patio.',
      url: `${SITE}/rooms/garden-junior-suite`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 155,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }, {
      '@type': 'Offer',
      name: 'Deluxe King Room',
      description: 'Beautifully appointed king bedroom with premium finishes.',
      url: `${SITE}/rooms/deluxe-king`,
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: 165,
        priceCurrency: 'USD',
        unitText: 'night'
      }
    }],
    sameAs: ['https://www.instagram.com/stonetrailvillas', 'https://www.facebook.com/stonetrailvillas'],
    isPartOf: {
      '@id': `${SITE}/#organization`
    }
  },
  // ── WebPage (homepage) ────────────────────────────────────────────────
  {
    '@type': 'WebPage',
    '@id': `${SITE}/#webpage`,
    url: `${SITE}/`,
    name: 'Stonetrail Villas — Private Luxury Villa Rental, St. Vincent & The Grenadines',
    description: 'Escape to Stonetrail Villas — a boutique collection of private luxury villas in St. Vincent and the Grenadines. Ocean views, tropical gardens, and personalised Caribbean hospitality.',
    isPartOf: {
      '@id': `${SITE}/#website`
    },
    about: {
      '@id': `${SITE}/#hotel`
    },
    datePublished: '2024-01-01',
    dateModified: '2026-07-19',
    inLanguage: 'en',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE}/`
      }]
    }
  },
  // ── FAQPage ───────────────────────────────────────────────────────────
  {
    '@type': 'FAQPage',
    '@id': `${SITE}/#faq`,
    mainEntity: [{
      '@type': 'Question',
      name: 'Where is Stonetrail Villas located?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Stonetrail Villas is located at Indian Bay, Villa, in St. Vincent and the Grenadines — a short drive from E.T. Joshua Airport and the capital Kingstown.'
      }
    }, {
      '@type': 'Question',
      name: 'What types of villas are available at Stonetrail Villas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We offer seven private villas and suites: the Superior Villa, Honeymoon Suite, Presidential Suite, Garden Family Villa, Garden Junior Suite, Garden Retreat, and Deluxe King Room — ranging from intimate suites to spacious multi-bedroom villas.'
      }
    }, {
      '@type': 'Question',
      name: 'What is the check-in and check-out time at Stonetrail Villas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check-in is from 3:00 PM and check-out is by 11:00 AM. Early check-in and late check-out may be arranged subject to availability.'
      }
    }, {
      '@type': 'Question',
      name: 'Does Stonetrail Villas offer airport transfers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Complimentary airport transfer is available for guests arriving at E.T. Joshua Airport or Argyle International Airport in St. Vincent.'
      }
    }, {
      '@type': 'Question',
      name: 'What is the cancellation policy at Stonetrail Villas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Stonetrail Villas offers flexible cancellation. Guests may cancel up to 30 days before arrival for a full refund. Please review our full policies page for complete details.'
      }
    }, {
      '@type': 'Question',
      name: 'How do I book a villa at Stonetrail Villas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can book directly at stonetrailvillas.com/book for the best available rate, or contact us by phone at +1(784) 458-1000 or email at info@stonetrailvillas.com.'
      }
    }]
  }]
};

// ─── Animation helpers ────────────────────────────────────────────────────────
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



// ─── Static villa href lookup (navigation URLs — not content-layer text) ──────
const VILLA_HREFS: Record<string, string> = {
  'superior-villa': '/rooms/superior-villa#gallery',
  'honeymoon-suite': '/rooms/honeymoon-suite#gallery',
  'garden-family-villa': '/rooms/garden-family-villa#gallery',
  'garden-junior-suite': '/rooms/garden-junior-suite#gallery',
  'presidential-suite': '/rooms/presidential-suite#gallery',
  'deluxe-king': '/rooms/deluxe-king#gallery',
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoEmbedUrl, setPromoEmbedUrl] = useState('');
  useEffect(() => {
    const video = getRandomPromoVideo();
    if (video) setPromoEmbedUrl(toEmbedUrl(video.url));
    const timer = setTimeout(() => setPromoOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);
  return <>
      <Helmet>
        <title>Stonetrail Villas — Private Luxury Villa Rental, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Escape to Stonetrail Villas — a boutique collection of private luxury villas in St. Vincent and the Grenadines. Ocean views, tropical gardens, and personalised Caribbean hospitality. Book direct for the best rate." />
        <link rel="canonical" href="https://stonetrailvillas.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/" />
        <meta property="og:title" content="Stonetrail Villas — Private Luxury Villa Rental, St. Vincent & The Grenadines" />
        <meta property="og:description" content="Escape to Stonetrail Villas — a boutique collection of private luxury villas in St. Vincent and the Grenadines. Ocean views, tropical gardens, and personalised Caribbean hospitality." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Stonetrail Villas — Private Luxury Villa Rental, St. Vincent & The Grenadines" />
        <meta name="twitter:description" content="Boutique private luxury villas in St. Vincent and the Grenadines. Ocean views, tropical gardens, personalised Caribbean hospitality." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <script type="application/ld+json">{JSON.stringify(hotelSchema)}</script>
      </Helmet>

      {/* ── Seasonal Promo Video Popup ── */}
      <div className={`fixed bottom-6 left-6 z-50 w-[340px] sm:w-[400px] shadow-2xl transition-all duration-500 ${promoOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Header bar */}
          <div className="bg-[#1A2E28] px-5 py-3 flex items-center justify-between">
            <div>
              <p className="text-[#C8B89A] text-[9px] tracking-[0.3em] uppercase font-medium">{home.promo.eyebrow}</p>
              <p className="text-white text-sm font-heading tracking-wide mt-0.5">{home.promo.title}</p>
            </div>
            <button onClick={() => setPromoOpen(false)} className="text-white/50 hover:text-white transition-colors ml-6 flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
          {/* Video — always mounted so autoplay fires immediately on reveal */}
          <div className="aspect-video bg-black">
            <iframe className="w-full h-full" src={promoEmbedUrl} title="Vincy Mas Carnival St. Vincent" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
          {/* Footer bar */}
          <div className="bg-[#1A2E28]/90 px-5 py-3 flex items-center justify-between">
            <p className="text-white/50 text-[10px] tracking-[0.15em] uppercase">{home.promo.footer}</p>
            <Link to="/destination" onClick={() => setPromoOpen(false)} className="text-[#C8B89A] text-[10px] tracking-[0.2em] uppercase font-medium hover:text-white transition-colors flex items-center gap-1.5">
              <span>{home.promo.footerCta}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/assets/superior-living4.JPG')`
      }} initial={{
        scale: 1.05
      }} animate={{
        scale: 1
      }} transition={{
        duration: 10,
        ease: 'easeOut' as const
      }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2E28]/50 via-[#1A2E28]/20 to-[#1A2E28]/70" />

        <div className="relative z-10 text-center px-5 max-w-4xl mx-auto">
          <motion.p initial={{
          opacity: 0,
          letterSpacing: '0.6em'
        }} animate={{
          opacity: 1,
          letterSpacing: '0.35em'
        }} transition={{
          duration: 1.2,
          delay: 0.3,
          ease: 'easeOut' as const
        }} className="text-[#C8B89A] text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.35em] uppercase mb-5 sm:mb-7 font-medium">
            <span>{home.hero.eyebrow}</span>
          </motion.p>
          <motion.h1 initial={{
          opacity: 0,
          y: 24
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          delay: 0.5,
          ease: 'easeOut' as const
        }} className="font-heading text-4xl sm:text-5xl lg:text-7xl xl:text-[84px] text-white leading-[1.06] mb-5 sm:mb-7 tracking-tight">
            <span>{home.hero.heading}</span>
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 1,
          delay: 0.9
        }} className="text-white/55 text-sm sm:text-base lg:text-lg mb-8 sm:mb-12 font-light tracking-wide max-w-xl mx-auto">
            <span>{home.hero.subheading}</span>
          </motion.p>

          <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 1.1
        }} className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link to="/rooms" className="w-full sm:w-auto text-center px-8 sm:px-10 py-4 border border-white/40 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300 touch-manipulation">
              <span>{home.hero.ctaExplore}</span>
            </Link>

          </motion.div>

          {/* Cloudbeds date picker */}
          <div className="mt-6 flex justify-center">
            {/* @ts-expect-error custom element */}
            <cb-property-date-picker
              property-code="XsjT4D"
              button-label="Check Availability"
              layout="horizontal"
              lang="en"
              currency="US"
              class-name="my-date-picker"
              open-in-new-tab="true"
              custom-url="https://stonetrailvillas.com/book"
            />
          </div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30" initial={{
        opacity: 0
      }} animate={{
        opacity: 1,
        y: [0, 7, 0]
      }} transition={{
        delay: 2,
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut' as const
      }}>
          <ChevronDown size={18} />
        </motion.div>
      </section>



      {/* ── ABOUT INTRO ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 lg:py-36 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
            {/* Image */}
            <FadeUp className="relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img src="/assets/FullSizeRender-1-1.jpeg" alt="Stonetrail Villas — private luxury villa in St. Vincent and the Grenadines" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 w-2/3 h-2/3 border border-[#2C4A3E]/20 pointer-events-none" />
            </FadeUp>

            {/* Text */}
            <div>
              <FadeUp delay={0.1}>
                <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 sm:mb-5 font-medium">{home.about.eyebrow}</p>
                <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-[#1A2E28] leading-tight mb-6 sm:mb-8">
                  <span>{home.about.heading}</span>
                </h2>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="text-[#1A2E28]/60 text-base leading-relaxed mb-5 sm:mb-6 font-light">
                  <span>{home.about.body1}</span>
                </p>
                <p className="text-[#1A2E28]/60 text-base leading-relaxed mb-8 sm:mb-10 font-light">
                  <span>{home.about.body2}</span>
                </p>
              </FadeUp>
              <FadeUp delay={0.3}>
                <Link to="/about" className="inline-flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase font-medium text-[#2C4A3E] border-b border-[#8B7355] pb-0.5 hover:text-[#8B7355] transition-colors duration-300 touch-manipulation">
                  <span>{home.about.cta}</span>
                </Link>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── VILLAS ───────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 lg:py-36 bg-white">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12">
          <FadeUp className="mb-10 sm:mb-14">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">{home.villas.eyebrow}</p>
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-[#1A2E28]"><span>{home.villas.heading}</span></h2>
              <Link to="/rooms" className="text-[10px] tracking-[0.22em] uppercase font-medium text-[#2C4A3E] border-b border-[#8B7355] pb-0.5 hover:text-[#8B7355] transition-colors duration-300 whitespace-nowrap touch-manipulation">
                <span>{home.villas.cta}</span>
              </Link>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {home.villas.items.map((room, i) => <FadeUp key={room.id} delay={i * 0.1}>
                <Link to={VILLA_HREFS[room.id] ?? '/rooms'} className="group block touch-manipulation">
                  <div className="overflow-hidden mb-4 sm:mb-5 relative">
                    <img src={room.image} alt={`${room.name} — Stonetrail Villas`} className="w-full aspect-[3/4] object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading text-xl sm:text-2xl text-[#1A2E28] group-hover:text-[#2C4A3E] transition-colors duration-300">
                      <span>{room.name}</span>
                    </h3>
                    <span className="text-[10px] tracking-wide text-[#8B7355] font-light whitespace-nowrap mt-1.5">{room.guests}</span>
                  </div>
                  <p className="text-sm text-[#1A2E28]/55 mb-4 font-light leading-relaxed"><span>{room.tagline}</span></p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] tracking-[0.15em] text-[#8B7355] font-medium">{room.rate}</span>
                    <span className="text-[10px] tracking-[0.2em] uppercase text-[#2C4A3E] font-medium group-hover:text-[#8B7355] transition-colors duration-300">
                      Discover More →
                    </span>
                  </div>
                </Link>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── EXPERIENCES / LOCATION ───────────────────────────────────────── */}
      <section className="relative py-20 sm:py-32 lg:py-48 overflow-hidden bg-[#1A2E28]">
        <div className="relative z-10 max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12">
          <div className="max-w-xl">
            <FadeUp>
              <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-4 sm:mb-5 font-medium">{home.experiences.eyebrow}</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white leading-tight mb-5 sm:mb-7">
                <span>{home.experiences.heading}</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8 sm:mb-10 font-light">
                <span>{home.experiences.body}</span>
              </p>
              <Link to="/destination" className="inline-block px-8 py-4 border border-[#C8B89A]/60 text-[#C8B89A] text-[10px] tracking-[0.22em] uppercase font-medium hover:bg-[#C8B89A] hover:text-[#1A2E28] transition-all duration-300 touch-manipulation">
                <span>{home.experiences.cta}</span>
              </Link>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED PHOTO DIVIDER ──────────────────────────────────────── */}
      <section className="relative h-[55vh] lg:h-[70vh] overflow-hidden">
        <img src="/assets/presidential bathroom.jpeg" alt="Stonetrail Villas — luxury bathroom" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#1A2E28]/20" />
      </section>

      {/* ── THE LIHIM PROMISE (numbered features) ────────────────────────── */}
      <section className="py-16 sm:py-24 lg:py-36 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12">
          <FadeUp className="mb-10 sm:mb-14">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">{home.promises.eyebrow}</p>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-[#1A2E28]">
              <span>{home.promises.heading}</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-[#1A2E28]/10">
            {home.promises.items.map((item, i) => <FadeUp key={item.id} delay={i * 0.07}>
                <div className="border-r border-b border-[#1A2E28]/10 p-6 sm:p-8 lg:p-10 hover:bg-[#EDE8DE] transition-colors duration-300">
                  <p className="font-heading text-4xl text-[#2C4A3E]/20 mb-4 leading-none">{item.num}</p>
                  <h3 className="font-heading text-xl text-[#1A2E28] mb-3"><span>{item.title}</span></h3>
                  <p className="text-sm text-[#1A2E28]/55 leading-relaxed font-light"><span>{item.desc}</span></p>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── BOOK DIRECT ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 lg:py-36 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-5 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
            <FadeUp>
              <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-4 sm:mb-5 font-medium">{home.bookDirect.eyebrow}</p>
              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-6 sm:mb-8">
                <span>{home.bookDirect.heading}</span>
              </h2>
              <p className="text-white/50 text-base leading-relaxed mb-8 sm:mb-10 font-light">
                <span>{home.bookDirect.body}</span>
              </p>
              <ul className="space-y-4 mb-10 sm:mb-12">
                {home.bookDirect.benefits.map(benefit => <li key={benefit.id} className="flex items-start gap-4 text-sm text-white/55 leading-relaxed font-light">
                    <span className="text-[#C8B89A] flex-shrink-0 mt-0.5">—</span>
                    <span>{benefit.text}</span>
                  </li>)}
              </ul>
              <Link to="/book" className="inline-block w-full sm:w-auto text-center px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300 touch-manipulation">
                <span>{home.bookDirect.cta}</span>
              </Link>
            </FadeUp>

            <FadeUp delay={0.2} className="relative hidden lg:block">
              <div className="aspect-[4/5] overflow-hidden">
                <img src="/assets/custom image 16.jpeg" alt="Stonetrail Villas — villa interior" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-5 -left-5 w-2/3 h-2/3 border border-[#C8B89A]/20 pointer-events-none" />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <GoogleReviews />

      {/* ── NEIGHBOURHOOD DISCOVERY MAP ──────────────────────────────────── */}
      <section className="bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 pt-24 lg:pt-32 pb-14">
          <FadeUp>
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">{home.neighbourhood.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-4"><span>{home.neighbourhood.heading}</span></h2>
            <p className="text-sm text-[#1A2E28]/55 font-light max-w-xl leading-relaxed">
              <span>{home.neighbourhood.body}</span>
            </p>
          </FadeUp>
        </div>
        <FadeUp>
          <div className="w-full pb-24 lg:pb-32" style={{
          height: '600px'
        }}>
            <iframe src="https://storage.googleapis.com/maps-solutions-6mlyg9n1i3/neighborhood-discovery/zabc/neighborhood-discovery.html" width="100%" height="100%" style={{
            border: 0
          }} loading="lazy" title="Neighbourhood amenities around Stonetrail Villas" />
          </div>
        </FadeUp>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/assets/honeymoon rm4.JPG')`
      }} />
        <div className="absolute inset-0 bg-[#1A2E28]/80" />
        <div className="relative z-10 text-center px-5 sm:px-6 max-w-2xl mx-auto">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 sm:mb-6 font-medium">{home.finalCta.eyebrow}</p>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white mb-8 sm:mb-10 leading-tight">
              <span>{home.finalCta.heading}</span>
            </h2>
            <Link to="/book" className="inline-block w-full sm:w-auto text-center px-10 sm:px-12 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300 touch-manipulation">
              <span>{home.finalCta.cta}</span>
            </Link>
          </FadeUp>
        </div>
      </section>
    </>;
}
