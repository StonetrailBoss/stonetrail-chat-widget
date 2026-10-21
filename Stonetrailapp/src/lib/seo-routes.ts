/**
 * Auto-synced registry of publicly-crawlable routes. Consumed by the
 * /sitemap.xml handler in src/server/entry.ts.
 *
 * DO NOT add or remove paths by hand. Static paths are mirrored here from
 * src/routes.tsx automatically whenever that file is edited (any manual
 * path edit would be overwritten on the next routes.tsx change). For sync
 * to pick up a route, its `path` must be a literal string starting with "/";
 * template literals and identifier refs are skipped, and dynamic-param routes
 * like "/products/:id" are excluded.
 *
 * The only fields safe to hand-edit are the per-entry metadata below, after a
 * sync:
 * - `priority` (0.0–1.0): Home = 1.0, main sections = 0.8, deep pages = 0.5.
 * - `changefreq` and `lastmod`.
 */

export interface SeoRoute {
  path: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
  lastmod?: string;
}

export const seoRoutes: SeoRoute[] = [
  { path: "/lp", changefreq: "monthly", priority: 0.8 },
  { path: "/lp/book-direct", changefreq: "monthly", priority: 0.5 },
  { path: "/blog", changefreq: "monthly", priority: 0.8 },
  { path: "/book", changefreq: "weekly", priority: 0.9 },
  { path: "/rooms", changefreq: "weekly", priority: 0.9 },
  { path: "/rooms/superior-villa", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/honeymoon-suite", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/garden-retreat", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/garden-family-villa", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/garden-junior-suite", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/presidential-suite", changefreq: "monthly", priority: 0.8 },
  { path: "/rooms/deluxe-king", changefreq: "monthly", priority: 0.8 },
  { path: "/destination", changefreq: "monthly", priority: 0.8 },
  { path: "/about", changefreq: "monthly", priority: 0.7 },
  { path: "/contact", changefreq: "monthly", priority: 0.7 },
  { path: "/policies", changefreq: "yearly", priority: 0.4 },
  { path: "/company/careers", changefreq: "monthly", priority: 0.7 },
  { path: "/company/careers/our-workplace", changefreq: "monthly", priority: 0.6 },
  { path: "/company/careers/message-from-ceo", changefreq: "monthly", priority: 0.6 },
  { path: "/company/careers/opportunities", changefreq: "weekly", priority: 0.7 },
];
