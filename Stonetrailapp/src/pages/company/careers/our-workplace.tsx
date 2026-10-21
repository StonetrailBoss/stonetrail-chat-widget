import { Link } from 'react-router';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { ArrowRight, Heart, Users, Leaf, Star, type LucideIcon } from 'lucide-react';
import { careers_our_workplace } from 'virtual:content';

const SITE = 'https://stonetrailvillas.com';

const valueIcons: LucideIcon[] = [Heart, Users, Leaf, Star];

export default function OurWorkplacePage() {
  const url = `${SITE}/company/careers/our-workplace`;
  const c = careers_our_workplace;

  return (
    <>
      <Helmet>
        <title>{c.hero.heading} — Stonetrail Villas Careers</title>
        <meta name="description" content="Discover what it is like to work at Stonetrail Villas — our values, culture, and the benefits that make us a great place to build a hospitality career in St. Vincent and the Grenadines." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${c.hero.heading} — Stonetrail Villas Careers`} />
        <meta property="og:description" content="Discover what it is like to work at Stonetrail Villas — our values, culture, and the benefits that make us a great place to build a hospitality career." />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          name: `${c.hero.heading} — Stonetrail Villas Careers`,
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
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-heading text-3xl md:text-4xl text-secondary font-light leading-snug mb-6">
            {c.intro.heading}
          </p>
          <p className="text-foreground/60 text-sm leading-relaxed">
            {c.intro.body}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-card py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-3 text-center">
            {c.values.eyebrow}
          </p>
          <h2 className="font-heading text-4xl text-secondary font-light text-center mb-14">
            {c.values.heading}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {c.values.items.map((v, i) => {
              const Icon = valueIcons[i] ?? Star;
              return (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' as const }}
                  className="flex gap-5"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/8 flex items-center justify-center mt-0.5">
                    <Icon size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl text-secondary font-light mb-2">{v.title}</h3>
                    <p className="text-foreground/55 text-sm leading-relaxed">{v.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="bg-secondary py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] tracking-[0.3em] uppercase text-accent-foreground/70 mb-3 text-center">
            {c.perks.eyebrow}
          </p>
          <h2 className="font-heading text-4xl text-primary-foreground font-light text-center mb-12">
            {c.perks.heading}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {c.perks.items.map((perk) => (
              <li key={perk.id} className="flex items-start gap-3 text-primary-foreground/65 text-sm leading-relaxed">
                <span className="mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-accent" />
                <span>{perk.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-16 px-6 text-center">
        <p className="font-heading text-3xl text-secondary font-light mb-6">
          {c.cta.heading}
        </p>
        <Link
          to="/company/careers/opportunities"
          className="inline-flex items-center gap-2 px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-medium bg-secondary text-secondary-foreground hover:bg-primary transition-colors duration-300"
        >
          <span>{c.cta.label}</span> <ArrowRight size={13} />
        </Link>
      </section>
    </>
  );
}
