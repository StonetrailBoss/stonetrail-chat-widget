import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { careers_landing } from 'virtual:content';

const SITE = 'https://stonetrailvillas.com';

export default function CareersPage() {
  const url = `${SITE}/company/careers`;
  const c = careers_landing;

  return (
    <>
      <Helmet>
        <title>Careers — Stonetrail Villas, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Join the team at Stonetrail Villas — a boutique Caribbean property in St. Vincent and the Grenadines. Explore our culture, open positions, and what it means to build a career here." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content="Careers — Stonetrail Villas" />
        <meta property="og:description" content="Join the team at Stonetrail Villas — a boutique Caribbean property in St. Vincent and the Grenadines." />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          name: 'Careers — Stonetrail Villas',
          url,
          isPartOf: { '@id': `${SITE}/#website` },
          about: { '@id': `${SITE}/#organization` },
        })}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-secondary pt-[160px] pb-20 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.6em' }}
          animate={{ opacity: 1, letterSpacing: '0.3em' }}
          transition={{ duration: 1, ease: 'easeOut' as const }}
          className="text-[10px] tracking-[0.3em] uppercase text-accent-foreground/70 mb-4"
        >
          {c.hero.eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' as const }}
          className="font-heading text-5xl md:text-6xl text-primary-foreground font-light"
        >
          {c.hero.heading}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' as const }}
          className="text-primary-foreground/50 text-sm mt-5 max-w-xl mx-auto leading-relaxed"
        >
          {c.hero.subheading}
        </motion.p>
      </section>

      {/* Intro */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-heading text-3xl md:text-4xl text-secondary font-light leading-snug mb-5">
            {c.intro.heading}
          </p>
          <p className="text-foreground/60 text-sm leading-relaxed">
            {c.intro.body}
          </p>
        </div>
      </section>

      {/* Section links */}
      <section className="bg-card py-16 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {c.links.map((link, i) => (
            <motion.div
              key={link.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: 'easeOut' as const }}
            >
              <Link
                to={link.href}
                className="group block h-full border border-border bg-background p-7 hover:border-primary transition-colors duration-300"
              >
                <h2 className="font-heading text-xl text-secondary font-light mb-2 group-hover:text-primary transition-colors duration-300">
                  {link.label}
                </h2>
                <p className="text-foreground/55 text-sm leading-relaxed mb-5">
                  {link.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-accent font-medium group-hover:gap-2.5 transition-all duration-300">
                  Explore <ArrowRight size={11} />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-secondary py-16 px-6 text-center">
        <p className="font-heading text-3xl text-primary-foreground font-light mb-3">
          {c.cta.heading}
        </p>
        <p className="text-primary-foreground/50 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
          {c.cta.body}
        </p>
        <a
          href={`mailto:${c.cta.email}?subject=Career Enquiry`}
          className="inline-flex items-center gap-2 px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-medium bg-accent text-accent-foreground hover:bg-primary transition-colors duration-300"
        >
          <span>{c.cta.label}</span> <ArrowRight size={13} />
        </a>
      </section>
    </>
  );
}
