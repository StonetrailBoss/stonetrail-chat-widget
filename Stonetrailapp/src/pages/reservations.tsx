import { Link } from "react-router";
import { Helmet } from '@dr.pogodin/react-helmet';
import { reservations } from 'virtual:content';
export default function BookPage() {
  return <>
      <Helmet>
        <title>Reservations — Stonetrail Villas, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Reserve your private luxury villa in St. Vincent and the Grenadines directly with Stonetrail Villas. Best rate guaranteed, complimentary welcome amenity, and dedicated concierge from booking to departure." />
        <link rel="canonical" href="https://stonetrailvillas.com/book" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://stonetrailvillas.com/book" />
        <meta property="og:title" content="Reservations — Stonetrail Villas" />
        <meta property="og:description" content="Reserve your private luxury villa in St. Vincent and the Grenadines directly. Best rate guaranteed, complimentary welcome amenity, and dedicated concierge." />
        <meta property="og:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <meta property="og:site_name" content="Stonetrail Villas" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://stonetrailvillas.com/airo-assets/images/pages/home/hero" />
        <script src="https://static1.cloudbeds.com/booking-engine/latest/static/js/immersive-experience/cb-immersive-experience.js" type="text/javascript" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [{
            '@type': 'WebPage',
            '@id': 'https://stonetrailvillas.com/book#webpage',
            url: 'https://stonetrailvillas.com/book',
            name: 'Reservations — Book a Luxury Villa | Stonetrail Villas',
            description: 'Reserve your private luxury villa in St. Vincent and the Grenadines directly with Stonetrail Villas. Best rate guaranteed.',
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
                name: 'Reservations',
                item: 'https://stonetrailvillas.com/book'
              }]
            }
          }, {
            '@type': 'ReserveAction',
            '@id': 'https://stonetrailvillas.com/book#action',
            name: 'Book a Luxury Villa at Stonetrail Villas',
            description: 'Reserve your private luxury villa in St. Vincent and the Grenadines directly. Best rate guaranteed, complimentary welcome amenity, and dedicated concierge.',
            url: 'https://stonetrailvillas.com/book',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: 'https://stonetrailvillas.com/book',
              actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
              inLanguage: 'en'
            },
            result: {
              '@type': 'LodgingReservation',
              name: 'Villa Reservation at Stonetrail Villas',
              reservationFor: {
                '@id': 'https://stonetrailvillas.com/#hotel'
              }
            },
            object: {
              '@id': 'https://stonetrailvillas.com/#hotel'
            },
            provider: {
              '@id': 'https://stonetrailvillas.com/#organization'
            },
            potentialAction: {
              '@type': 'CheckInAction',
              name: 'Check In',
              target: 'https://stonetrailvillas.com/book'
            }
          }]
        })}</script>
      </Helmet>

      {/* ── BOOKING WIDGET ───────────────────────────────────────────────── */}
      <section className="bg-[#F5F0E8]">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 pt-[160px] pb-16">
          <h1 className="sr-only">Reserve a Villa — Stonetrail Villas, St. Vincent &amp; The Grenadines</h1>
          {/* @ts-expect-error — cb-immersive-experience is a Cloudbeds custom element */}
          <cb-immersive-experience mode="standard" property-code="XsjT4D" />
        </div>
      </section>

      {/* ── POLICIES NOTE ────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-t border-[#1A2E28]/8">
        <div className="max-w-[1300px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#1A2E28]/40 font-light">
            {reservations.note.policyText}{' '}
            <Link to="/policies#cancellation" className="text-[#2C4A3E] border-b border-[#8B7355]/40 hover:text-[#8B7355] transition-colors duration-300">
              {reservations.note.policyLinkLabel}
            </Link>
            .
          </p>
          <p className="text-xs text-[#1A2E28]/40 font-light">
            {reservations.note.questionsText}{' '}
            <Link to="/contact" className="text-[#2C4A3E] border-b border-[#8B7355]/40 hover:text-[#8B7355] transition-colors duration-300">
              {reservations.note.questionsLinkLabel}
            </Link>
          </p>
        </div>
      </section>
    </>;
}
