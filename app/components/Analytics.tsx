'use client';

import { useEffect } from 'react';
import Script from 'next/script';

const GA_ID = 'G-E3JERN2D5V';

function track(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, params || {});
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
  useEffect(() => {
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

    // CTA button tracking
    document.querySelectorAll('.btn-store, .pricing-btn, .nav-cta').forEach((btn) => {
      btn.addEventListener('click', function(this: HTMLElement) {
        const label = this.getAttribute('aria-label') || this.textContent?.trim() || '';
        const section = getClosestSection(this);
        let ctaType = 'cta_click';
        if (label.toLowerCase().includes('app store')) ctaType = 'app_store_click';
        else if (label.toLowerCase().includes('google play')) ctaType = 'google_play_click';
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
  }, []);

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
