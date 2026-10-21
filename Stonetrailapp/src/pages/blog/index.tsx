import { Link } from "react-router";
import { Helmet } from '@dr.pogodin/react-helmet';
import { getAllPosts } from '@/lib/blog';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { blog_index } from 'virtual:content';
const SITE = 'https://stonetrailvillas.com';
export default function BlogIndexPage() {
  const posts = getAllPosts();
  return <>
      <Helmet>
        <title>Travel Journal — Stonetrail Villas | St. Vincent and the Grenadines</title>
        <meta name="description" content="Travel guides, booking tips, and stories from Stonetrail Villas — a boutique Caribbean retreat in St. Vincent and the Grenadines." />
        <link rel="canonical" href={`${SITE}/blog`} />
        <meta property="og:title" content="Travel Journal — Stonetrail Villas" />
        <meta property="og:description" content="Travel guides, booking tips, and stories from Stonetrail Villas." />
        <meta property="og:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <meta property="og:url" content={`${SITE}/blog`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`${SITE}/airo-assets/images/pages/home/hero`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${SITE}/blog#webpage`,
          name: 'Travel Journal — Stonetrail Villas',
          description: 'Travel guides, booking tips, and stories from Stonetrail Villas — a boutique Caribbean retreat in St. Vincent and the Grenadines.',
          url: `${SITE}/blog`,
          isPartOf: { '@id': `${SITE}/#website` },
          about: { '@id': `${SITE}/#organization` },
        })}</script>
      </Helmet>

      {/* Header */}
      <section className="bg-secondary pt-40 pb-20 px-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-accent mb-4">{blog_index.hero.eyebrow}</p>
        <h1 className="font-heading text-5xl md:text-6xl text-white font-light">{blog_index.hero.heading}</h1>
        <p className="text-white/50 text-sm mt-4 max-w-md mx-auto leading-relaxed">
          {blog_index.hero.subheading}
        </p>
      </section>

      {/* Posts */}
      <section className="bg-background py-20 px-6">
        <div className="max-w-4xl mx-auto">
          {posts.length === 0 ? <p className="text-center text-muted-foreground py-20">{blog_index.empty.text}</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {posts.map((post, i) => <motion.article key={post.slug} initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5,
            delay: i * 0.08,
            ease: 'easeOut' as const
          }} className="group">
                  <Link to={`/blog/${post.slug}`} className="block">
                    {post.featuredImage && <div className="overflow-hidden mb-5 aspect-[16/9]">
                        <img src={post.featuredImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading={i < 2 ? 'eager' : 'lazy'} width={800} height={450} />
                      </div>}
                    <div className="flex gap-2 flex-wrap mb-3">
                      {post.tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] tracking-[0.2em] uppercase text-accent">{tag}</span>)}
                    </div>
                    <h2 className="font-heading text-2xl text-secondary font-light leading-snug mb-3 group-hover:text-primary transition-colors duration-300">
                      {post.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-accent font-medium">
                      Read more <ArrowRight size={12} />
                    </span>
                  </Link>
                </motion.article>)}
            </div>}
        </div>
      </section>
    </>;
}
