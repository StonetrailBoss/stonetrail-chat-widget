export interface BlogPost {
  slug: string;
  title: string;
  publishedAt: string;
  published: boolean;
  tags: string[];
  excerpt: string;
  featuredImage: string;
  content: string;
}

// Vite's import.meta.glob for markdown files
// NOTE: files live in src/data/blog/ (NOT src/content/) to avoid the content-plugin guard
const modules = import.meta.glob('/src/data/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta: Record<string, unknown> = {};
  for (const line of match[1].split('\n')) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    let val: unknown = line.slice(colon + 1).trim();
    if (typeof val === 'string') {
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, ''));
      } else if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      } else {
        val = (val as string).replace(/^['"]|['"]$/g, '');
      }
    }
    meta[key] = val;
  }
  return { meta, body: match[2].trim() };
}

export function getAllPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const [path, raw] of Object.entries(modules)) {
    const slug = path.replace('/src/data/blog/', '').replace('.md', '');
    const { meta, body } = parseFrontmatter(raw);
    if (!meta.published) continue;
    posts.push({
      slug,
      title:        String(meta.title        ?? ''),
      publishedAt:  String(meta.publishedAt  ?? ''),
      published:    Boolean(meta.published),
      tags:         Array.isArray(meta.tags) ? (meta.tags as string[]) : [],
      excerpt:      String(meta.excerpt      ?? ''),
      featuredImage:String(meta.featuredImage ?? ''),
      content:      body,
    });
  }
  return posts.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}
