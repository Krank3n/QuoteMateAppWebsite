'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

/**
 * Ad-attribution bridge + Meta pixel (growth system §2/§3 —
 * marketing/fb-ads-growth-system-2026-07.md).
 *
 * 1. On landing with utm_, fbclid, or gclid params: stores them in sessionStorage
 *    under the key the web app reads (`qm_attribution` — the app is served
 *    same-origin at /app), and rewrites every internal /app link to carry the
 *    params, so middle-click/new-tab journeys keep attribution too. First
 *    touch wins: an existing stored payload is never overwritten.
 * 2. Meta pixel: loads ONLY when NEXT_PUBLIC_META_PIXEL_ID is set (fail-closed,
 *    same posture as FoundingPriceNote). Fires PageView on load and a
 *    SignupStart custom event on any /app link click — SignupStart is the
 *    campaign's optimization event (high-frequency upstream signal; completed
 *    signups stay the reporting truth in Firestore).
 */

import { PARAM_KEYS, withAttributionReferrer } from './attributionReferrer';

const STORAGE_KEY = 'qm_attribution';
// Pixel IDs are public (visible in any page source). Default to the QuoteMate
// dataset so the pixel survives build environments (e.g. DO App Platform)
// that don't carry the local .env; the env var stays as an override.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1714708188811919';

function collectParams(): Record<string, string> | null {
  const search = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of PARAM_KEYS) {
    const value = search.get(key)?.trim();
    if (value) out[key] = value.slice(0, 200);
  }
  return Object.keys(out).length ? out : null;
}

function fbq(...args: unknown[]) {
  const f = (window as any).fbq;
  if (typeof f === 'function') f(...args);
}

const CAPI_ENDPOINT = 'https://us-central1-hansendev.cloudfunctions.net/metaCapiTrack';

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Mirror a pixel event server-side (CAPI) with a shared event_id so Meta
 * dedupes browser+server into one. sendBeacon: fires even mid-navigation. */
function mirrorToCapi(eventName: string, eventId: string) {
  try {
    const body = JSON.stringify({
      eventName,
      eventId,
      url: window.location.href,
      fbc: readCookie('_fbc'),
      fbp: readCookie('_fbp'),
    });
    navigator.sendBeacon?.(CAPI_ENDPOINT, new Blob([body], { type: 'application/json' }));
  } catch {
    // analytics only — never interfere with the click
  }
}

export default function AttributionBridge() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;

  useEffect(() => {
    if (isAdmin) return;
    try {
      const params = collectParams();
      if (!params) return;

      // Hand-off via storage (same-origin /app reads this key).
      try {
        if (!sessionStorage.getItem(STORAGE_KEY)) {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...params, landedAt: new Date().toISOString() }),
          );
        }
      } catch {
        // storage blocked — the href rewrite below still carries the params
      }

      // Hand-off via URL: append params to internal /app links.
      const query = new URLSearchParams(params).toString();
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/app"]').forEach((a) => {
        const href = a.getAttribute('href')!;
        if (href.includes('utm_') || href.includes('fbclid')) return;
        a.setAttribute('href', href + (href.includes('?') ? '&' : '?') + query);
      });
    } catch {
      // attribution is best-effort; never break the page
    }
  }, [isAdmin, pathname]);

  // Play badges: swap the hardcoded organic referrer for stored first-touch
  // attribution at click time (delegated + capture, so late-rendered badges
  // like InstallSheet's are covered too). Organic visitors keep the default.
  useEffect(() => {
    if (isAdmin) return;
    const onClick = (e: MouseEvent) => {
      const badge = (e.target as Element | null)?.closest?.('a[href^="https://play.google.com/"]');
      if (!(badge instanceof HTMLAnchorElement)) return;
      try {
        const rewritten = withAttributionReferrer(badge.href, sessionStorage.getItem(STORAGE_KEY));
        if (rewritten) badge.href = rewritten;
      } catch {
        // attribution is best-effort; never interfere with the click
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isAdmin]);

  // SignupStart on /app CTA clicks (delegated so it survives re-renders).
  useEffect(() => {
    if (isAdmin || !PIXEL_ID) return;
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element | null)?.closest?.('a[href^="/app"]');
      if (anchor) {
        const eventId = `ss-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        fbq('trackCustom', 'SignupStart', {}, { eventID: eventId });
        mirrorToCapi('SignupStart', eventId);
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [isAdmin]);

  if (isAdmin || !PIXEL_ID) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  );
}
