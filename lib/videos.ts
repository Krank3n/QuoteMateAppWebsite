// Quote-template slugs that have a promo video published under
// /public/assets/videos/templates/<slug>.{mp4,webm} + <slug>-poster.jpg.
// Keep this in sync when publishing new template videos (drives the on-page
// player, the VideoObject schema, and the video sitemap entries).
export const TEMPLATES_WITH_VIDEOS = new Set<string>([
  // Reused from the strict-clean batch (exact-topic matches):
  'concrete-driveway-quote-template',
  'end-of-lease-cleaning-quote-template',
  'gutter-replacement-quote-template',
  'render-house-quote-template',
  'timber-floor-sanding-quote-template',
  'wardrobe-fitout-quote-template',
  'plasterboard-installation-quote-template',
  'termite-treatment-quote-template',
  // Orphan pages (niche videos with no base template — see lib/extraTemplates.ts):
  'power-point-installation-quote-template',
  'turf-laying-quote-template',
  'hedge-trimming-quote-template',
  'gutter-cleaning-quote-template',
  'leaf-guard-installation-quote-template',
  'cabinet-door-replacement-quote-template',
  'rodent-control-quote-template',
  'general-pest-control-quote-template',
  'fence-repair-quote-template',
  // Fresh website-keyed renders (each about its own topic):
  'bathroom-tiling-quote-template',
  'bathroom-waterproofing-quote-template',
  'carpet-cleaning-quote-template',
  'colorbond-fence-quote-template',
  'commercial-cleaning-quote-template',
  'concrete-slab-quote-template',
  'epoxy-floor-coating-quote-template',
  'ev-charger-installation-quote-template',
  'hot-water-system-replacement-quote-template',
  'painting-quote-template',
  'pergola-quote-template',
  'smoke-alarm-installation-quote-template',
  'split-system-installation-quote-template',
  'vinyl-plank-flooring-quote-template',
  'shower-screen-quote-template',
  'stump-grinding-quote-template',
]);

// Approx upload date for VideoObject schema (kept stable for static builds).
export const VIDEO_UPLOAD_DATE = '2026-06-23';

export const templateHasVideo = (slug: string): boolean => TEMPLATES_WITH_VIDEOS.has(slug);
