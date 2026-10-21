import { useState, useRef } from 'react';
import { Link } from "react-router";
import ShareButtons from '@/components/ShareButtons';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Wifi, Wind, Car, Utensils, Star, UtensilsCrossed, Users } from 'lucide-react';
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
const images = [{
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
}, {
  icon: UtensilsCrossed,
  label: 'Fully Equipped Kitchen'
}, {
  icon: Users,
  label: 'Ideal for Families'
}];
export default function GardenFamilyVillaPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const prev = () => setLightbox(i => i !== null ? (i - 1 + images.length) % images.length : null);
  const next = () => setLightbox(i => i !== null ? (i + 1) % images.length : null);
  return <>
      <Helmet>
        <title>Garden Family Villa — 2-Bedroom Tropical Villa Rental | Stonetrail Villas, St. Vincent</title>
        <meta name="description" content="The Garden Family Villa at Stonetrail Villas — a spacious 2-bedroom open-plan villa with fully equipped kitchen, stone walls, and lush tropical garden setting. Ideal for families. From $168/night in St. Vincent." />
        <link rel="canonical" href="https://stonetrailvillas.com/rooms/garden-family-villa" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/rooms/garden-family-villa" />
        <meta property="og:title" content="Garden Family Villa — 2-Bedroom Tropical Villa | Stonetrail Villas" />
        <meta property="og:description" content="Spacious 2-bedroom open-plan villa with fully equipped kitchen and lush tropical garden. Ideal for families. From $168/night in St. Vincent." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/garden-retreat" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Garden Family Villa — 2-Bedroom Tropical Villa | Stonetrail Villas" />
        <meta name="twitter:description" content="Spacious 2-bedroom villa with tropical garden setting. Perfect for families visiting St. Vincent and the Grenadines. From $168/night." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/garden-retreat" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/rooms/garden-family-villa#webpage',
            url: 'https://stonetrailvillas.com/rooms/garden-family-villa',
            name: 'Garden Family Villa — Spacious 2-Bedroom Family Villa | Stonetrail Villas',
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
                name: 'Garden Family Villa',
                item: 'https://stonetrailvillas.com/rooms/garden-family-villa'
              }]
            }
          }, {
            '@type': 'HotelRoom',
            '@id': 'https://stonetrailvillas.com/rooms/garden-family-villa#room',
            name: 'Garden Family Villa',
            description: 'A spacious 2-bedroom family villa with open-plan living, fully equipped kitchen, and tropical garden setting in St. Vincent and the Grenadines.',
            url: 'https://stonetrailvillas.com/rooms/garden-family-villa',
            image: 'https://stonetrailvillas.com/assets/garden%20retreat%20family%205.JPG',
            bed: [{
              '@type': 'BedDetails',
              typeOfBed: 'King size bed',
              numberOfBeds: 1
            }, {
              '@type': 'BedDetails',
              typeOfBed: 'Double bed',
              numberOfBeds: 1
            }],
            occupancy: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 4
            },
            amenityFeature: [{
              '@type': 'LocationFeatureSpecification',
              name: 'Fully Equipped Kitchen',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Open-Plan Living',
              value: true
            }, {
              '@type': 'LocationFeatureSpecification',
              name: 'Private Tropical Garden',
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
              price: 168,
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: 168,
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
            Accommodations — 03A
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
            Garden Retreat<br />Family Villa
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.8
        }} className="text-white/50 text-base mt-3 font-light italic">
            Spacious, lush, and designed for families
          </motion.p>
        </div>
      </section>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-28 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2">
              <FadeUp>
                <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-5 font-medium">Overview</p>
                <p className="text-[#1A2E28]/65 text-lg leading-relaxed font-light mb-6">
                  The Garden Retreat Family Villa is a generous open-plan sanctuary designed for families and groups who want space without sacrificing style. Soaring stone walls, arched niches, and a marble kitchen island set the tone for a villa that feels both grand and deeply comfortable.
                </p>
                <p className="text-[#1A2E28]/55 text-base leading-relaxed font-light">
                  Multiple bedrooms, a fully equipped kitchen, and a spacious living area flow seamlessly together — perfect for gathering, cooking, and unwinding in the heart of the Caribbean.
                </p>
              </FadeUp>
            </div>
            <div>
              <FadeUp delay={0.1}>
                <div className="bg-white p-8 border border-[#1A2E28]/8">
                  <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-6 font-medium">Villa Details</p>
                  {[{
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
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">Photo Gallery</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">Inside the Family Villa</h2>
          </FadeUp>
          {/* Featured large + grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-2">
            <FadeUp className="col-span-2 row-span-2">
              <button onClick={() => setLightbox(0)} className="w-full h-full min-h-[320px] lg:min-h-[480px] overflow-hidden group block focus:outline-none">
                <img src={images[0].src} alt={images[0].caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </button>
            </FadeUp>
            {images.slice(1, 5).map((img, i) => <FadeUp key={i} delay={(i + 1) * 0.05}>
                <button onClick={() => setLightbox(i + 1)} className="aspect-square overflow-hidden group w-full block focus:outline-none">
                  <img src={img.src} alt={img.caption} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </button>
              </FadeUp>)}
          </div>
          {/* Remaining grid */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {images.slice(5).map((img, i) => <FadeUp key={i} delay={i * 0.03}>
                <button onClick={() => setLightbox(i + 5)} className="aspect-square overflow-hidden group w-full block focus:outline-none">
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
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-3 font-medium">Included</p>
            <h2 className="font-heading text-3xl lg:text-4xl text-[#1A2E28]">Villa Amenities</h2>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-l border-t border-[#1A2E28]/10">
            {amenities.map(item => <div key={item.label} className="border-r border-b border-[#1A2E28]/10 p-8 flex items-center gap-4 hover:bg-white transition-colors duration-300">
                <div className="w-9 h-9 border border-[#2C4A3E]/20 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-[#2C4A3E]" />
                </div>
                <p className="text-sm text-[#1A2E28]/65 font-light">{item.label}</p>
              </div>)}
          </div>
        </div>
      </section>

      {/* ── ALSO SEE ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-[#1A2E28]/8">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[9px] tracking-[0.35em] uppercase text-[#1A2E28]/35 mb-1 font-medium">Also in the Garden Retreat</p>
            <p className="font-heading text-2xl text-[#1A2E28]">Junior Suite — 03B</p>
            <p className="text-sm text-[#1A2E28]/50 font-light mt-1">Intimate, romantic, and beautifully appointed</p>
          </div>
          <Link to="/rooms/garden-junior-suite" className="px-8 py-3.5 border border-[#2C4A3E] text-[#2C4A3E] text-[10px] tracking-[0.22em] uppercase font-medium hover:bg-[#2C4A3E] hover:text-white transition-all duration-300 whitespace-nowrap">
            View Junior Suite
          </Link>
        </div>
      </section>

      {/* ── SHARE ────────────────────────────────────────────────────────── */}
      <section className="py-10 bg-muted border-t border-border">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <ShareButtons
            url="https://stonetrailvillas.com/rooms/garden-family-villa"
            title="Garden Family Villa — Stonetrail Villas, St. Vincent"
            description="2-bedroom tropical villa with lush garden views and Caribbean charm. Perfect for families."
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">Reserve Your Stay</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">Book the Family Villa</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
                Book Now
              </Link>
              <Link to="/rooms" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                View All Villas
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
