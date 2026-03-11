'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('qm_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function hideBanner(value: string) {
    localStorage.setItem('qm_cookie_consent', value);
    setVisible(false);
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', 'cookie_consent', { action: value });
    }
  }

  return (
    <div className={`cookie-banner${visible ? ' visible' : ''}`} id="cookie-banner" role="dialog" aria-label="Cookie consent">
      <div className="cookie-content">
        <p>We use cookies to improve your experience. By continuing to use this site, you agree to our <Link href="/privacy">Privacy Policy</Link>.</p>
        <div className="cookie-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => hideBanner('declined')}>Decline</button>
          <button className="btn btn-primary btn-sm" onClick={() => hideBanner('accepted')}>Accept</button>
        </div>
      </div>
    </div>
  );
}
