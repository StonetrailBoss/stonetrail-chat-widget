import { Helmet } from '@dr.pogodin/react-helmet';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { careers_ceo_message } from 'virtual:content';

const SITE = 'https://stonetrailvillas.com';

export default function MessageFromCeoPage() {
  const url = `${SITE}/company/careers/message-from-ceo`;
  const c = careers_ceo_message;

  return (
    <>
      <Helmet>
        <title>{c.hero.heading} — Stonetrail Villas Careers</title>
        <meta name="description" content="A personal message from the founder and CEO of Stonetrail Villas on our mission, our people, and what it means to build a career in Caribbean hospitality." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${c.hero.heading} — Stonetrail Villas Careers`} />
        <meta property="og:description" content="A personal message from the founder and CEO of Stonetrail Villas on our mission, our people, and what it means to build a career in Caribbean hospitality." />
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
      </section>

      {/* Letter */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
            className="bg-card px-10 py-12 shadow-sm"
          >
            <p className="text-[10px] tracking-[0.25em] uppercase text-accent mb-8">
              {c.letter.eyebrow}
            </p>

            <div className="space-y-5 text-foreground/70 text-sm leading-[1.9]">
              {c.letter.paragraphs.map((para) => (
                <p key={para.id}>{para.text}</p>
              ))}
            </div>

            {/* Signature */}
            <div className="mt-10 pt-8 border-t border-border">
              <p className="font-heading text-2xl text-secondary font-light">{c.letter.signatureName}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-accent mt-1">
                {c.letter.signatureTitle}
              </p>
              <p className="text-[10px] tracking-[0.15em] text-foreground/40 mt-0.5">
                {c.letter.signatureLocation}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card py-16 px-6 text-center border-t border-border">
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
