import { PARAM_KEYS } from './attributionReferrer';

export const CAMPAIGN_STORAGE_KEY = 'qm_attribution';
export interface CampaignAttribution extends Record<string, string> { landedAt: string }

function cleanParams(input: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(PARAM_KEYS.flatMap(key => {
    const value = input[key];
    return typeof value === 'string' && value.trim() ? [[key, value.trim().slice(0, 200)]] : [];
  }));
}

/** Validate existing data rather than allowing corrupt storage to block capture. */
export function firstCampaign(search: string, stored: string | null, now: Date): CampaignAttribution | null {
  try {
    const parsed = JSON.parse(stored || 'null');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const params = cleanParams(parsed);
      if (Object.keys(params).length) return { ...params, landedAt: typeof parsed.landedAt === 'string' ? parsed.landedAt : now.toISOString() };
    }
  } catch { /* retry with incoming params */ }
  const params = cleanParams(Object.fromEntries(new URLSearchParams(search)));
  return Object.keys(params).length ? { ...params, landedAt: now.toISOString() } : null;
}

/** Preserve the existing paid-campaign handoff, including new-tab clicks.
 * Organic sessions never receive synthetic UTMs. Only exact /app paths qualify. */
export function withAppAttribution(href: string, campaign: CampaignAttribution | null, origin: string): string {
  if (!campaign) return href;
  try {
    const url = new URL(href, origin);
    if (url.origin !== origin || !/^\/app(?:\/|$)/.test(url.pathname)) return href;
    for (const key of PARAM_KEYS) url.searchParams.delete(key);
    for (const [key, value] of Object.entries(cleanParams(campaign))) url.searchParams.set(key, value);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return href; }
}
