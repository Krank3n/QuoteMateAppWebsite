'use client';

import { useEffect, useState } from 'react';

/**
 * Founding-member price note, driven by the live config/foundingOffer doc
 * (public read, written server-side by the aggregateEventFunnel cron in the
 * app repo). Renders nothing until the doc confirms the cap is still open —
 * same rule as the app paywall: no invented scarcity, and no founding
 * framing left on the page after the cap fills.
 *
 * The post-cap prices here mirror NEXT_PRICE_AUD in
 * QuoteMate/functions/src/foundingOffer.ts ($99/mo, $658/yr).
 */

const DOC_URL =
  'https://firestore.googleapis.com/v1/projects/hansendev/databases/(default)/documents/config/foundingOffer';

const NEXT_PRICE = { monthly: '$99/month', yearly: '$658/year' } as const;

interface FoundingStatus {
  cap: number;
  spotsLeft: number;
}

export default function FoundingPriceNote({
  period,
  variant = 'full',
}: {
  period: 'monthly' | 'yearly';
  variant?: 'full' | 'short';
}) {
  const [status, setStatus] = useState<FoundingStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(DOC_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => {
        if (cancelled || !doc?.fields) return;
        const f = doc.fields;
        const capActive = f.capActive?.booleanValue === true;
        const cap = Number(f.cap?.integerValue);
        const spotsLeft = Number(f.spotsLeft?.integerValue);
        if (capActive && Number.isFinite(cap) && Number.isFinite(spotsLeft) && spotsLeft > 0) {
          setStatus({ cap, spotsLeft });
        }
      })
      .catch(() => {
        // Unavailable → founding framing stays hidden. Never invent numbers.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) return null;

  if (variant === 'short') {
    return (
      <>
        Founding price, locked for life &mdash; goes to {NEXT_PRICE[period]} once the first{' '}
        {status.cap} spots fill.{' '}
      </>
    );
  }

  return (
    <>
      Founding member price &mdash; locked for life. Goes to {NEXT_PRICE[period]} for new members
      once the first {status.cap} spots fill ({status.spotsLeft} left).{' '}
    </>
  );
}
