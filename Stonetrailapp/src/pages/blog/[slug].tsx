import { useParams, Link, Navigate } from "react-router";
import { Helmet } from '@dr.pogodin/react-helmet';
import { getPostBySlug, getAllPosts } from '@/lib/blog';
import { ArrowLeft } from 'lucide-react';
import ShareButtons from '@/components/ShareButtons';
import { blog_post } from 'virtual:content';
const SITE = 'https://stonetrailvillas.com';
const FALLBACK_OG = `${SITE}/airo-assets/images/pages/home/hero`;

// Minimal markdown-to-HTML renderer (headings, paragraphs, bold, links, hr)
function renderMarkdown(md: string): string {
  return md.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>').replace(/^---$/gm, '<hr />').replace(/\n\n/g, '</p><p>').replace(/^(.+)$/gm, line => {
    if (/^<(h[1-6]|hr|ul|ol|li|blockquote)/.test(line)) return line;
    return line;
  }).replace(/^(?!<)(.+)/gm, '<p>$1</p>').replace(/<p><\/p>/g, '').replace(/<p>(<h[1-6]|<hr)/, '$1');
}
export default function BlogPostPage() {
  const {
    slug
  } = useParams<{
    slug: string;
  }>();
  const post = slug ? getPostBySlug(slug) : undefined;
  if (!post) return <Navigate to="/blog" replace />;
  const url = `${SITE}/blog/${post.slug}`;
  const htmlBody = renderMarkdown(post.content);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#webpage`,
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage ? `${SITE}${post.featuredImage}` : undefined,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    url,
    author: {
      '@type': 'Organization',
      name: 'Stonetrail Villas',
      url: `${SITE}/`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stonetrail Villas',
      url: `${SITE}/`
    },
    isPartOf: {
      '@id': `${SITE}/#website`
    },
    about: {
      '@id': `${SITE}/#organization`
    }
  };
  return <>
      <Helmet>
        <title>{post.title} — Stonetrail Villas</title>
        <meta name="description" content={post.excerpt} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.featuredImage && <meta property="og:image" content={`${SITE}${post.featuredImage}`} />}
        {!post.featuredImage && <meta property="og:image" content={FALLBACK_OG} />}
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        {post.featuredImage && <meta name="twitter:image" content={`${SITE}${post.featuredImage}`} />}
        {!post.featuredImage && <meta name="twitter:image" content={FALLBACK_OG} />}
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Hero */}
      {post.featuredImage && <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
          <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" fetchPriority="high" width={1200} height={630} />
          <div className="absolute inset-0 bg-secondary/60 pointer-events-none" />
        </div>}

      {/* Article */}
      <article className="bg-background py-16 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Back link */}
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-accent mb-10 hover:text-primary transition-colors duration-200">
            <ArrowLeft size={12} /> {blog_post.nav.backLabel}
          </Link>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mb-4">
            {post.tags.map(tag => <span key={tag} className="text-[9px] tracking-[0.2em] uppercase text-accent">{tag}</span>)}
          </div>

          {/* Title */}
          <h1 className="font-heading text-4xl md:text-5xl text-secondary font-light leading-tight mb-4">
            {post.title}
          </h1>

          {/* Date */}
          <time dateTime={post.publishedAt} className="text-xs text-muted-foreground mb-10 block">
            {new Date(post.publishedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
          </time>

          {/* Body */}
          <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed
              [&_h2]:font-heading [&_h2]:text-3xl [&_h2]:text-secondary [&_h2]:font-light [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:font-heading [&_h3]:text-xl [&_h3]:text-secondary [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-5 [&_p]:leading-relaxed
              [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary
              [&_strong]:text-secondary [&_strong]:font-semibold
              [&_hr]:border-border [&_hr]:my-10
              [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5
              [&_li]:mb-1" dangerouslySetInnerHTML={{
          __html: htmlBody
        }} />

          {/* Share buttons */}
          <div className="mt-12 pt-8 border-t border-border">
            <ShareButtons url={url} title={post.title} description={post.excerpt} />
          </div>

          {/* Back link footer */}
          <div className="mt-8">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-accent hover:text-primary transition-colors duration-200">
              <ArrowLeft size={12} /> {blog_post.nav.backFooterLabel}
            </Link>
          </div>
        </div>
      </article>

      {/* Related posts */}
      <RelatedPosts currentSlug={post.slug} />
    </>;
}
function RelatedPosts({
  currentSlug
}: {
  currentSlug: string;
}) {
  const related = getAllPosts().filter(p => p.slug !== currentSlug).slice(0, 2);
  if (related.length === 0) return null;
  return <section className="bg-muted py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-8">{blog_post.related.eyebrow}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {related.map(p => <Link key={p.slug} to={`/blog/${p.slug}`} className="group block">
              {p.featuredImage && <div className="overflow-hidden mb-4 aspect-[16/9]">
                  <img src={p.featuredImage} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={600} height={338} />
                </div>}
              <h3 className="font-heading text-xl text-secondary font-light leading-snug group-hover:text-primary transition-colors duration-200">{p.title}</h3>
            </Link>)}
        </div>
      </div>
    </section>;
}
