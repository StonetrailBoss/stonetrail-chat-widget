import { useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Phone, Mail, MessageCircle, MapPin, Instagram, Facebook } from 'lucide-react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { contact } from 'virtual:content';

function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.75, ease: 'easeOut' as const, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const contactItems = [
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (784) 458-1000',
    href: 'tel:+17844581000',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@stonetrailvillas.com',
    href: 'mailto:info@stonetrailvillas.com',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+1 (784) 493-1800',
    href: 'https://wa.me/17844931800',
  },
  {
    icon: MapPin,
    label: 'Address',
    value: 'Indian Bay, Villa, St. Vincent and the Grenadines, VC0100',
    href: null,
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Enquiry',
    message: '',
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <Helmet>
        <title>Contact Stonetrail Villas — Reservations &amp; Concierge, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Contact Stonetrail Villas for reservations, concierge assistance, or general enquiries. Call, WhatsApp, or email us — we respond within 24 hours." />
        <link rel="canonical" href="https://stonetrailvillas.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/contact" />
        <meta property="og:title" content="Contact Stonetrail Villas — Reservations & Concierge" />
        <meta property="og:description" content="Contact Stonetrail Villas for reservations, concierge assistance, or general enquiries. Call, WhatsApp, or email us — we respond within 24 hours." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Stonetrail Villas — Reservations & Concierge" />
        <meta name="twitter:description" content="Reach our team for villa reservations, concierge assistance, or general enquiries. We respond within 24 hours." />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'ContactPage',
              '@id': 'https://stonetrailvillas.com/contact#webpage',
              name: 'Contact Stonetrail Villas',
              url: 'https://stonetrailvillas.com/contact',
              description: 'Contact Stonetrail Villas for reservations, concierge assistance, or general enquiries.',
              isPartOf: { '@id': 'https://stonetrailvillas.com/#website' },
              breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://stonetrailvillas.com/' },
                  { '@type': 'ListItem', position: 2, name: 'Contact', item: 'https://stonetrailvillas.com/contact' },
                ],
              },
            },
            {
              '@type': 'Hotel',
              '@id': 'https://stonetrailvillas.com/#hotel',
              name: 'Stonetrail Villas',
              url: 'https://stonetrailvillas.com',
              telephone: '+1(784) 458-1000',
              email: 'info@stonetrailvillas.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Indian Bay, Villa',
                addressLocality: 'Kingstown',
                addressRegion: 'St. Vincent',
                postalCode: 'VC0100',
                addressCountry: 'VC',
              },
              geo: { '@type': 'GeoCoordinates', latitude: 13.2528, longitude: -61.1971 },
              hasMap: 'https://maps.google.com/?q=13.2528,-61.1971',
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  telephone: '+1(784) 458-1000',
                  contactType: 'reservations',
                  availableLanguage: 'English',
                  hoursAvailable: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '08:00', closes: '20:00' },
                },
                {
                  '@type': 'ContactPoint',
                  email: 'info@stonetrailvillas.com',
                  contactType: 'customer support',
                  availableLanguage: 'English',
                },
                {
                  '@type': 'ContactPoint',
                  telephone: '+1(784) 458-1000',
                  contactType: 'customer service',
                  contactOption: 'TollFree',
                  availableLanguage: 'English',
                },
              ],
            },
          ],
        })}</script>
      </Helmet>

      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <section className="bg-[#1A2E28] pt-44 pb-24">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' as const }}
            className="text-[#C8B89A] text-[10px] tracking-[0.35em] uppercase mb-5 font-medium"
          >
            {contact.hero.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' as const }}
            className="font-heading text-5xl lg:text-6xl xl:text-7xl text-white leading-tight"
          >
            {contact.hero.heading}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-white/45 text-base mt-4 font-light max-w-md"
          >
            {contact.hero.subheading}
          </motion.p>
        </div>
      </section>

      {/* ── CONTACT DETAILS + FORM ───────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-16 lg:gap-24">

            {/* ── Left: info ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-12">
              <FadeUp>
                <p className="text-[#1A2E28]/60 text-base leading-relaxed font-light">
                  {contact.info.body}
                </p>
              </FadeUp>

              {/* Contact items */}
              <FadeUp delay={0.1}>
                <div className="space-y-0 border-t border-[#1A2E28]/10">
                  {contactItems.map((item) => {
                    const inner = (
                      <div className="flex items-start gap-5 py-6 border-b border-[#1A2E28]/10 group">
                        <div className="w-10 h-10 border border-[#2C4A3E]/20 flex items-center justify-center flex-shrink-0 group-hover:border-[#2C4A3E]/50 transition-colors duration-300">
                          <item.icon size={16} className="text-[#2C4A3E]" />
                        </div>
                        <div>
                          <p className="text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/35 mb-1 font-medium">{item.label}</p>
                          <p className="text-sm text-[#1A2E28]/75 group-hover:text-[#2C4A3E] transition-colors duration-300 font-light">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                    return item.href ? (
                      <a
                        key={item.label}
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={item.label}>{inner}</div>
                    );
                  })}
                </div>
              </FadeUp>

              {/* Social */}
              <FadeUp delay={0.2}>
                <div>
                  <p className="text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/35 mb-4 font-medium">{contact.info.followLabel}</p>
                  <div className="flex gap-3">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="w-10 h-10 border border-[#1A2E28]/15 flex items-center justify-center text-[#1A2E28]/40 hover:border-[#2C4A3E] hover:text-[#2C4A3E] transition-all duration-300"
                    >
                      <Instagram size={15} />
                    </a>
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="w-10 h-10 border border-[#1A2E28]/15 flex items-center justify-center text-[#1A2E28]/40 hover:border-[#2C4A3E] hover:text-[#2C4A3E] transition-all duration-300"
                    >
                      <Facebook size={15} />
                    </a>
                  </div>
                </div>
              </FadeUp>
            </div>

            {/* ── Right: form ────────────────────────────────────────────── */}
            <FadeUp delay={0.15} className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white border border-[#1A2E28]/8 p-14 text-center">
                  <div className="w-14 h-14 border border-[#2C4A3E]/30 flex items-center justify-center mx-auto mb-7">
                    <span className="font-heading text-2xl text-[#2C4A3E]">✓</span>
                  </div>
                  <h3 className="font-heading text-2xl text-[#1A2E28] mb-3">{contact.form.successHeading}</h3>
                  <p className="text-sm text-[#1A2E28]/55 leading-relaxed font-light">
                    {contact.form.successBody}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white p-10 lg:p-12 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/40 mb-2 font-medium">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full border border-[#1A2E28]/12 px-4 py-3 text-sm text-[#1A2E28] placeholder:text-[#1A2E28]/25 focus:outline-none focus:border-[#2C4A3E]/50 transition-colors bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/40 mb-2 font-medium">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="w-full border border-[#1A2E28]/12 px-4 py-3 text-sm text-[#1A2E28] placeholder:text-[#1A2E28]/25 focus:outline-none focus:border-[#2C4A3E]/50 transition-colors bg-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/40 mb-2 font-medium">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+1 (000) 000-0000"
                        className="w-full border border-[#1A2E28]/12 px-4 py-3 text-sm text-[#1A2E28] placeholder:text-[#1A2E28]/25 focus:outline-none focus:border-[#2C4A3E]/50 transition-colors bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/40 mb-2 font-medium">
                        Subject
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full border border-[#1A2E28]/12 px-4 py-3 text-sm text-[#1A2E28] focus:outline-none focus:border-[#2C4A3E]/50 transition-colors appearance-none bg-white"
                      >
                        <option>General Enquiry</option>
                        <option>Reservation Request</option>
                        <option>Concierge Services</option>
                        <option>Special Occasion</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] tracking-[0.3em] uppercase text-[#1A2E28]/40 mb-2 font-medium">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={6}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help you?"
                      className="w-full border border-[#1A2E28]/12 px-4 py-3 text-sm text-[#1A2E28] placeholder:text-[#1A2E28]/25 focus:outline-none focus:border-[#2C4A3E]/50 transition-colors resize-none bg-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#2C4A3E] text-white text-[10px] tracking-[0.25em] uppercase font-medium hover:bg-[#C8B89A] hover:text-[#1A2E28] transition-all duration-300"
                  >
                    {contact.form.submitLabel}
                  </button>
                </form>
              )}
            </FadeUp>
          </div>
        </div>
      </section>
    </>
  );
}
