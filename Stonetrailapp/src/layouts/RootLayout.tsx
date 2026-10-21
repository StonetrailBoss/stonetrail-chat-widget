import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactElement } from 'react';

import Footer from '@/layouts/parts/Footer';
import Header from '@/layouts/parts/Header';
import Website from '@/layouts/Website';

/**
 * Root layout component that wraps all pages with consistent header and footer.
 *
 * To customize the header or footer, directly edit the Header.tsx and Footer.tsx
 * files in the layouts/parts directory.
 *
 * Site-wide <title> and <meta> live in the <Helmet> below. Individual pages can
 * override them by rendering their own <Helmet> — last-mounted wins.
 */
interface RootLayoutProps {
  children: ReactElement;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Website>
      <Helmet>
        <title>Stonetrail Villas — Private Luxury Villa Rental, St. Vincent &amp; The Grenadines</title>
        <meta name="description" content="Escape to Stonetrail Villas — a boutique collection of private luxury villas in St. Vincent and the Grenadines. Ocean views, tropical gardens, and personalised Caribbean hospitality." />
        <meta name="facebook-domain-verification" content="l73bj572ofzsayy0z1fo4l3actczco" />
        <script type="application/ld+json">{JSON.stringify([
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Stonetrail Villas',
            url: 'https://stonetrailvillas.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://stonetrailvillas.com/rooms?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Hotel',
            name: 'Stonetrail Villas',
            url: 'https://stonetrailvillas.com',
            logo: 'https://stonetrailvillas.com/assets/LogoW.png',
            telephone: '+1(784) 458-1000',
            email: 'info@stonetrailvillas.com',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'VC',
              addressRegion: 'St. Vincent',
              addressLocality: 'Indian Bay, Villa, St. Vincent and the Grenadines',
            },
            sameAs: ['https://www.stonetrailvillas.com'],
          },
        ])}</script>
      </Helmet>
      <Header />
      {children}
      <Footer />
    </Website>
  );
}
