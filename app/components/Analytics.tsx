'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = 'G-E3JERN2D5V';

function getVariant(): string {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-home-variant') || 'a';
  }
  return 'a';
}

function track(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, { variant: getVariant(), ...(params || {}) });
  }
}

function getClosestSection(el: Element): string {
  const section = el.closest('section[id]');
  if (section) return section.id;
  const parent = el.closest('.hero, .final-cta, .site-footer, .platforms');
  if (parent) {
    if (parent.classList.contains('hero')) return 'hero';
    if (parent.classList.contains('final-cta')) return 'download';
    if (parent.classList.contains('site-footer')) return 'footer';
    if (parent.classList.contains('platforms')) return 'platforms';
  }
  return 'unknown';
}

export default function Analytics() {
  // Don't load GA on the internal /admin CRM — it pollutes marketing analytics
  // with team traffic (inflated sessions, fake "top pages", skewed funnel).
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (isAdmin) return;
    // Owner opt-out: visit any page with ?notrack=1 once per browser to keep
    // your own visits out of GA (?notrack=0 re-enables). Needed because the
    // team's IPs are dynamic, so GA4's IP-based internal filter can't catch them.
    try {
      const q = new URLSearchParams(window.location.search).get('notrack');
      if (q === '1') localStorage.setItem('qm_notrack', '1');
      else if (q === '0') localStorage.removeItem('qm_notrack');
      setEnabled(localStorage.getItem('qm_notrack') !== '1');
    } catch {
      setEnabled(true);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!enabled) return;
    // Fire experiment impression once per mount — homepage only. The hero
    // experiment only renders on '/', so impressions from other pages would
    // dilute the A/B denominators with visitors who never saw either hero.
    // (window.location, not usePathname, to keep this effect single-run.)
    if (window.location.pathname === '/') {
      const variant = getVariant();
      track('experiment_impression', { experiment_id: 'home_hero_v1', variant });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(this: HTMLAnchorElement, e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId!);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
          track('nav_click', { link_target: targetId });
        }
      });
    });

    // CTA button tracking. Includes the hero's OWN CTAs: `btn-store-lg` (the big
    // App Store / Google Play buttons) and `hero-web` (the "try it free on the web"
    // link). These differ from the footer's `btn-store` and the component's
    // `hero-web-link`, so the homepage hero previously logged zero CTA clicks —
    // which biased the home_hero_v1 A/B test (variant B's buttons carry `nav-cta`
    // and were counted; variant A's hero buttons were not).
    document.querySelectorAll('.btn-store, .btn-store-lg, .hero-web, .pricing-btn, .nav-cta').forEach((btn) => {
      btn.addEventListener('click', function(this: HTMLElement) {
        const label = this.getAttribute('aria-label') || this.textContent?.trim() || '';
        const section = getClosestSection(this);
        // Classify by DESTINATION first, label second: variant B's hero
        // primary ("Get my first quote") links to /app — a web-app exit in
        // everything but wording — and label matching left it hiding in
        // generic cta_click, understating B's store-exit rate in the A/B read.
        const href = this.getAttribute('href') || '';
        let ctaType = 'cta_click';
        if (href === '/app' || href.startsWith('/app/') || href.startsWith('/app?')) ctaType = 'web_app_click';
        else if (href.includes('apps.apple.com') || label.toLowerCase().includes('app store')) ctaType = 'app_store_click';
        else if (href.includes('play.google.com') || label.toLowerCase().includes('google play')) ctaType = 'google_play_click';
        else if (label.toLowerCase().includes('web')) ctaType = 'web_app_click';
        else if (this.classList.contains('pricing-btn')) ctaType = 'pricing_cta_click';
        track(ctaType, { button_text: label.substring(0, 100), section });
      });
    });

    // Track "Try on Web" links
    document.querySelectorAll('.hero-web-link').forEach((link) => {
      link.addEventListener('click', function(this: HTMLElement) {
        track('web_app_click', { button_text: 'Try on Web', section: getClosestSection(this) });
      });
    });

    // Section view tracking
    const trackedSections: Record<string, boolean> = {};
    const sections = document.querySelectorAll('section[id]');
    if ('IntersectionObserver' in window && sections.length > 0) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !trackedSections[entry.target.id]) {
            trackedSections[entry.target.id] = true;
            track('section_view', { section: entry.target.id });
          }
        });
      }, { threshold: 0.3 });
      sections.forEach((s) => sectionObserver.observe(s));
    }

    // Scroll depth tracking
    const scrollMilestones: Record<number, boolean> = { 25: false, 50: false, 75: false, 100: false };
    function checkScrollDepth() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const percent = Math.round((scrollTop / docHeight) * 100);
      [25, 50, 75, 100].forEach((milestone) => {
        if (percent >= milestone && !scrollMilestones[milestone]) {
          scrollMilestones[milestone] = true;
          track('scroll_depth', { percent: milestone });
        }
      });
    }
    window.addEventListener('scroll', checkScrollDepth, { passive: true });

    // Time on page tracking
    const timeouts = [30, 60, 120, 300].map((seconds) =>
      setTimeout(() => track('time_on_page', { seconds }), seconds * 1000)
    );

    // Outbound link tracking
    document.querySelectorAll('a[href^="http"], a[href^="mailto:"]').forEach((link) => {
      link.addEventListener('click', function(this: HTMLAnchorElement) {
        const href = this.getAttribute('href') || '';
        if (href.startsWith('mailto:')) {
          track('contact_email_click', { email: href.replace('mailto:', '') });
        } else if (!href.includes(window.location.hostname)) {
          track('outbound_link_click', { url: href });
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', checkScrollDepth);
      timeouts.forEach(clearTimeout);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
