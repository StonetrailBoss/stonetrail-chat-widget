import { useState } from 'react';
import { Helmet } from '@dr.pogodin/react-helmet';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router';
import { ChevronDown, MapPin, Clock, ArrowRight } from 'lucide-react';
import { careers_opportunities } from 'virtual:content';

const SITE = 'https://stonetrailvillas.com';

type Job = typeof careers_opportunities.jobs[number];

function JobCard({ job }: { job: Job }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: 'easeOut' as const }}
      className="border border-border bg-card"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-8 py-7 flex items-start justify-between gap-4"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <p className="text-[9px] tracking-[0.25em] uppercase text-accent mb-1.5">
            {job.department}
          </p>
          <h3 className="font-heading text-2xl text-secondary font-light leading-snug">
            {job.title}
          </h3>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/45 tracking-wide">
              <Clock size={11} /> <span>{job.type}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-foreground/45 tracking-wide">
              <MapPin size={11} /> <span>{job.location}</span>
            </span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`flex-shrink-0 mt-1 text-foreground/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="overflow-hidden"
          >
            <div className="px-8 pb-8 border-t border-border pt-6 space-y-6">
              <p className="text-foreground/65 text-sm leading-relaxed">{job.summary}</p>

              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-accent mb-3">
                  Responsibilities
                </p>
                <ul className="space-y-2">
                  {job.responsibilities.map((r) => (
                    <li key={r.id} className="flex items-start gap-2.5 text-sm text-foreground/60 leading-relaxed">
                      <span className="mt-2 flex-shrink-0 w-1 h-1 rounded-full bg-accent" />
                      <span>{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase text-accent mb-3">
                  Requirements
                </p>
                <ul className="space-y-2">
                  {job.requirements.map((r) => (
                    <li key={r.id} className="flex items-start gap-2.5 text-sm text-foreground/60 leading-relaxed">
                      <span className="mt-2 flex-shrink-0 w-1 h-1 rounded-full bg-accent" />
                      <span>{r.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={`mailto:careers@stonetrailvillas.com?subject=Application — ${job.title}`}
                className="inline-flex items-center gap-2 px-7 py-3 text-[10px] tracking-[0.25em] uppercase font-medium bg-secondary text-secondary-foreground hover:bg-primary transition-colors duration-300"
              >
                Apply for this role <ArrowRight size={12} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CareerOpportunitiesPage() {
  const url = `${SITE}/company/careers/opportunities`;
  const c = careers_opportunities;

  return (
    <>
      <Helmet>
        <title>{c.hero.heading} — Stonetrail Villas</title>
        <meta name="description" content="Explore open positions at Stonetrail Villas in St. Vincent and the Grenadines. Join a boutique hospitality team committed to excellence, care, and Caribbean community." />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={`${c.hero.heading} — Stonetrail Villas`} />
        <meta property="og:description" content="Explore open positions at Stonetrail Villas in St. Vincent and the Grenadines." />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          name: `${c.hero.heading} — Stonetrail Villas`,
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
          className="text-primary-foreground/50 text-sm mt-5 max-w-md mx-auto leading-relaxed"
        >
          {c.hero.subheading}
        </motion.p>
      </section>

      {/* Jobs */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {c.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* No role fits? */}
      <section className="bg-card py-16 px-6 text-center border-t border-border">
        <p className="font-heading text-3xl text-secondary font-light mb-3">
          {c.speculative.heading}
        </p>
        <p className="text-foreground/55 text-sm mb-7 max-w-sm mx-auto leading-relaxed">
          {c.speculative.body}
        </p>
        <a
          href="mailto:careers@stonetrailvillas.com?subject=Speculative Application"
          className="inline-flex items-center gap-2 px-8 py-3.5 text-[10px] tracking-[0.25em] uppercase font-medium border border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
        >
          <span>{c.speculative.label}</span> <ArrowRight size={13} />
        </a>
      </section>

      {/* Back to careers */}
      <div className="bg-background py-8 px-6 text-center border-t border-border">
        <Link
          to="/company/careers"
          className="text-[10px] tracking-[0.2em] uppercase text-accent hover:text-secondary transition-colors duration-200"
        >
          ← Back to Careers
        </Link>
      </div>
    </>
  );
}
