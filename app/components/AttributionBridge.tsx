'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { withAttributionReferrer } from './attributionReferrer';
import { captureAcquisition } from './acquisition';
import { trackingAllowed } from './analyticsTracking';
import { CAMPAIGN_STORAGE_KEY, firstCampaign, withAppAttribution } from './campaignAttribution';

// Existing QuoteMate dataset; environment override remains supported.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1714708188811919';
const CAPI_ENDPOINT = 'https://us-central1-hansendev.cloudfunctions.net/metaCapiTrack';

function fbq(...args: unknown[]) {
  const f = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof f === 'function') f(...args);
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function mirrorToCapi(eventId: string) {
  try {
    const body = JSON.stringify({
      eventName: 'SignupStart', eventId,
      url: `${window.location.origin}${window.location.pathname}`,
      fbc: readCookie('_fbc'), fbp: readCookie('_fbp'),
    });
    navigator.sendBeacon?.(CAPI_ENDPOINT, new Blob([body], { type: 'application/json' }));
  } catch { /* analytics must never interrupt navigation */ }
}

/** Keep the product's legacy campaign contract, and capture organic first-touch
 * context separately. No internal organic UTMs or fabricated sign_up events. */
export default function AttributionBridge() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const allowed = !!pathname && trackingAllowed(pathname);
    setEnabled(allowed);
    if (!allowed) return;
    captureAcquisition();
    let stored: string | null = null;
    try { stored = sessionStorage.getItem(CAMPAIGN_STORAGE_KEY); } catch { /* blocked */ }
    const campaign = firstCampaign(window.location.search, stored, new Date());
    if (campaign) {
      try { sessionStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(campaign)); } catch { /* URL handoff still works */ }
    }
    const decorate = (anchor: HTMLAnchorElement) => {
      const href = anchor.getAttribute('href');
      if (href) anchor.setAttribute('href', withAppAttribution(href, campaign, window.location.origin));
    };
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(decorate);

    // Capture-phase delegation covers dynamically rendered links and modifier /
    // middle clicks. MutationObserver also covers context-menu "open in new tab".
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node instanceof HTMLAnchorElement) decorate(node);
        node.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(decorate);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const onClick = (e: MouseEvent) => {
      if (!trackingAllowed(window.location.pathname) || !(e.target instanceof Element)) return;
      const anchor = e.target.closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      decorate(anchor);
      try {
        const rewritten = withAttributionReferrer(anchor.href, campaign ? JSON.stringify(campaign) : null);
        if (rewritten) anchor.href = rewritten;
        const url = new URL(anchor.href);
        if (PIXEL_ID && (e.type === 'click' || e.button === 1) && url.origin === window.location.origin && /^\/app(?:\/|$)/.test(url.pathname)) {
          // This is an app-CTA click, NOT completed registration.
          const id = `ss-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
          fbq('trackCustom', 'SignupStart', {}, { eventID: id });
          mirrorToCapi(id);
        }
      } catch { /* malformed link / analytics failure */ }
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
      observer.disconnect();
    };
  }, [pathname]);

  if (!enabled || !PIXEL_ID) return null;
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
