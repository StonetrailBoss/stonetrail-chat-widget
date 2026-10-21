import { useRef, useState } from 'react';
import { Link } from "react-router";
import { motion, useInView } from 'motion/react';
import { Plane, MapPin, Clock } from 'lucide-react';
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
const experiences = [{
  num: '01',
  slot: '/airo-assets/images/pages/destination/sailing',
  title: 'Sailing the Grenadines',
  description: 'Charter a private yacht and explore the 32 islands and cays of the Grenadines — from the Tobago Cays Marine Park to the pristine shores of Mustique and Bequia. Our concierge arranges full-day and multi-day sailing excursions tailored to your pace.',
  tag: 'On the Water'
}, {
  num: '02',
  slot: '/airo-assets/images/pages/destination/volcano',
  title: 'La Soufrière Volcano',
  description: "Hike to the summit of La Soufrière, one of the Caribbean's most dramatic active volcanoes. The trail winds through lush rainforest before opening to sweeping views of the island and beyond. A guided ascent is an unforgettable experience for the adventurous traveller.",
  tag: 'Adventure'
}, {
  num: '03',
  slot: '/airo-assets/images/pages/destination/dining',
  title: 'Local Dining & Culture',
  description: "St. Vincent's culinary scene is a celebration of fresh seafood, tropical produce, and Creole tradition. From beachside fish fries to intimate hillside restaurants, our concierge will guide you to the island's finest tables — and the most authentic local experiences.",
  tag: 'Food & Culture'
}];
const attractions = [{
  name: 'Tobago Cays Marine Park',
  type: 'Nature Reserve',
  distance: '45 min by boat'
}, {
  name: 'Bequia Island',
  type: 'Island Escape',
  distance: '30 min by ferry'
}, {
  name: 'Botanical Gardens',
  type: 'Heritage Site',
  distance: '15 min by car'
}, {
  name: 'Dark View Falls',
  type: 'Waterfall',
  distance: '40 min by car'
}, {
  name: 'Mustique',
  type: 'Private Island',
  distance: '25 min by plane'
}, {
  name: 'Kingstown Market',
  type: 'Local Culture',
  distance: '20 min by car'
}];
const arrival = [{
  icon: Plane,
  num: '01',
  title: 'By Air',
  desc: 'Fly into Argyle International Airport (SVD) with connections via Barbados, Trinidad, or Grenada. Regional carriers include LIAT, Caribbean Airlines, and InterCaribbean Airways.'
}, {
  icon: MapPin,
  num: '02',
  title: 'From the Airport',
  desc: 'Stonetrail Villas is approximately 25 minutes from Argyle Airport. We arrange private airport transfers for all guests — simply share your arrival details at booking.'
}, {
  icon: Clock,
  num: '03',
  title: 'Best Time to Visit',
  desc: 'The dry season (December–May) offers the finest weather. The quieter wet season (June–November) brings lush landscapes and lower rates — with most days still sunny.'
}];

// ── Carnival Video Trigger ────────────────────────────────────────────────────
function CarnivalVideoTrigger() {
  const [open, setOpen] = useState(false);
  return <>
      <CarnivalVideoModal open={open} onClose={() => setOpen(false)} />
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-[#2C4A3E] text-[11px] tracking-[0.2em] uppercase font-medium border-b border-[#C8B89A] pb-0.5 hover:text-[#8B7355] transition-colors duration-200 w-fit">
        
        Watch the Carnival video
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      </button>
    </>;
}
function CarnivalVideoModal({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={onClose}>
      
      <div className="relative w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
        <iframe className="w-full h-full" src="https://www.youtube.com/embed/P5bP2AOtUeU?autoplay=1&rel=0" title="Vincy Mas Carnival St. Vincent" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white text-[11px] tracking-[0.2em] uppercase flex items-center gap-2 transition-colors">
          
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          Close
        </button>
      </div>
    </div>;
}
export default function DestinationPage() {
  return <>
      <Helmet>
        <title>St. Vincent &amp; The Grenadines — Sailing, Hiking &amp; Caribbean Experiences | Stonetrail Villas</title>
        <meta name="description" content="Discover St. Vincent and the Grenadines: sail the Tobago Cays, hike La Soufrière volcano, explore Mustique and Bequia. Your guide to the best things to do in SVG, curated by Stonetrail Villas." />
        <link rel="canonical" href="https://stonetrailvillas.com/destination" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/destination" />
        <meta property="og:title" content="St. Vincent & The Grenadines — Sailing, Hiking & Caribbean Experiences" />
        <meta property="og:description" content="Sail the Tobago Cays, hike La Soufrière volcano, explore Mustique and Bequia. Your guide to the best things to do in SVG, curated by Stonetrail Villas." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/destination/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="St. Vincent & The Grenadines — Sailing, Hiking & Caribbean Experiences" />
        <meta name="twitter:description" content="Sail the Tobago Cays, hike La Soufrière, explore Mustique and Bequia. The best things to do in SVG, curated by Stonetrail Villas." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/destination/hero" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/destination#webpage',
            url: 'https://stonetrailvillas.com/destination',
            name: 'St. Vincent & The Grenadines — Sailing, Hiking & Caribbean Experiences',
            description: 'Discover St. Vincent and the Grenadines: sail the Tobago Cays, hike La Soufrière volcano, explore Mustique and Bequia.',
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
                name: 'The Destination',
                item: 'https://stonetrailvillas.com/destination'
              }]
            }
          }, {
            '@type': 'TouristDestination',
            '@id': 'https://stonetrailvillas.com/destination#svg',
            name: 'St. Vincent and the Grenadines',
            url: 'https://stonetrailvillas.com/destination',
            description: 'Discover St. Vincent and the Grenadines: sail the Tobago Cays, hike La Soufrière volcano, explore Mustique and Bequia.',
            touristType: ['Adventure', 'Luxury', 'Sailing', 'Nature', 'Romance'],
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 13.2528,
              longitude: -61.1971
            },
            containedInPlace: {
              '@type': 'Country',
              name: 'Saint Vincent and the Grenadines',
              sameAs: 'https://www.wikidata.org/wiki/Q757'
            },
            includesAttraction: [{
              '@type': 'TouristAttraction',
              name: 'Tobago Cays Marine Park',
              description: 'A protected marine park with pristine coral reefs, sea turtles, and crystal-clear waters — one of the Caribbean\'s finest sailing destinations.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 12.6333,
                longitude: -61.3500
              },
              touristType: ['Sailing', 'Snorkelling', 'Nature']
            }, {
              '@type': 'TouristAttraction',
              name: 'La Soufrière Volcano',
              description: 'The highest peak in the Eastern Caribbean at 1,234 metres — a dramatic hike through rainforest to the active volcanic crater.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.3333,
                longitude: -61.1833
              },
              touristType: ['Hiking', 'Adventure', 'Nature']
            }, {
              '@type': 'TouristAttraction',
              name: 'Mustique Island',
              description: 'An exclusive private island retreat favoured by royalty and celebrities, with pristine beaches and world-class villas.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 12.8833,
                longitude: -61.1833
              },
              touristType: ['Luxury', 'Beach', 'Privacy']
            }, {
              '@type': 'TouristAttraction',
              name: 'Bequia Island',
              description: 'A charming sailing hub with a rich maritime heritage, boutique restaurants, and some of the most beautiful anchorages in the Caribbean.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.0000,
                longitude: -61.2333
              },
              touristType: ['Sailing', 'Culture', 'Dining']
            }, {
              '@type': 'TouristAttraction',
              name: 'Falls of Baleine',
              description: 'A secluded 18-metre waterfall accessible only by boat, nestled in a lush rainforest gorge on the north coast of St. Vincent.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.3667,
                longitude: -61.2500
              },
              touristType: ['Nature', 'Adventure', 'Hiking']
            }, {
              '@type': 'TouristAttraction',
              name: 'Kingstown Market',
              description: 'The vibrant capital market of St. Vincent, offering fresh tropical produce, local crafts, and an authentic taste of Vincentian culture.',
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 13.1600,
                longitude: -61.2267
              },
              touristType: ['Culture', 'Shopping', 'Food']
            }]
          }]
        })}</script>
      </Helmet>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative h-[75vh] min-h-[560px] flex items-end overflow-hidden">
        <motion.div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/airo-assets/images/pages/destination/hero')`
      }} initial={{
        scale: 1.04
      }} animate={{
        scale: 1
      }} transition={{
        duration: 8,
        ease: 'easeOut' as const
      }} />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A2E28]/85 via-[#1A2E28]/20 to-transparent" />
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
            
            The Destination
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
            
            St. Vincent &amp;<br />The Grenadines
          </motion.h1>
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          duration: 0.8,
          delay: 0.7
        }} className="text-white/50 text-base mt-4 font-light max-w-md">
            
            32 islands and cays — one of the last unspoiled corners of the Caribbean
          </motion.p>
        </div>
      </section>

      {/* ── INTRO ────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-32 items-end">
            <FadeUp>
              <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">32 Islands &amp; Cays</p>
              <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] leading-tight">
                The Caribbean as It<br />Was Meant to Be
              </h2>
            </FadeUp>
            <FadeUp delay={0.15}>
              <p className="text-[#1A2E28]/60 text-base leading-relaxed font-light">
                St. Vincent and the Grenadines is one of the last unspoiled corners of the Caribbean — a chain of volcanic islands and coral cays where turquoise waters, lush rainforests, and warm island culture converge. Here, the pace is unhurried, the landscapes are extraordinary, and the sea is always close.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── ARRIVAL ──────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="border-t border-[#1A2E28]/10 py-20 lg:py-24">
            <FadeUp className="mb-14">
              <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">Getting Here</p>
              <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">Arrival &amp; Access</h2>
            </FadeUp>
            <div className="grid md:grid-cols-3 gap-0 border-l border-t border-[#1A2E28]/10">
              {arrival.map((item, i) => <FadeUp key={item.title} delay={i * 0.1}>
                  <div className="border-r border-b border-[#1A2E28]/10 p-8 lg:p-10 hover:bg-[#F5F0E8] transition-colors duration-300">
                    <p className="font-heading text-4xl text-[#2C4A3E]/15 mb-5 leading-none">{item.num}</p>
                    <div className="w-10 h-10 border border-[#2C4A3E]/20 flex items-center justify-center mb-5">
                      <item.icon size={17} className="text-[#2C4A3E]" />
                    </div>
                    <h3 className="font-heading text-xl text-[#1A2E28] mb-3">{item.title}</h3>
                    <p className="text-sm text-[#1A2E28]/55 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </FadeUp>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCES ──────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-36 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-16">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">Curated Experiences</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">Discover the Islands</h2>
          </FadeUp>

          <div className="space-y-28">
            {experiences.map((exp, i) => <FadeUp key={exp.title} delay={0.05}>
                <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-start ${i % 2 === 1 ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Image */}
                  <div className={`relative ${i % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                    <div className="aspect-[4/5] overflow-hidden group">
                      <img src={exp.slot} alt={exp.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    
                    </div>
                    <div className={`absolute -bottom-5 ${i % 2 === 1 ? '-left-5' : '-right-5'} w-1/2 h-1/2 border border-[#2C4A3E]/15 pointer-events-none`} />
                  
                  </div>

                  {/* Content */}
                  <div className={i % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-heading text-5xl text-[#2C4A3E]/15 leading-none">{exp.num}</span>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#8B7355] font-medium">{exp.tag}</span>
                    </div>
                    <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">{exp.title}</h3>
                    <p className="text-sm text-[#1A2E28]/60 leading-relaxed mb-8 font-light">{exp.description}</p>
                    <Link to="/contact" className="inline-flex items-center gap-3 text-[10px] tracking-[0.22em] uppercase font-medium text-[#2C4A3E] border-b border-[#8B7355] pb-0.5 hover:text-[#8B7355] transition-colors duration-300">
                    
                      Enquire with Concierge
                    </Link>
                  </div>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── PLACES & EVENTS ──────────────────────────────────────────────── */}
      <section className="py-24 lg:py-36 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-16">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">Culture &amp; Landmarks</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">Places &amp; Events</h2>
          </FadeUp>

          {/* ── La Soufrière ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-28">
            <FadeUp>
              <div className="aspect-[4/5] overflow-hidden group">
                <img src="/assets/la soufriere volcano.jpg" alt="La Soufrière Volcano eruption" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Natural Wonder</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">La Soufrière Volcano</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">
                La Soufrière is the most active volcano in the Eastern Caribbean and the highest peak in St. Vincent, rising to 1,234 metres. Its most recent major eruption in April 2021 sent an ash column more than 8 kilometres into the sky — a dramatic reminder of the island's volcanic origins. In quieter times, the summit trail rewards hikers with otherworldly crater views, steaming fumaroles, and sweeping panoramas across the Grenadines. A guided hike to the top is one of the most unforgettable experiences the island offers.
              </p>
            </FadeUp>
          </div>

          {/* ── Carnival ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-28 lg:grid-flow-dense">
            <FadeUp className="lg:col-start-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square overflow-hidden group">
                  <img src="/assets/carnival3.jpg" alt="Carnival masquerader" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="aspect-square overflow-hidden group">
                  <img src="/assets/carnival.jpg" alt="Carnival costume" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:col-start-1 lg:row-start-1">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Annual Festival</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">Vincy Mas — SVG Carnival</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light mb-6">
                Vincy Mas is St. Vincent and the Grenadines' premier cultural celebration — a two-week explosion of colour, music, and Vincentian pride held each June and July. The streets of Kingstown come alive with elaborately costumed masqueraders, pulsating soca and calypso, and the electrifying Grand Parade on Carnival Tuesday. Steelband competitions, calypso tents, and J'ouvert morning round out a festival that draws visitors from across the Caribbean and beyond. If your visit coincides with Carnival season, it is an experience not to be missed.
              </p>
              <a href="https://tourism.gov.vc/tourism/index.php/history-of-carnival" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#2C4A3E] text-[11px] tracking-[0.2em] uppercase font-medium border-b border-[#C8B89A] pb-0.5 hover:text-[#8B7355] transition-colors duration-200 w-fit mb-6">
                
                Read about the history of Carnival here
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </a>
              {/* Large video thumbnail */}
              <CarnivalVideoTrigger />
            </FadeUp>
          </div>

          {/* ── Christmas in SVG ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-28">
            <FadeUp>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square overflow-hidden group">
                  <img src="/assets/christmasi-in-svg-3.jpg" alt="Christmas lights in SVG" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="aspect-square overflow-hidden group">
                  <img src="/assets/christmasi-in-svg-4.jpg" alt="Christmas lights display" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Seasonal Celebration</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">Christmas in St. Vincent</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">
                Christmas in St. Vincent is a season of warmth, community, and spectacular light displays. Homes, gardens, and public spaces across the island are transformed with elaborate LED installations — from illuminated palm trees and glowing hedgerows to the iconic "I Love SVG" sign that draws visitors for photos throughout the festive season. Nine Mornings, a uniquely Vincentian tradition, sees early-morning street parties and cycling events in the days leading up to Christmas. The combination of tropical warmth, community spirit, and festive colour makes December one of the most magical times to visit.
              </p>
            </FadeUp>
          </div>

          {/* ── Bequia Regatta ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-28 lg:grid-flow-dense">
            <FadeUp className="lg:col-start-2">
              <div className="aspect-[4/3] overflow-hidden group">
                <img src="/assets/bequia regatta.jpeg" alt="Bequia Easter Regatta sailing boats" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:col-start-1 lg:row-start-1">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Sailing Event</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">Bequia Easter Regatta</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">
                Held every Easter weekend on the island of Bequia — just a 30-minute ferry ride from St. Vincent — the Bequia Easter Regatta is one of the Caribbean's most beloved sailing festivals. Traditional wooden workboats, sleek racing yachts, and colourful dinghies compete in waters that have been sailed for centuries. The beach at Port Elizabeth becomes a hub of music, food, and festivity as crews from across the region gather to race and celebrate. For sailing enthusiasts and casual visitors alike, the Regatta is a highlight of the Grenadines calendar.
              </p>
            </FadeUp>
          </div>

          {/* ── Fort Charlotte ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start mb-28">
            <FadeUp>
              <div className="aspect-[4/3] overflow-hidden group">
                <img src="/assets/fort charlotte.jpg" alt="Fort Charlotte cannon overlooking Kingstown" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Historic Landmark</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">Fort Charlotte</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">
                Perched 636 feet above sea level on a ridge north of Kingstown, Fort Charlotte is one of the finest historic sites in the Eastern Caribbean. Built by the British between 1763 and 1806 and named after Queen Charlotte, the fort commands sweeping views over Kingstown Harbour, the leeward coastline, and on clear days, the neighbouring islands of the Grenadines. Its cannons — unusually — face inland rather than out to sea, a testament to the fierce resistance of the indigenous Garifuna people. A visit to Fort Charlotte is both a history lesson and one of the most spectacular viewpoints on the island.
              </p>
            </FadeUp>
          </div>

          {/* ── Black Point Tunnel ── */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center lg:grid-flow-dense">
            <FadeUp className="lg:col-start-2">
              <div className="aspect-[4/3] overflow-hidden group">
                <img src="/assets/black point.jpg" alt="Black Point Tunnel interior" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
            </FadeUp>
            <FadeUp delay={0.1} className="lg:col-start-1 lg:row-start-1">
              <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-4 font-medium">Heritage Site</p>
              <h3 className="font-heading text-4xl lg:text-5xl text-[#1A2E28] mb-6 leading-tight">Black Point Tunnel</h3>
              <p className="text-sm text-[#1A2E28]/60 leading-relaxed font-light">
                The Black Point Tunnel is a remarkable feat of 18th-century engineering — a 91-metre hand-hewn tunnel carved through solid volcanic rock by enslaved workers and soldiers around 1815. Located on the windward coast near Byera, the tunnel was built to allow the transport of sugar cane from the fertile estates of the north to the mills and wharves of the south. Today it stands as a powerful reminder of the island's colonial history and the extraordinary labour that shaped it. Walking through the cool, dark passage and emerging on the black-sand beach beyond is a genuinely memorable experience.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── POINTS OF INTEREST ───────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <FadeUp className="mb-14">
            <p className="text-[#8B7355] text-[10px] tracking-[0.35em] uppercase mb-4 font-medium">Nearby</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-[#1A2E28]">Points of Interest</h2>
          </FadeUp>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-[#1A2E28]/10">
            {attractions.map((a, i) => <FadeUp key={a.name} delay={i * 0.07}>
                <div className="border-r border-b border-[#1A2E28]/10 p-8 hover:bg-[#F5F0E8] transition-colors duration-300 group">
                  <p className="text-[9px] tracking-[0.3em] uppercase text-[#8B7355] mb-3 font-medium">{a.type}</p>
                  <h4 className="font-heading text-xl text-[#1A2E28] mb-2 group-hover:text-[#2C4A3E] transition-colors duration-300">
                    {a.name}
                  </h4>
                  <p className="text-xs text-[#1A2E28]/40 font-light">{a.distance}</p>
                </div>
              </FadeUp>)}
          </div>
        </div>
      </section>

      {/* ── FULL-BLEED QUOTE ─────────────────────────────────────────────── */}
      <section className="relative py-32 lg:py-48 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('/airo-assets/images/pages/destination/sailing')`
      }} />
        
        <div className="absolute inset-0 bg-[#1A2E28]/75" />
        <div className="relative z-10 max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-6 font-medium">A World Apart</p>
            <blockquote className="font-heading text-3xl lg:text-4xl xl:text-5xl text-white leading-tight max-w-3xl mx-auto mb-10">
              "Where the finest hospitality meets breathtaking natural beauty"
            </blockquote>
            <Link to="/book" className="inline-block px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
              
              Book Your Stay
            </Link>
          </FadeUp>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#2C4A3E]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 text-center">
          <FadeUp>
            <p className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium">Begin Your Journey</p>
            <h2 className="font-heading text-4xl lg:text-5xl text-white mb-10">Ready to Explore?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book" className="px-10 py-4 bg-[#C8B89A] text-[#1A2E28] text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-white transition-all duration-300">
                
                Book Your Stay
              </Link>
              <Link to="/contact" className="px-10 py-4 border border-white/35 text-white text-[10px] tracking-[0.25em] uppercase font-light hover:border-[#C8B89A] hover:text-[#C8B89A] transition-all duration-300">
                
                Plan with Concierge
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>;
}
