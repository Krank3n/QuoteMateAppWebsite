/**
 * The real Google Play score for the homepage badge and its JSON-LD.
 *
 * The site is a static export, so this runs once per build: it reads the
 * public Play listing and pulls the aggregate rating out of the page's own
 * schema.org markup. A build must never fail or go blank because Play was
 * slow or changed its HTML, so any problem falls back to the last score we
 * verified by hand. The fallback is simply the most recent truth we have,
 * and the build log says which of the two a build used.
 */

/** Store link every Play CTA on the site uses (carries the website referrer). */
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU&referrer=utm_source%3Dquotemateapp.au%26utm_medium%3Dwebsite';

/** Public listing to scrape. No referrer here — this is a build-time read, not a click. */
const PLAY_LISTING_URL = 'https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU&gl=AU';

/** Last score read from the listing by hand. Update when the store moves. Verified 2026-09-17. */
export const FALLBACK_PLAY_RATING = { value: 4.857142925262451, count: 7 };

const FETCH_TIMEOUT_MS = 8000;

export type PlayRating = {
  /** Raw average, e.g. 4.857. */
  value: number;
  /** Number of ratings behind the average. */
  count: number;
  /** One-decimal display form, e.g. "4.9". */
  label: string;
  /** true when the value came from Google Play during this build. */
  live: boolean;
};

/** "4.857" → "4.9", 5 → "5.0". Never rounds above 5. */
export function formatRating(value: number): string {
  return Math.min(5, Math.max(0, value)).toFixed(1);
}

/**
 * Pull `ratingValue` / `ratingCount` from the listing's embedded JSON-LD.
 * Returns null on anything unparsable or out of range so callers fall back.
 */
export function parsePlayRating(html: string): { value: number; count: number } | null {
  const m = html.match(/"ratingValue"\s*:\s*"([\d.]+)"\s*,\s*"ratingCount"\s*:\s*"(\d+)"/);
  if (!m) return null;
  const value = Number(m[1]);
  const count = Number(m[2]);
  if (!Number.isFinite(value) || value <= 0 || value > 5) return null;
  if (!Number.isInteger(count) || count < 1) return null;
  return { value, count };
}

function build(raw: { value: number; count: number }, live: boolean): PlayRating {
  return { ...raw, label: formatRating(raw.value), live };
}

let inflight: Promise<PlayRating> | null = null;

/** Fetch once per process (i.e. once per build) and share the result. */
export function getPlayRating(): Promise<PlayRating> {
  if (!inflight) inflight = fetchPlayRating();
  return inflight;
}

async function fetchPlayRating(): Promise<PlayRating> {
  try {
    const res = await fetch(PLAY_LISTING_URL, {
      headers: {
        // Play serves a stripped page to unknown agents; a browser UA gets the JSON-LD.
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36',
        'accept-language': 'en-AU,en;q=0.9',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parsePlayRating(await res.text());
    if (!parsed) throw new Error('rating not found in listing HTML');
    console.log(`[playRating] live Google Play score ${formatRating(parsed.value)} from ${parsed.count} ratings`);
    return build(parsed, true);
  } catch (err) {
    console.warn(`[playRating] using fallback ${formatRating(FALLBACK_PLAY_RATING.value)} (${FALLBACK_PLAY_RATING.count}): ${err instanceof Error ? err.message : String(err)}`);
    return build(FALLBACK_PLAY_RATING, false);
  }
}
