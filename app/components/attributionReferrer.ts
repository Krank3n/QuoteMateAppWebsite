export const PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

const PLAY_STORE_PREFIX = 'https://play.google.com/store/apps/details';

/**
 * Play badges hardcode an organic install referrer, so a paid visitor's tap
 * reports utm_source=quotemateapp.au and erases the campaign
 * (marketing/ads-log.md finding 5). Given the stored first-touch attribution
 * payload (the `qm_attribution` JSON), returns the badge href with its
 * referrer swapped for the visitor's real params — or null when no rewrite
 * applies and the hardcoded organic default should stand.
 */
export function withAttributionReferrer(href: string, storedAttribution: string | null): string | null {
  if (!href.startsWith(PLAY_STORE_PREFIX) || !storedAttribution) return null;
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(storedAttribution);
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null) return null;
  const referrer = new URLSearchParams(
    PARAM_KEYS.flatMap((key) => {
      const value = payload[key];
      return typeof value === 'string' && value ? [[key, value] as [string, string]] : [];
    }),
  ).toString();
  if (!referrer) return null;
  const url = new URL(href);
  url.searchParams.set('referrer', referrer);
  return url.toString();
}
