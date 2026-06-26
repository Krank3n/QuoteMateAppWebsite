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
  // Reused from existing renders for base templates that priced short:
  'fence-quote-template',
  'led-downlight-installation-quote-template',
]);

// Trade slugs (/quotes-for-<slug>) with a promo video under
// /public/assets/videos/trades/<slug>.{mp4,webm} + <slug>-poster.jpg.
export const TRADES_WITH_VIDEOS = new Set<string>([
  // Original trade videos:
  'electricians', 'plumbers', 'carpenters',
  // Reusing a representative niche video as the trade demo:
  'painters', 'roofers', 'landscapers', 'tilers', 'concreters', 'pest-controllers',
  'cleaners', 'renderers', 'plasterers', 'cabinet-makers', 'hvac-technicians',
  'glaziers', 'fencers', 'flooring-installers', 'arborists', 'builders',
]);

// Approx upload date for VideoObject schema (kept stable for static builds).
// Must be a full, timezone-aware ISO 8601 datetime (Google Rich Results /
// VideoObject.uploadDate requirement). AEST is UTC+10:00.
export const VIDEO_UPLOAD_DATE = '2026-06-23T10:00:00+10:00';

export const templateHasVideo = (slug: string): boolean => TEMPLATES_WITH_VIDEOS.has(slug);
export const tradeHasVideo = (slug: string): boolean => TRADES_WITH_VIDEOS.has(slug);
