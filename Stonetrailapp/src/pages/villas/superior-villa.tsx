import { useState, useRef } from 'react';
import { Link } from "react-router";
import ShareButtons from '@/components/ShareButtons';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Wifi, Wind, Car, Utensils, Star } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { superior_villa } from 'virtual:content';
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
const images = [{
  src: '/assets/superior-living1.JPG',
  caption: 'Open-plan living room'
}, {
  src: '/assets/superior-living2.JPG',
  caption: 'Living area'
}, {
  src: '/assets/superior-living3.JPG',
  caption: 'Living area'
}, {
  src: '/assets/superior-living4.JPG',
  caption: 'Living area'
}, {
  src: '/assets/superior-living5.JPG',
  caption: 'Living area'
}, {
  src: '/assets/superior-living6.JPG',
  caption: 'Living area'
}, {
  src: '/assets/superior-kitchen.JPG',
  caption: 'Fully equipped kitchen'
}, {
  src: '/assets/superior-bd1.JPG',
  caption: 'Master bedroom'
}, {
  src: '/assets/superior-bd2.JPG',
  caption: 'Bedroom — vaulted ceiling'
}, {
  src: '/assets/superior-bd3.JPG',
  caption: 'Bedroom — king bed'
}, {
  src: '/assets/superior-bd4.JPG',
  caption: 'Bedroom — stone wall accent'
}, {
  src: '/assets/superior-bd5.JPG',
  caption: 'Bedroom'
}, {
  src: '/assets/superior-bd6.JPG',
  caption: 'Bedroom'
}, {
  src: '/assets/superior-bd7.JPG',
  caption: 'Bedroom — four-poster'
}, {
  src: '/assets/superior-bd8.JPG',
  caption: 'Bedroom — wide angle'
}, {
  src: '/assets/superior-bd9.JPG',
  caption: 'Bedroom'
}];
const amenities = [{
  icon: Wifi,
  label: 'High-Speed Wi-Fi'
}, {
  icon: Wind,
  label: 'Air Conditioning'
}, {
  icon: Car,
  label: 'Airport Transfers'
}, {
  icon: Utensils,
  label: 'In-Villa Dining'
}, {
  icon: Star,
  label: 'Concierge Service'
}];
export default function SuperiorVillaPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const prev = () => setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % images.length : null);
  return <>
      <Helmet>
        <title>Superior Villa — 3-Bedroom Private Luxury Villa | Stonetrail Villas, St. Vincent</title>
        <meta name="description" content="The Superior Villa at Stonetrail Villas features vaulted timber ceilings, stone walls, a fully equipped kitchen, and 3 spacious bedrooms sleeping up to 4 guests. From $185/night in St. Vincent and the Grenadines." />
        <link rel="canonical" href="https://stonetrailvillas.com/rooms/superior-villa" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/rooms/superior-villa" />
        <meta property="og:title" content="Superior Villa — 3-Bedroom Private Luxury Villa | Stonetrail Villas" />
        <meta property="og:description" content="Vaulted timber ceilings, stone walls, fully equipped kitchen, 3 bedrooms sleeping up to 4 guests. From $185/night in St. Vincent and the Grenadines." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Superior Villa — 3-Bedroom Private Luxury Villa | Stonetrail Villas" />
        <meta name="twitter:description" content="Vaulted timber ceilings, stone walls, fully equipped kitchen, 3 bedrooms. From $185/night in St. Vincent." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/hero" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/rooms/superior-villa#webpage',
            url: 'https://stonetrailvillas.com/rooms/superior-villa',
            name: 'Superior Villa — Luxury 3-Bedroom Private Villa | Stonetrail Villas',
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
                name: 'Villas & Suites',
                item: 'https://stonetrailvillas.com/rooms'
              }, {
                '@type': 'ListItem',
                position: 3,
                name: 'Superior Villa',
                item: 'https://stonetrailvillas.com/rooms/superior-villa'
              }]
            }
          }, {
            '@type': 'HotelRoom',
            '@id': 'https://stonetrailvillas.com/rooms/superior-villa#room',
            name: 'Superior Villa',
            description: 'A 3-bedroom private luxury villa with vaulted timber ceilings, stone walls, open-plan living, and a fully equipped kitchen in St. Vincent and the Grenadines.',
            url: 'https://stonetrailvillas.com/rooms/superior-villa',
            image: ['https://stonetrailvillas.com/assets/superior-living1.JPG', 'https://stonetrailvillas.com/assets/superior-living4.JPG'],
            bed: [{
              '@type': 'BedDetails',
              typeOfBed: 'King size bed',
              numberOfBeds: 1
            }, {
              '@type': 'BedDetails',
              typeOfBed: 'Double bed',
              numberOfBeds: 2
            }],
            occupancy: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 4
            },
            amenityFeature: [{
              '@type': 'LocationFeatureSpecification',
              name: 'Private Villa',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Fully Equipped Kitchen',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Air Conditioning',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Free Wi-Fi',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Ocean View',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Private Garden',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Daily Housekeeping',
              value: true
            }],
            offers: {
              '@type': 'Offer',
              price: 185,
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: 185,
                priceCurrency: 'USD',
                unitText: 'night'
              },
              availability: 'https://schema.org/InStock',
              url: 'https://stonetrailvillas.com/book'
            },
            containedInPlace: {
              '@id': 'https://stonetrailvillas.com/#hotel'
            }
          }]
        })}</script>
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[75vh] min-h-[540px] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/assets/superior-living1.JPG')`
      }} initial={{
        scale: 1.05
      }} animate={{
        scale: 1
      }} transition={{
        duration: 9,
        ease: 'easeOut' as const
      }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E28]/90 via-[#1A2E28]/30 to-transparent" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6 lg:px-12 pb-16 w-full">
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.2
        }}>
            <Link to="/rooms" className="text-[9px] tracking-[0.3em] uppercase text-[#C8B89A]/70 hover:text-[#C8B89A] transition-colors duration-300 mb-5 inline-block">
              ← Villas &amp; Suites
            </Link>
          </motion.div>
          <motion.p initial={{
          opacity: 0,
          y: 14
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.7,
          delay: 0.3,
          ease: 'easeOut' as const
        }} className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">
            {superior_villa.hero.eyebrow}
          </motion.p>
          <motion.h1 initial={{
          opacity: 0,
          y: 22
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          delay: 0.5,
          ease: 'easeOut' as const
        }} className="font-heading text-5xl lg:text-6xl xl:text-7xl text-white leading-tight">
            {superior_villa.hero.heading}
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.8
        }} className="text-white/50 text-base mt-3 font-light italic">
            {superior_villa.hero.tagline}
          </motion.p>
        </div>
      </section>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <FadeUp>
                <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-5 font-medium">{superior_villa.overview.eyebrow}</p>
                <p className="text-[#1A2E28]/65 text-lg leading-relaxed font-light mb-6">
                  {superior_villa.overview.body1}
                </p>
                <p className="text-[#1A2E28]/55 text-base leading-relaxed font-light">
                  {superior_villa.overview.body2}
                </p>
              </FadeUp>
            </div>
            <div>
              <FadeUp delay={0.1}>
                <div className="bg-white p-8 space-y-0 border border-[#1A2E28]/8">
                  <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-6 font-medium">Villa Details</p>
                  {[{
                  label: 'Rate',
                  value: 'From $185 / night'
                }, {
                  label: 'Guests',
                  value: 'Up to 4 Guests'
                }, {
                  label: 'Bedrooms',
                  value: '2 Bedrooms'
                }, {
                  label: 'Size',
                  value: '900 sq ft'
                }, {
                  label: 'Kitchen',
                  value: 'Fully Equipped'
                }, {
                  label: 'Check-in',
                  value: '3:00 PM'
                }].map((item, i) => <div key={item.label} className={`flex justify-between py-4 ${i < 5 ? 'border-b border-[#1A2E28]/8' : ''}`}>
                      <span className="text-[10px] tracking-[0.2em] uppercase text-[#1A2E28]/35 font-medium">{item.label}</span>
                      <span className="text-sm text-[#1A2E28] font-light">{item.value}</span>
                    </div>)}
                  <div className="pt-6">
                    <Link to="/book" className="block w-full text-center px-8 py-4 bg-[#2C4A3E] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C8B89A] hover:text-[#1A2E28] transition-all duration-300">
                      Book This Villa
                    </Link>
                  </div>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────── */}
      <section id="gallery" className="py-20 lg:py-24 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-12">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">{superior_villa.gallery.eyebrow}</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">{superior_villa.gallery.heading}</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {images.map((img, i) => <FadeUp key={i} delay={i * 0.03}>
                <button onClick={() => setLightbox(i)} className="aspect-square overflow-hidden group w-full block focus:outline-none">
                  <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── AMENITIES ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-12">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">{superior_villa.amenities.eyebrow}</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">{superior_villa.amenities.heading}</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-l border-t border-[#1A2E28]/10">
            {amenities.map(item => <div key={item.label} className="border-r border-b border-[#1A2E28]/10 p-8 flex items-center gap-4 hover:bg-white transition-colors duration-300">
                <div className="w-9 h-9 border border-[#2C4A3E]/20 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-[#2C4A3E]" />
                </div>
                <p className="text-sm text-[#1A2E28]/65 font-light">{item.label}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* ── SHARE ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-muted border-t border-border">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <ShareButtons
            url="https://stonetrailvillas.com/rooms/superior-villa"
            title="Superior Villa — Stonetrail Villas, St. Vincent"
            description="3-bedroom private luxury villa with stunning Caribbean views at Stonetrail Villas."
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">{superior_villa.cta.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">{superior_villa.cta.heading}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
                {superior_villa.cta.primaryLabel}
              </Link>
              <Link to="/contact" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                {superior_villa.cta.secondaryLabel}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── LIGHTBOX ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox !== null && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={() => setLightbox(null)}>
            <button onClick={() => setLightbox(null)} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors z-10">
              <X size={24} />
            </button>
            <button onClick={e => {
          e.stopPropagation();
          prev();
        }} className="absolute left-4 lg:left-8 text-white/60 hover:text-white transition-colors z-10">
              <ChevronLeft size={36} />
            </button>
            <button onClick={e => {
          e.stopPropagation();
          next();
        }} className="absolute right-4 lg:right-8 text-white/60 hover:text-white transition-colors z-10">
              <ChevronRight size={36} />
            </button>
            <motion.img key={lightbox} initial={{
          opacity: 0,
          scale: 0.96
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.3
        }} src={images[lightbox].src} alt={images[lightbox].caption} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase">
              {images[lightbox].caption} — {lightbox + 1} / {images.length}
            </p>
          </motion.div>}
      </AnimatePresence>
    </>;
}
