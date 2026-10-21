import { useState, useRef } from 'react';
import { Link } from "react-router";
import ShareButtons from '@/components/ShareButtons';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Wifi, Wind, Car, Utensils, Star } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
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
const familyImages = [{
  src: '/assets/garden retreat family 3.JPG',
  caption: 'Living room — marble island'
}, {
  src: '/assets/garden retreat family 4.JPG',
  caption: 'Kitchen island + living room'
}, {
  src: '/assets/garden retreat family 5.JPG',
  caption: 'Wide living room'
}, {
  src: '/assets/garden retreat family 6.JPG',
  caption: 'Kitchen — full cabinetry'
}, {
  src: '/assets/garden retreat family 7.JPG',
  caption: 'Living room — arched niches'
}, {
  src: '/assets/garden retreat family 8.JPG',
  caption: 'Living room — evening light'
}, {
  src: '/assets/garden retreat family 9.JPG',
  caption: 'Kitchen — bar stools'
}, {
  src: '/assets/garden retreat family 10.JPG',
  caption: 'Bathroom — walk-in shower'
}, {
  src: '/assets/garden retreat family 11.JPG',
  caption: 'Bathroom'
}, {
  src: '/assets/garden retreat family 12.JPG',
  caption: 'Kitchen island'
}, {
  src: '/assets/garden retreat family 13.JPG',
  caption: 'Open-plan living + kitchen'
}, {
  src: '/assets/garden retreat family 14.JPG',
  caption: 'Living area + kitchen'
}, {
  src: '/assets/garden retreat family 15.JPG',
  caption: 'Living room — TV niche'
}, {
  src: '/assets/garden retreat family 16.JPG',
  caption: 'Living room — stone walls'
}, {
  src: '/assets/garden retreat family 17.JPG',
  caption: 'Living area'
}, {
  src: '/assets/garden retreat family 18.JPG',
  caption: 'Living + kitchen'
}, {
  src: '/assets/garden retreat family 19.JPG',
  caption: 'Bedroom — four-poster king'
}, {
  src: '/assets/garden retreat family 20.JPG',
  caption: 'Bedroom — wide angle'
}, {
  src: '/assets/garden retreat family 21.JPG',
  caption: 'Living + kitchen from entry'
}, {
  src: '/assets/garden retreat family 22.JPG',
  caption: 'Kitchen counter'
}];
const juniorImages = [{
  src: '/assets/garden retreat Junior suite 10.JPG',
  caption: 'Bedroom — four-poster king'
}, {
  src: '/assets/garden retreat Junior suite 11.JPG',
  caption: 'Living room — blue armchairs'
}, {
  src: '/assets/garden retreat Junior suite 13.JPG',
  caption: 'Living room — wide angle'
}, {
  src: '/assets/garden retreat Junior suite 14.JPG',
  caption: 'Bedroom — four-poster'
}, {
  src: '/assets/garden retreat Junior suite 15.JPG',
  caption: 'Bedroom — natural light'
}, {
  src: '/assets/garden retreat Junior suite 16.JPG',
  caption: 'Kitchenette — blue cabinetry'
}, {
  src: '/assets/garden retreat Junior suite 17.JPG',
  caption: 'Bedroom'
}, {
  src: '/assets/garden retreat Junior suite 19.JPG',
  caption: 'Living room — patio doors'
}, {
  src: '/assets/garden retreat Junior suite 20.JPG',
  caption: 'Kitchenette'
}, {
  src: '/assets/garden retreat Junior suite 23.JPG',
  caption: 'Bedroom — four-poster'
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
export default function GardenRetreatPage() {
  const [lightbox, setLightbox] = useState<{
    set: 'family' | 'junior';
    index: number;
  } | null>(null);
  const activeImages = lightbox?.set === 'family' ? familyImages : juniorImages;
  const prev = () => setLightbox(l => l ? {
    ...l,
    index: (l.index - 1 + activeImages.length) % activeImages.length
  } : null);
  const next = () => setLightbox(l => l ? {
    ...l,
    index: (l.index + 1) % activeImages.length
  } : null);
  return <>
      <Helmet>
        <title>Garden Retreat — Family Villa &amp; Junior Suite | Stonetrail Villas, St. Vincent</title>
        <meta name="description" content="The Garden Retreat at Stonetrail Villas offers a spacious Family Villa and intimate Junior Suite, both featuring stone walls, open-plan living, and lush tropical garden settings in St. Vincent." />
        <link rel="canonical" href="https://stonetrailvillas.com/rooms/garden-retreat" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/rooms/garden-retreat" />
        <meta property="og:title" content="Garden Retreat — Family Villa & Junior Suite | Stonetrail Villas" />
        <meta property="og:description" content="Spacious Family Villa and intimate Junior Suite with stone walls, open-plan living, and lush tropical gardens in St. Vincent." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/garden-retreat" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/garden-retreat" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/rooms/garden-retreat#webpage',
            url: 'https://stonetrailvillas.com/rooms/garden-retreat',
            name: 'Garden Retreat — Tropical Garden Villas | Stonetrail Villas, St. Vincent',
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
                name: 'Garden Retreat',
                item: 'https://stonetrailvillas.com/rooms/garden-retreat'
              }]
            }
          }, {
            '@type': 'HotelRoom',
            '@id': 'https://stonetrailvillas.com/rooms/garden-retreat#room',
            name: 'Garden Retreat',
            description: 'The Garden Retreat at Stonetrail Villas offers a spacious Family Villa and intimate Junior Suite in a lush tropical garden setting in St. Vincent.',
            url: 'https://stonetrailvillas.com/rooms/garden-retreat',
            image: 'https://stonetrailvillas.com/assets/garden%20retreat%20family%205.JPG',
            occupancy: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 6
            },
            amenityFeature: [{
              '@type': 'LocationFeatureSpecification',
              name: 'Tropical Garden Setting',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Private Patio',
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
              name: 'Daily Housekeeping',
              value: true
            }],
            offers: {
              '@type': 'Offer',
              price: 155,
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: 155,
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
        backgroundImage: `url('/assets/garden retreat family 5.JPG')`
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
            Accommodations — 03
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
            Garden Retreat
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.8
        }} className="text-white/50 text-base mt-3 font-light italic">
            Family Villa &amp; Junior Suite — lush, private, and serene
          </motion.p>
        </div>
      </section>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-16">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-5 font-medium">Overview</p>
            <p className="text-[#1A2E28]/65 text-lg leading-relaxed font-light max-w-2xl">
              The Garden Retreat offers two distinct accommodations set within the same lush tropical garden setting — the spacious Family Villa and the intimate Junior Suite. Both share the same signature stone walls, arched niches, and open-plan design philosophy.
            </p>
          </FadeUp>

          {/* Two accommodation cards */}
          <div className="grid md:grid-cols-2 gap-0 border border-[#1A2E28]/10">
            {[{
            num: '03A',
            name: 'Family Villa',
            desc: 'A generous open-plan villa with a fully equipped kitchen, marble island, multiple bedrooms, and a spacious living area — ideal for families or groups.',
            details: [{
              label: 'Rate',
              value: 'From $168 / night'
            }, {
              label: 'Guests',
              value: 'Up to 4 Guests'
            }, {
              label: 'Bedrooms',
              value: '2 Bedrooms'
            }, {
              label: 'Size',
              value: '800 sq ft'
            }]
          }, {
            num: '03B',
            name: 'Junior Suite',
            desc: 'A beautifully appointed suite with a four-poster king bed, kitchenette with blue cabinetry, and a cosy living area with stone walls and patio access.',
            details: [{
              label: 'Rate',
              value: 'From $155 / night'
            }, {
              label: 'Guests',
              value: '2 Guests'
            }, {
              label: 'Bedrooms',
              value: '1 Bedroom'
            }, {
              label: 'Size',
              value: '600 sq ft'
            }]
          }].map((acc, i) => <FadeUp key={acc.num} delay={i * 0.1}>
                <div className={`p-10 lg:p-12 h-full ${i === 0 ? 'border-b md:border-b-0 md:border-r border-[#1A2E28]/10' : ''}`}>
                  <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-heading text-4xl text-[#2C4A3E]/15">{acc.num}</span>
                    <h2 className="font-heading text-2xl text-[#1A2E28]">{acc.name}</h2>
                  </div>
                  <p className="text-sm text-[#1A2E28]/55 leading-relaxed font-light mb-8">{acc.desc}</p>
                  <div className="space-y-0 border-t border-[#1A2E28]/10 mb-8">
                    {acc.details.map((d, j) => <div key={d.label} className={`flex justify-between py-3.5 ${j < acc.details.length - 1 ? 'border-b border-[#1A2E28]/8' : ''}`}>
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[#1A2E28]/35 font-medium">{d.label}</span>
                        <span className="text-sm text-[#1A2E28] font-light">{d.value}</span>
                      </div>)}
                  </div>
                  <Link to="/book" className="inline-block px-8 py-3.5 bg-[#2C4A3E] text-white text-[10px] tracking-[0.22em] uppercase font-medium hover:bg-[#C8B89A] hover:text-[#1A2E28] transition-all duration-300">
                    Book Now
                  </Link>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── FAMILY VILLA GALLERY ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-12">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">03A — Family Villa</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">Family Villa Gallery</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {familyImages.map((img, i) => <FadeUp key={i} delay={i * 0.02}>
                <button onClick={() => setLightbox({
              set: 'family',
              index: i
            })} className="aspect-square overflow-hidden group w-full block focus:outline-none">
                  <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── JUNIOR SUITE GALLERY ─────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-12">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">03B — Junior Suite</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">Junior Suite Gallery</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {juniorImages.map((img, i) => <FadeUp key={i} delay={i * 0.03}>
                <button onClick={() => setLightbox({
              set: 'junior',
              index: i
            })} className="aspect-square overflow-hidden group w-full block focus:outline-none">
                  <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── AMENITIES ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-12">
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">Included</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">Retreat Amenities</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-l border-t border-[#1A2E28]/10">
            {amenities.map(item => <div key={item.label} className="border-r border-b border-[#1A2E28]/10 p-8 flex items-center gap-4 hover:bg-[#F5F0E8] transition-colors duration-300">
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
            url="https://stonetrailvillas.com/rooms/garden-retreat"
            title="Garden Retreat — Stonetrail Villas, St. Vincent"
            description="Family villa and junior suite nestled in tropical gardens in St. Vincent and the Grenadines."
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">Reserve Your Stay</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">Book the Garden Retreat</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
                Book Now
              </Link>
              <Link to="/contact" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                Enquire
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
            <motion.img key={`${lightbox.set}-${lightbox.index}`} initial={{
          opacity: 0,
          scale: 0.96
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.3
        }} src={activeImages[lightbox.index].src} alt={activeImages[lightbox.index].caption} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs tracking-widest uppercase">
              {activeImages[lightbox.index].caption} — {lightbox.index + 1} / {activeImages.length}
            </p>
          </motion.div>}
      </AnimatePresence>
    </>;
}
