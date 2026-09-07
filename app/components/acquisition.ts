export const ACQUISITION_KEY = 'qm_acquisition';
const COOKIE_MAX_AGE = 30 * 60;

export interface Acquisition {
  source: string;
  medium: string;
  landingPage: string;
  referrerHost: string;
  landedAt: string;
}

/** Only public marketing routes; never collect document, portal or auth URLs. */
export function isMarketingPath(path: string): boolean {
  return /^\/(?:$|(?:about|pricing|privacy|terms|trades|templates|articles|best|compare|alternatives|quoting|manage-jobs|get-paid|shower-quoting-tool)(?:\/[a-z0-9-]+)?\/?$|quotes-for-[a-z0-9-]+(?:\/[a-z0-9-]+)?\/?$|integrations\/reece(?:\/[a-z0-9-]+)?\/?$)/.test(path) && path.length <= 200;
}

function searchSource(host: string): string | null {
  // Explicit domains avoid attributing google.com.evil.test to Google.
  const google = ['google.com', 'google.com.au', 'google.co.nz', 'google.co.uk', 'google.ca', 'google.co.in', 'google.de'];
  if (google.some(domain => host === domain || host === `www.${domain}`)) return 'google';
  if (host === 'bing.com' || host === 'www.bing.com') return 'bing';
  if (host === 'duckduckgo.com' || host === 'www.duckduckgo.com') return 'duckduckgo';
  if (host === 'search.yahoo.com' || /^[a-z]{2}\.search\.yahoo\.com$/.test(host)) return 'yahoo';
  return null;
}

function safeLabel(value: string | null): string | null {
  return value && /^[a-z0-9_. -]{1,80}$/i.test(value) ? value.toLowerCase() : null;
}

export function inferAcquisition(href: string, referrer: string, now: Date): Acquisition | null {
  const url = new URL(href);
  if (!isMarketingPath(url.pathname)) return null;
  let referrerHost = '';
  try { referrerHost = new URL(referrer).hostname; } catch { /* no usable referrer */ }
  const internal = referrerHost === url.hostname || ['quotemateapp.au', 'www.quotemateapp.au'].includes(referrerHost);
  const search = !internal ? searchSource(referrerHost) : null;
  const params = url.searchParams;
  const source = safeLabel(params.get('utm_source'))
    || (params.has('gclid') ? 'google' : params.has('fbclid') ? 'facebook' : null)
    || (internal ? '(unknown)' : search || referrerHost || '(direct)');
  const medium = safeLabel(params.get('utm_medium'))
    || (params.has('gclid') || params.has('fbclid') ? 'paid' : null)
    || (params.has('utm_source') || params.has('utm_campaign') ? '(not set)' : null)
    || (internal ? '(not set)' : search ? 'organic' : referrerHost ? 'referral' : '(none)');
  return { source, medium, landingPage: url.pathname, referrerHost: internal ? '' : referrerHost, landedAt: now.toISOString() };
}

export function parseAcquisition(raw: string | null): Acquisition | null {
  try {
    const p = JSON.parse(raw || 'null');
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    if (!['source', 'medium', 'landingPage', 'referrerHost', 'landedAt'].every(key => typeof p[key] === 'string')) return null;
    if (!isMarketingPath(p.landingPage) || !Number.isFinite(Date.parse(p.landedAt))) return null;
    if (!/^[a-z0-9_. ()-]{1,253}$/i.test(p.source) || !/^[a-z0-9_. ()-]{1,80}$/i.test(p.medium)) return null;
    if (p.referrerHost && !/^[a-z0-9.-]{1,253}$/i.test(p.referrerHost)) return null;
    // Reconstruct the allowlist, never forward arbitrary extra payload fields.
    return { source: p.source, medium: p.medium, landingPage: p.landingPage, referrerHost: p.referrerHost, landedAt: p.landedAt };
  } catch { return null; }
}

export function readAcquisition(): Acquisition | null {
  try {
    const stored = parseAcquisition(sessionStorage.getItem(ACQUISITION_KEY));
    if (stored) return stored;
  } catch { /* storage blocked */ }
  try {
    const raw = document.cookie.split('; ').find(c => c.startsWith(`${ACQUISITION_KEY}=`))?.slice(ACQUISITION_KEY.length + 1);
    return raw ? parseAcquisition(decodeURIComponent(raw)) : null;
  } catch { return null; }
}

/** Same-origin cookie carries context into noopener/new-tab journeys without
 * inventing organic UTMs. The product's legacy qm_attribution contract is left
 * untouched; account-level persistence of these extra fields is a separate task. */
export function captureAcquisition(): Acquisition | null {
  if (!isMarketingPath(window.location.pathname)) return null;
  const acquisition = readAcquisition() || inferAcquisition(window.location.href, document.referrer, new Date());
  if (!acquisition) return null;
  const raw = JSON.stringify(acquisition);
  try { sessionStorage.setItem(ACQUISITION_KEY, raw); } catch { /* best effort */ }
  // Keep the ORIGINAL expiry; navigating between pages must not renew first touch.
  const age = Math.max(0, (Date.now() - Date.parse(acquisition.landedAt)) / 1000);
  const remaining = Math.max(0, Math.floor(COOKIE_MAX_AGE - age));
  if (remaining > 0) {
    try {
      document.cookie = `${ACQUISITION_KEY}=${encodeURIComponent(raw)};path=/;max-age=${remaining};SameSite=Lax${window.location.protocol === 'https:' ? ';Secure' : ''}`;
    } catch { /* cookies blocked; session storage may still work */ }
  }
  return acquisition;
}
