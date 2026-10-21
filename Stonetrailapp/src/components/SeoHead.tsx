/**
 * SeoHead — injects page-level SEO metadata using React 19 native document tags.
 * Renders <title>, <meta name="description">, Open Graph, and Twitter Card tags.
 */

const SITE_NAME = 'Stonetrail Villas';
const SITE_URL = 'https://www.stonetrailsvg.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

interface SeoHeadProps {
  title: string;           // Full page title (will be used as-is)
  description: string;
  image?: string;          // Absolute URL for OG image
  url?: string;            // Canonical page path e.g. "/rooms"
  type?: 'website' | 'article';
}

export default function SeoHead({
  title,
  description,
  image = DEFAULT_IMAGE,
  url = '/',
  type = 'website',
}: SeoHeadProps) {
  const canonical = `${SITE_URL}${url}`;
  const ogImage = image.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}
