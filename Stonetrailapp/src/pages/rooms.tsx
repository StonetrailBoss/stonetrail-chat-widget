import { useRef } from 'react';
import { Link } from "react-router";
import { motion, useInView } from 'motion/react';
import { Wifi, Wind, Car, Utensils, Star, Users } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { rooms as roomsContent } from 'virtual:content';
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
const rooms = [{
  slug: 'ocean-view-villa',
  detailPath: 'rooms/superior-villa',
  num: '01',
  name: 'Superior Villa',
  tagline: 'Vaulted ceilings, stone walls, and open-plan luxury',
  description: 'The Superior Villa is a masterclass in Caribbean craftsmanship — soaring vaulted timber ceilings, hand-laid stone walls, and an open-plan living and kitchen space that flows seamlessly to the outdoors. Multiple bedrooms, a fully equipped kitchen, and generous living areas make this villa ideal for families or groups.',
  rate: 'From $185 / night',
  guests: 'Up to 4 Guests',
  size: '900 sq ft',
  bedrooms: '2 Bedrooms',
  image: '/assets/superior-living1.JPG',
  amenities: ['Fully Equipped Kitchen', 'Vaulted Timber Ceilings', 'King Beds', 'Stone Wall Finishes', 'Air Conditioning'],
  featured: true
}, {
  slug: 'hillside-suite',
  detailPath: 'rooms/honeymoon-suite',
  num: '02',
  name: 'Honeymoon Suite',
  tagline: 'Romance, seclusion, and effortless luxury',
  description: 'The Honeymoon Suite is designed for couples seeking an intimate, deeply romantic escape. A freestanding soaking tub, walk-in rainfall shower, and private patio with rattan seating create an atmosphere of unhurried indulgence. The four-poster king bed and warm stone finishes set the tone for a deeply personal stay.',
  rate: 'From $165 / night',
  guests: '2 Guests',
  size: '510 sq ft',
  bedrooms: '1 Bedroom',
  image: '/assets/honeymoon rm1.JPG',
  amenities: ['Freestanding Soaking Tub', 'Private Patio', 'Four-Poster King Bed', 'Walk-in Rain Shower', 'Air Conditioning', 'Daily Housekeeping'],
  featured: false
}, {
  slug: 'garden-family-villa',
  detailPath: 'rooms/garden-family-villa',
  num: '03A',
  name: 'Garden Retreat — Family Villa',
  tagline: 'Spacious, lush, and designed for families',
  description: 'A generous open-plan villa with a fully equipped kitchen, marble island, multiple bedrooms, and a spacious living area — ideal for families or groups who want space without sacrificing style. Stone walls, arched niches, and warm tropical light give the villa a character that is unmistakably Stonetrail.',
  rate: 'From $168 / night',
  guests: 'Up to 4 Guests',
  size: '800 sq ft',
  bedrooms: '2 Bedrooms',
  image: '/assets/garden retreat family 5.JPG',
  amenities: ['Fully Equipped Kitchen', 'Stone Wall Finishes', 'Four-Poster King Beds', 'Open-Plan Living', 'Air Conditioning'],
  featured: false
}, {
  slug: 'garden-junior-suite',
  detailPath: 'rooms/garden-junior-suite',
  num: '03B',
  name: 'Garden Retreat — Junior Suite',
  tagline: 'Intimate, romantic, and beautifully appointed',
  description: 'A beautifully appointed suite with a four-poster king bed, signature blue kitchenette cabinetry, and a cosy living area with private patio access. Stone walls, arched niches, and warm tropical light create a space that feels entirely your own.',
  rate: 'From $155 / night',
  guests: '2 Guests',
  size: '600 sq ft',
  bedrooms: '1 Bedroom',
  image: '/assets/garden retreat Junior suite 10.JPG',
  amenities: ['Four-Poster King Bed', 'Blue Kitchenette', 'Private Patio Access', 'Stone Wall Finishes', 'Air Conditioning'],
  featured: false
}, {
  slug: 'presidential-suite',
  detailPath: 'rooms/presidential-suite',
  num: '04',
  name: 'Presidential Suite',
  tagline: 'The pinnacle of Caribbean luxury — nothing left to chance',
  description: 'The Presidential Suite is Stonetrail\'s most distinguished accommodation — a grand king bedroom, private sitting room, and dedicated dressing area combine to create an experience that is simply unmatched in the Grenadines. Reserved for guests who expect the very best, with a dedicated concierge and premium turndown service.',
  rate: 'From $185 / night',
  guests: '2 Guests',
  size: '800 sq ft',
  bedrooms: '1 Bedroom',
  image: '/assets/Presidential_bedroom.jpeg',
  amenities: ['Private Sitting Room', 'Dedicated Dressing Area', 'King Bed', 'Luxury Bathroom Suite', 'Dedicated Concierge', 'Premium Turndown Service'],
  featured: false
}, {
  slug: 'deluxe-king',
  detailPath: 'rooms/deluxe-king',
  num: '05',
  name: 'Deluxe King Room',
  tagline: 'Refined comfort with a signature Caribbean touch',
  description: 'The Deluxe King Room is a beautifully appointed retreat that blends premium comfort with the warmth of Caribbean craftsmanship. A plush king bed, refined finishes, and an en-suite bathroom create a space that is both elegant and deeply restful — ideal for couples or solo travellers.',
  rate: 'From $165 / night',
  guests: '2 Guests',
  size: '600 sq ft',
  bedrooms: '1 Bedroom',
  image: '/assets/deluxe king.jpg',
  amenities: ['King Bed', 'En-Suite Bathroom', 'Air Conditioning', 'High-Speed Wi-Fi', 'Concierge Service'],
  featured: false
}];
const sharedAmenities = [{
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
  icon: Users,
  label: 'Private Check-in'
}];
export default function RoomsPage() {
  return <>
      <Helmet>
        <title>Luxury Villa Rentals — Villas &amp; Suites | Stonetrail Villas, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Choose from six private luxury villas in St. Vincent and the Grenadines — Superior Villa, Honeymoon Suite, Garden Retreat, Presidential Suite, Deluxe King, and Garden Junior Suite. Concierge service included." />
        <link rel="canonical" href="https://stonetrailvillas.com/rooms" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/rooms" />
        <meta property="og:title" content="Luxury Villa Rentals — Villas & Suites | Stonetrail Villas" />
        <meta property="og:description" content="Six private luxury villas in St. Vincent and the Grenadines. Superior Villa, Honeymoon Suite, Presidential Suite and more. Concierge service included." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Luxury Villa Rentals | Stonetrail Villas, St. Vincent & The Grenadines" />
        <meta name="twitter:description" content="Six private luxury villas in St. Vincent and the Grenadines. Concierge service, ocean views, and personalised Caribbean hospitality." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/rooms/hero" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/rooms#webpage',
            url: 'https://stonetrailvillas.com/rooms',
            name: 'Luxury Villa Rentals — Villas & Suites | Stonetrail Villas',
            description: 'Seven private luxury villas in St. Vincent and the Grenadines with concierge service and ocean views.',
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
              }]
            }
          }, {
            '@type': 'ItemList',
            '@id': 'https://stonetrailvillas.com/rooms#list',
            name: 'Stonetrail Villas — Luxury Villa Rentals',
            url: 'https://stonetrailvillas.com/rooms',
            description: 'Seven private luxury villas in St. Vincent and the Grenadines with concierge service and ocean views.',
            numberOfItems: 7,
            itemListElement: [{
              '@type': 'ListItem',
              position: 1,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/superior-villa#room',
                name: 'Superior Villa',
                url: 'https://stonetrailvillas.com/rooms/superior-villa',
                description: '3-bedroom private villa with vaulted timber ceilings, stone walls, and ocean views.',
                image: 'https://stonetrailvillas.com/assets/superior-living1.JPG',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 4
                },
                priceRange: 'From $185/night'
              }
            }, {
              '@type': 'ListItem',
              position: 2,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/honeymoon-suite#room',
                name: 'Honeymoon Suite',
                url: 'https://stonetrailvillas.com/rooms/honeymoon-suite',
                description: 'Romantic 1-bedroom suite with four-poster king bed, soaking tub, and private patio.',
                image: 'https://stonetrailvillas.com/assets/honeymoon%20rm1.JPG',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 2
                },
                priceRange: 'From $165/night'
              }
            }, {
              '@type': 'ListItem',
              position: 3,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/garden-retreat#room',
                name: 'Garden Retreat',
                url: 'https://stonetrailvillas.com/rooms/garden-retreat',
                description: 'Lush tropical garden setting with Family Villa and Junior Suite options.',
                image: 'https://stonetrailvillas.com/assets/garden%20retreat%20family%205.JPG',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 6
                },
                priceRange: 'From $155/night'
              }
            }, {
              '@type': 'ListItem',
              position: 4,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/garden-family-villa#room',
                name: 'Garden Family Villa',
                url: 'https://stonetrailvillas.com/rooms/garden-family-villa',
                description: 'Spacious 2-bedroom family villa with open-plan living and fully equipped kitchen.',
                image: 'https://stonetrailvillas.com/assets/garden%20retreat%20family%205.JPG',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 4
                },
                priceRange: 'From $168/night'
              }
            }, {
              '@type': 'ListItem',
              position: 5,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/garden-junior-suite#room',
                name: 'Garden Junior Suite',
                url: 'https://stonetrailvillas.com/rooms/garden-junior-suite',
                description: 'Intimate 1-bedroom suite with kitchenette and private patio in a tropical garden.',
                image: 'https://stonetrailvillas.com/assets/garden%20retreat%20Junior%20suite%2010.JPG',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 2
                },
                priceRange: 'From $155/night'
              }
            }, {
              '@type': 'ListItem',
              position: 6,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/presidential-suite#room',
                name: 'Presidential Suite',
                url: 'https://stonetrailvillas.com/rooms/presidential-suite',
                description: 'Ultimate Caribbean luxury with private king bedroom and dedicated sitting room.',
                image: 'https://stonetrailvillas.com/assets/Presidential_bedroom.jpeg',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 2
                },
                priceRange: 'From $185/night'
              }
            }, {
              '@type': 'ListItem',
              position: 7,
              item: {
                '@type': 'HotelRoom',
                '@id': 'https://stonetrailvillas.com/rooms/deluxe-king#room',
                name: 'Deluxe King Room',
                url: 'https://stonetrailvillas.com/rooms/deluxe-king',
                description: 'Beautifully appointed king bedroom with premium finishes and en-suite bathroom.',
                image: 'https://stonetrailvillas.com/assets/deluxe%20king.jpg',
                occupancy: {
                  '@type': 'QuantitativeValue',
                  maxValue: 2
                },
                priceRange: 'From $165/night'
              }
            }]
          }]
        })}</script>
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[520px] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/assets/superior-living3.JPG')`
      }} initial={{
        scale: 1.04
      }} animate={{
        scale: 1
      }} transition={{
        duration: 8,
        ease: 'easeOut' as const
      }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E28]/85 via-[#1A2E28]/25 to-transparent" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6 lg:px-12 pb-16 w-full">
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
        }} className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">
            {roomsContent.hero.eyebrow}
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
            {roomsContent.hero.heading}
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.7
        }} className="text-white/50 text-base mt-4 font-light max-w-lg">
            {roomsContent.hero.subheading}
          </motion.p>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────────────── */}
      <section className="py-20 lg:py-24 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <FadeUp>
              <p className="text-[#1A2E28]/65 text-lg leading-relaxed font-light">
                {roomsContent.intro.body}
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── VILLA LISTINGS ───────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8] pb-28">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 space-y-28">
          {rooms.map((room, i) => <FadeUp key={room.slug} delay={0.05}>
              <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>

                {/* Image */}
                <div className={`relative ${i % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="aspect-[4/5] overflow-hidden group">
                    <img src={'image' in room && room.image ? room.image : ''} alt={`${room.name} — Stonetrail Villas`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103" />
                  </div>
                  {room.featured && <div className="absolute top-5 left-5 bg-[#2C4A3E] text-[#C8B89A] text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 font-medium">
                      Most Popular
                    </div>}
                  {/* Decorative offset frame */}
                  <div className={`absolute -bottom-5 ${i % 2 === 1 ? '-left-5' : '-right-5'} w-1/2 h-1/2 border border-[#2C4A3E]/15 pointer-events-none`} />
                </div>

                {/* Content */}
                <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  {/* Number + rate */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-heading text-5xl text-[#2C4A3E]/15 leading-none">{room.num}</span>
                    <span className="text-[10px] tracking-[0.2em] text-[#8B7355] font-medium uppercase">{room.rate}</span>
                  </div>

                  <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-2 leading-tight">{room.name}</h2>
                  <p className="text-[#8B7355] text-sm italic mb-6 font-light">{room.tagline}</p>

                  {/* Stats */}
                  <div className="flex gap-8 mb-7 pb-7 border-b border-[#1A2E28]/10">
                    {[{
                  label: 'Bedrooms',
                  value: room.bedrooms.split(' ')[0]
                }, {
                  label: 'Size',
                  value: room.size
                }, {
                  label: 'Guests',
                  value: room.guests
                }].map(stat => <div key={stat.label}>
                        <p className="text-[9px] tracking-[0.25em] uppercase text-[#1A2E28]/35 mb-1 font-medium">{stat.label}</p>
                        <p className="text-sm font-medium text-[#1A2E28]">{stat.value}</p>
                      </div>)}
                  </div>

                  <p className="text-sm text-[#1A2E28]/60 leading-relaxed mb-8 font-light">{room.description}</p>

                  {/* Amenities grid */}
                  <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 mb-10">
                    {room.amenities.map(a => <li key={a} className="flex items-center gap-2.5 text-xs text-[#1A2E28]/55 font-light">
                        <span className="text-[#8B7355] flex-shrink-0">—</span>
                        {a}
                      </li>)}
                  </ul>

                  <div className="flex items-center gap-6">
                    {/* @ts-expect-error — cb-book-now-button is a Cloudbeds custom element */}
                    <cb-book-now-button room_type="" property-code="XsjT4D" />
                    <Link to={`/${room.detailPath}`} className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#2C4A3E] border-b border-[#8B7355] pb-0.5 hover:text-[#8B7355] transition-colors duration-300">
                      View Gallery →
                    </Link>
                  </div>
                </div>
              </div>
            </FadeUp>)}
        </div>
      </section>

      {/* ── SHARED AMENITIES ─────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-16">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">{roomsContent.amenities.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">{roomsContent.amenities.heading}</h2>
          </FadeUp>

          {/* Numbered grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-l border-t border-[#1A2E28]/10">
            {sharedAmenities.map((item, i) => <FadeUp key={item.label} delay={i * 0.06}>
                <div className="border-r border-b border-[#1A2E28]/10 p-8 flex flex-col items-center text-center hover:bg-[#F5F0E8] transition-colors duration-300">
                  <div className="w-11 h-11 border border-[#2C4A3E]/20 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-[#2C4A3E]" />
                  </div>
                  <p className="text-sm text-[#1A2E28]/65 font-light">{item.label}</p>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── COMPARISON NOTE ──────────────────────────────────────────────── */}
      <section className="py-20 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-0 border border-[#1A2E28]/10">
            {rooms.map((room, i) => <div key={room.slug} className={`p-8 lg:p-10 ${i < rooms.length - 1 ? 'border-b md:border-b-0 md:border-r border-[#1A2E28]/10' : ''}`}>
                <p className="font-heading text-3xl text-[#2C4A3E]/20 mb-3">{room.num}</p>
                <h3 className="font-heading text-xl text-[#1A2E28] mb-1">{room.name}</h3>
                <p className="text-xs text-[#8B7355] mb-4 font-light">{room.guests} · {room.bedrooms}</p>
                <p className="text-sm font-medium text-[#1A2E28] mb-5">{room.rate}</p>
                {/* @ts-expect-error — cb-book-now-button is a Cloudbeds custom element */}
                <cb-book-now-button room_type="" property-code="XsjT4D" /> 
              </div>)}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">{roomsContent.cta.eyebrow}</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">{roomsContent.cta.heading}</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* @ts-expect-error — cb-book-now-button is a Cloudbeds custom element */}
              <cb-book-now-button room_type="" property-code="XsjT4D" />
              <Link to="/contact" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                {roomsContent.cta.secondaryLabel}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>;
}
