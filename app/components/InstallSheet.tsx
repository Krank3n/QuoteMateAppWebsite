'use client';

import { useEffect, useRef, useState } from 'react';

type Platform = 'ios' | 'android' | null;

// hidden: nothing shown yet (waiting for the scroll trigger)
// sheet:  full bottom sheet with backdrop
// bar:    minimized sticky footer (after the sheet is closed)
type Mode = 'hidden' | 'sheet' | 'bar';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent || navigator.vendor || '';
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return null;
}

export default function InstallSheet() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [mode, setMode] = useState<Mode>('hidden');
  const triggered = useRef(false);

  // Don't auto-open until the visitor has scrolled past the videos (hero intro
  // + walkthrough). The walkthrough section is the last video on the page, so
  // once its bottom edge clears the top of the viewport, show the sheet — or
  // just the minimized bar if it was already dismissed this session.
  useEffect(() => {
    const detected = detectPlatform();
    if (!detected) return;
    setPlatform(detected);

    const fire = () => {
      if (triggered.current) return;
      triggered.current = true;
      setMode(sessionStorage.getItem('install-sheet-dismissed') ? 'bar' : 'sheet');
    };

    const marker = document.getElementById('walkthrough');
    if (!marker) {
      // Non-homepage / markup changed: fall back to the old delayed open.
      const timer = setTimeout(fire, 2000);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
            fire();
            observer.disconnect();
          }
        }
      },
      { threshold: 0 }
    );
    observer.observe(marker);
    return () => observer.disconnect();
  }, []);

  // Let the hero CTAs open the sheet on demand (fired from EngHomeClient on
  // mobile). An explicit tap opens the full sheet even if it was dismissed.
  useEffect(() => {
    const open = () => {
      const detected = detectPlatform();
      if (!detected) return; // no native app to install (e.g. desktop)
      setPlatform(detected);
      triggered.current = true;
      setMode('sheet');
    };
    window.addEventListener('qm:open-install', open);
    return () => window.removeEventListener('qm:open-install', open);
  }, []);

  // Flag the sticky bar on <html> so other fixed-bottom UI can clear it —
  // SupportChat.module.css lifts the chat launcher above the bar while this
  // class is present.
  useEffect(() => {
    document.documentElement.classList.toggle('qm-install-bar-visible', mode === 'bar');
    return () => document.documentElement.classList.remove('qm-install-bar-visible');
  }, [mode]);

  // Closing the sheet minimizes it to the sticky footer bar instead of
  // removing it; the session flag means later page loads skip straight to
  // the bar once the scroll trigger fires.
  const minimize = () => {
    setMode('bar');
    sessionStorage.setItem('install-sheet-dismissed', '1');
  };

  const expand = () => setMode('sheet');

  if (!platform) return null;

  const storeLink = platform === 'ios'
    ? 'https://apps.apple.com/au/app/quotemate/id6754000046?pt=128219706&ct=website&mt=8'
    : 'https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU&referrer=utm_source%3Dquotemateapp.au%26utm_medium%3Dwebsite';

  const storeName = platform === 'ios' ? 'App Store' : 'Google Play';
  const storeLabel = platform === 'ios' ? 'Download on the' : 'Get it on';

  return (
    <>
      <div className={`install-sheet-backdrop ${mode === 'sheet' ? 'visible' : ''}`} onClick={minimize}>
        <div className={`install-sheet ${mode === 'sheet' ? 'visible' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-label="Install QuoteMate app">
          <button className="install-sheet-close" onClick={minimize} aria-label="Dismiss">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="install-sheet-handle" />
          <div className="install-sheet-icon">
            <img src="/assets/logo.png" alt="QuoteMate" width={64} height={64} />
          </div>
          <div className="install-sheet-rating">
            <span>Free to start · Built for Aussie tradies</span>
          </div>
          <h3 className="install-sheet-title">Get the QuoteMate App</h3>
          <p className="install-sheet-desc">Create professional quotes in under 2 minutes — now available on {platform === 'ios' ? 'iOS' : 'Android'}.</p>
          <a href={storeLink} className="btn btn-primary install-sheet-btn" target="_blank" rel="noopener noreferrer">
            {platform === 'ios' ? (
              <svg width="18" height="22" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
            ) : (
              <svg width="18" height="20" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
            )}
            <span>
              <small>{storeLabel}</small>
              {storeName}
            </span>
          </a>
        </div>
      </div>

      <div className={`install-bar ${mode === 'bar' ? 'visible' : ''}`} role="complementary" aria-label="Install QuoteMate app">
        <button className="install-bar-body" onClick={expand} aria-label="Show app install options">
          <img src="/assets/logo.png" alt="" width={36} height={36} />
          <span className="install-bar-text">
            <b>Get the QuoteMate app</b>
            <small>Quotes in under 2 minutes</small>
          </span>
        </button>
        <a href={storeLink} className="btn btn-primary install-bar-btn" target="_blank" rel="noopener noreferrer">
          {storeName}
        </a>
      </div>
    </>
  );
}
