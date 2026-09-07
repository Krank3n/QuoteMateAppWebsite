'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { GA_ID, initialiseAnalytics, setAnalyticsDisabled, startPageTracking, trackingAllowed } from './analyticsTracking';

export default function Analytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const allowed = !!pathname && trackingAllowed(pathname);
    setAnalyticsDisabled(!allowed);
    setEnabled(allowed);
    if (!allowed || !pathname) {
      lastTrackedPath.current = null;
      return;
    }
    initialiseAnalytics();
    const cleanup = startPageTracking(pathname, lastTrackedPath.current !== pathname);
    lastTrackedPath.current = pathname;
    return cleanup;
  }, [pathname]);

  if (!enabled) return null;
  // GA's existing enhanced-measurement configuration owns page_view events.
  // Do not also send a manual page_view on every route and double-count them.
  return <Script id="qm-ga-library" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />;
}
