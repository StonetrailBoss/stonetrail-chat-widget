import { useState, useEffect } from 'react';
import { Link, useSearchParams } from "react-router";
import { Helmet } from '@dr.pogodin/react-helmet';
import { Check, Phone, Mail, ArrowRight, Star } from 'lucide-react';
import { motion } from 'motion/react';

// Campaign dates
const SALE_START = '2026-08-15T00:00:00Z';
const SALE_END = '2026-09-30T23:59:59Z';
const SITE = 'https://stonetrailvillas.com';
const PAGE_URL = `${SITE}/lp/book-direct`;
const OG_IMAGE = `${SITE}/airo-assets/images/pages/lp/book-direct-hero`;
function parseDateMs(raw: string): number | null {
  const t = new Date(raw).getTime();
  return Number.isNaN(t) ? null : t;
}
function getTimeLeft(targetDate: string) {
  if (!targetDate) return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: true
  };
  const end = parseDateMs(targetDate);
  if (end === null) return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: true
  };
  const diff = end - Date.now();
  if (diff <= 0) return {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: true
  };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor(diff / (1000 * 60 * 60) % 24),
    minutes: Math.floor(diff / (1000 * 60) % 60),
    seconds: Math.floor(diff / 1000 % 60),
    ended: false
  };
}
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);
  return timeLeft;
}
const benefits = [{
  title: 'Best Rate Guaranteed',
  desc: 'You will never find a lower rate anywhere else — booking direct is always the best price.'
}, {
  title: 'Personal Service',
  desc: 'Communicate directly with our team from your first enquiry to check-out. No call centres.'
}, {
  title: 'Flexible Arrangements',
  desc: 'Special requests, early check-in, late check-out — we can discuss it all when you book direct.'
}, {
  title: 'No Hidden Fees',
  desc: 'OTA platforms add service fees on top of the room rate. Booking direct means you pay exactly what we quote.'
}, {
  title: 'Complimentary Welcome',
  desc: 'Direct guests receive a complimentary welcome amenity on arrival — our small thank-you for choosing us.'
}, {
  title: 'Priority Availability',
  desc: 'Direct bookings get first access to our best villas and preferred dates before they appear on third-party sites.'
}];
const testimonials = [{
  name: 'Sarah & James',
  location: 'London, UK',
  text: 'We booked direct after reading about the best-rate guarantee. The team was incredibly helpful and the villa exceeded every expectation.',
  stars: 5
}, {
  name: 'Michael T.',
  location: 'Toronto, Canada',
  text: 'Stonetrail Villas responded to my enquiry within the hour. That personal touch made all the difference — we will always book direct from now on.',
  stars: 5
}, {
  name: 'The Andersons',
  location: 'New York, USA',
  text: 'Saved over $200 compared to what we saw on a booking platform. The welcome amenity was a lovely surprise. Highly recommend booking direct.',
  stars: 5
}];
const CountdownUnit = ({
  value,
  label
}: {
  value: number;
  label: string;
}) => <div className="flex flex-col items-center">
    <span className="font-mono text-3xl md:text-4xl font-light tabular-nums w-16 text-center text-accent">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[9px] tracking-[0.25em] uppercase text-foreground/40 mt-1">{label}</span>
  </div>;
const PageHelmet = () => <Helmet>
    <title>Book Direct &amp; Save — Stonetrail Villas | St. Vincent and the Grenadines</title>
    <meta name="description" content="Book directly with Stonetrail Villas for our best rate guaranteed, personalised service, and no hidden OTA fees. A boutique Caribbean retreat in St. Vincent." />
    <link rel="canonical" href={PAGE_URL} />
    <meta property="og:title" content="Book Direct & Save — Stonetrail Villas" />
    <meta property="og:description" content="Best rate guaranteed when you book direct. No OTA fees, personal service, and a complimentary welcome awaits." />
    <meta property="og:image" content={OG_IMAGE} />
    <meta property="og:url" content={PAGE_URL} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content={OG_IMAGE} />
  </Helmet>;
export default function BookDirectPage({
  startDate,
  endDate
}: {
  startDate?: string;
  endDate?: string;
}) {
  const [searchParams] = useSearchParams();
  const saleStart = startDate ? `${startDate}T00:00:00Z` : SALE_START;
  const saleEnd = endDate ? `${endDate}T23:59:59Z` : SALE_END;
  const effectiveSaleStart = (import.meta.env.VITE_PARENT_ORIGIN ? searchParams.get('__preview_start') : null) ?? saleStart;
  const effectiveSaleEnd = (import.meta.env.VITE_PARENT_ORIGIN ? searchParams.get('__preview_end') : null) ?? saleEnd;
  const now = Date.now();
  const startMs = effectiveSaleStart ? parseDateMs(effectiveSaleStart) : null;
  const endMs = effectiveSaleEnd ? parseDateMs(effectiveSaleEnd) : null;
  const hasStarted = startMs !== null ? now >= startMs : true;
  const hasEnded = endMs !== null ? now >= endMs : false;
  const saleCountdown = useCountdown(effectiveSaleEnd);
  const startCountdown = useCountdown(effectiveSaleStart);

  // ── SALE ENDED ────────────────────────────────────────────────────────────
  if (hasEnded) {
    return <>
        <PageHelmet />
        <section className="min-h-screen flex items-center justify-center bg-secondary">
          <div className="text-center px-6 py-20 max-w-lg">
            <img src="/assets/LogoW.png" alt="Stonetrail Villas" className="h-16 w-auto object-contain mx-auto mb-10 opacity-70" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-5">This offer has ended</p>
            <h1 className="font-heading text-4xl text-white font-light mb-6">Thank You for Your Interest</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-10">
              Our direct-booking offer has closed, but you can always get our best rate by contacting us directly.
            </p>
            <Link to="/book" className="inline-block px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary transition-all duration-300">
              Enquire Now
            </Link>
          </div>
        </section>
      </>;
  }

  // ── COMING SOON ───────────────────────────────────────────────────────────
  if (!hasStarted) {
    return <>
        <PageHelmet />
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        backgroundImage: `url(/airo-assets/images/pages/lp/book-direct-hero)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
          <div className="absolute inset-0 bg-secondary/90 pointer-events-none" />
          <div className="relative text-center px-6 py-20 max-w-xl">
            <img src="/assets/LogoW.png" alt="Stonetrail Villas" className="h-16 w-auto object-contain mx-auto mb-10 opacity-80" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-5">Something special is coming</p>
            <h1 className="font-heading text-5xl text-white font-light mb-4">Book Direct &amp; Save</h1>
            <p className="text-white/50 text-sm leading-relaxed mb-10">Our exclusive direct-booking offer launches in:</p>
            <div className="flex justify-center gap-6 mb-10">
              <CountdownUnit value={startCountdown.days} label="days" />
              <CountdownUnit value={startCountdown.hours} label="hours" />
              <CountdownUnit value={startCountdown.minutes} label="min" />
              <CountdownUnit value={startCountdown.seconds} label="sec" />
            </div>
            <Link to="/book" className="inline-block px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-light border border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300">
              Enquire Early
            </Link>
          </div>
        </section>
      </>;
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  return <>
      <PageHelmet />

      {/* Countdown Banner */}
      <div className="bg-accent py-2.5 text-center">
        <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-accent-foreground">
          Offer ends in{' '}
          <span className="font-mono font-semibold">
            {saleCountdown.days}d {String(saleCountdown.hours).padStart(2, '0')}h{' '}
            {String(saleCountdown.minutes).padStart(2, '0')}m {String(saleCountdown.seconds).padStart(2, '0')}s
          </span>
        </p>
      </div>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" style={{
      backgroundImage: `url(/airo-assets/images/pages/lp/book-direct-hero)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="absolute inset-0 bg-secondary/75 pointer-events-none" />
        <div className="relative text-center px-6 max-w-3xl mx-auto py-32">
          <motion.p initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          ease: 'easeOut' as const
        }} className="text-[10px] tracking-[0.35em] uppercase text-accent mb-6">
            Best Rate Guaranteed
          </motion.p>
          <motion.h1 initial={{
          opacity: 0,
          y: 16
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.7,
          delay: 0.1,
          ease: 'easeOut' as const
        }} className="font-heading text-5xl md:text-6xl lg:text-7xl text-white font-light leading-tight mb-6">
            Book Direct.<br />Stay Better.
          </motion.h1>
          <motion.p initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.7,
          delay: 0.2,
          ease: 'easeOut' as const
        }} className="text-white/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Skip the booking platforms and their fees. When you book directly with Stonetrail Villas, you get our best rate, personal service, and a complimentary welcome on arrival.
          </motion.p>
          <motion.div initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6,
          delay: 0.3,
          ease: 'easeOut' as const
        }} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
              Book Direct Now <ArrowRight size={14} />
            </Link>
            <a href="tel:+17844581000" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-light border border-white/40 text-white/70 hover:border-accent hover:text-accent transition-all duration-300">
              <Phone size={13} /> Call Us
            </a>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-4">Why Book Direct</p>
            <h2 className="font-heading text-4xl md:text-5xl text-secondary font-light">Six Reasons to Skip the Middleman</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => <motion.div key={b.title} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: i * 0.07,
            ease: 'easeOut' as const
          }} className="bg-card p-8 border border-border">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mb-5">
                  <Check size={14} className="text-primary-foreground" />
                </div>
                <h3 className="font-heading text-xl text-card-foreground font-semibold mb-3">{b.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-secondary py-20 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-5">Ready to Book?</p>
        <h2 className="font-heading text-4xl md:text-5xl text-white font-light mb-6">
          Your Caribbean Escape Awaits
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-md mx-auto">
          Contact us directly and we will match you with the perfect villa, confirm availability, and lock in your best rate — no platform fees, no surprises.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/book" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
            Book Direct Now <ArrowRight size={14} />
          </Link>
          <a href="mailto:reservations@stonetrailvillas.com" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-light border border-white/30 text-white/60 hover:border-white hover:text-white transition-all duration-300">
            <Mail size={13} /> Email Us
          </a>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-4">Guest Experiences</p>
            <h2 className="font-heading text-4xl md:text-5xl text-secondary font-light">What Our Direct Guests Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => <motion.div key={t.name} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: i * 0.1,
            ease: 'easeOut' as const
          }} className="bg-card p-8 border border-border">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({
                length: t.stars
              }).map((_, j) => <Star key={j} size={12} className="fill-accent text-accent" />)}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div>
                  <p className="text-card-foreground text-sm font-medium">{t.name}</p>
                  <p className="text-muted-foreground text-xs">{t.location}</p>
                </div>
              </motion.div>)}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6 text-center overflow-hidden" style={{
      backgroundImage: `url(/airo-assets/images/pages/lp/book-direct-hero)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center 40%'
    }}>
        <div className="absolute inset-0 bg-secondary/80 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-5">Stonetrail Villas</p>
          <h2 className="font-heading text-5xl md:text-6xl text-white font-light mb-6">Book Direct Today</h2>
          <p className="text-white/55 text-sm leading-relaxed mb-10">Indian Bay, Villa, St. Vincent and the Grenadines</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary-foreground hover:text-primary transition-all duration-300">
              Book Direct Now <ArrowRight size={14} />
            </Link>
            <a href="tel:+17844581000" className="inline-flex items-center gap-2 px-8 py-4 text-[10px] tracking-[0.25em] uppercase font-light border border-white/40 text-white/70 hover:border-accent hover:text-accent transition-all duration-300">
              <Phone size={13} /> +1 (784) 458-1000
            </a>
          </div>
        </div>
      </section>
    </>;
}
