import { captureAcquisition, isMarketingPath, readAcquisition } from './acquisition';

export const GA_ID = 'G-E3JERN2D5V';
type EventParams = Record<string, string | number | boolean>;
type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  __qmGaConfigured?: boolean;
  'ga-disable-G-E3JERN2D5V'?: boolean;
};

export function trackingAllowed(pathname: string): boolean {
  if (!isMarketingPath(pathname)) return false;
  try {
    const optOut = new URLSearchParams(window.location.search).get('notrack');
    if (optOut === '1') localStorage.setItem('qm_notrack', '1');
    if (optOut === '0') localStorage.removeItem('qm_notrack');
    return optOut !== '1' && localStorage.getItem('qm_notrack') !== '1'
      && localStorage.getItem('qm_cookie_consent') !== 'declined';
  } catch {
    return new URLSearchParams(window.location.search).get('notrack') !== '1';
  }
}

/** Queue events before the external GA library arrives; don't lose the first
 * impression or early CTA clicks on a slow connection. */
export function initialiseAnalytics(): void {
  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function () { w.dataLayer!.push(arguments); };
  }
  if (!w.__qmGaConfigured) {
    w.gtag('js', new Date());
    w.gtag('config', GA_ID);
    w.__qmGaConfigured = true;
  }
}

export function setAnalyticsDisabled(disabled: boolean): void {
  (window as AnalyticsWindow)['ga-disable-G-E3JERN2D5V'] = disabled;
}

export function trackEvent(name: string, params: EventParams = {}): void {
  const w = window as AnalyticsWindow;
  if (w['ga-disable-G-E3JERN2D5V'] || !trackingAllowed(window.location.pathname)) return;
  const acquisition = readAcquisition();
  w.gtag?.('event', name, {
    variant: document.documentElement.getAttribute('data-home-variant') || 'a',
    page_path: window.location.pathname,
    ...(acquisition ? {
      first_landing_page: acquisition.landingPage,
      acquisition_source: acquisition.source,
      acquisition_medium: acquisition.medium,
    } : {}),
    ...params,
  });
}

function sectionFor(el: Element): string {
  const section = el.closest('section[id]');
  if (section) return section.id;
  if (el.closest('.hero')) return 'hero';
  if (el.closest('.final-cta')) return 'download';
  if (el.closest('.site-footer')) return 'footer';
  if (el.closest('.platforms')) return 'platforms';
  return 'unknown';
}

const CTA_SELECTOR = '.btn-store, .btn-store-lg, .pricing-btn, .nav-cta, .hero-web-link, [data-hero-cta]';

function handleClick(e: MouseEvent) {
  if (!(e.target instanceof Element)) return;
  const anchor = e.target.closest<HTMLAnchorElement>('a[href]');
  const cta = e.target.closest<HTMLElement>(CTA_SELECTOR);
  let url: URL | null = null;
  try { if (anchor) url = new URL(anchor.href, window.location.href); } catch { /* malformed href */ }

  if (anchor?.hasAttribute('data-template-download')) {
    const format = anchor.getAttribute('data-template-download');
    const slug = anchor.getAttribute('data-template-slug') || '';
    if ((format === 'pdf' || format === 'xlsx') && /^[a-z0-9-]+$/.test(slug)) {
      trackEvent('template_download', { template_slug: slug, file_format: format, section: sectionFor(anchor) });
    }
  } else if (cta || (url?.origin === window.location.origin && /^\/app(?:\/|$)/.test(url.pathname))) {
    const el = cta || anchor!;
    let event = 'cta_click';
    if (url?.origin === window.location.origin && /^\/app(?:\/|$)/.test(url.pathname)) event = 'web_app_click';
    else if (url?.hostname === 'apps.apple.com') event = 'app_store_click';
    else if (url?.hostname === 'play.google.com') event = 'google_play_click';
    else if (el.classList.contains('pricing-btn')) event = 'pricing_cta_click';
    trackEvent(event, { button_text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 100), section: sectionFor(el) });
  }

  const href = anchor?.getAttribute('href');
  if (href?.startsWith('#') && href.length > 1 && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
    try {
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (target) {
        e.preventDefault();
        target.scrollIntoView?.({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        trackEvent('nav_click', { link_target: href });
      }
    } catch { /* invalid fragment must not break navigation */ }
  }
  if (url?.protocol === 'mailto:') {
    trackEvent('contact_email_click'); // No email address or mailto query in GA.
  } else if (url && /^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
    trackEvent('outbound_link_click', { url: `${url.origin}${url.pathname}` }); // Strip tokens / query / fragment.
  }
}

/** One delegated handler per route; works with late-rendered CTAs too. */
export function startPageTracking(pathname: string, homeImpression = true): () => void {
  if (!trackingAllowed(pathname)) return () => {};
  captureAcquisition();
  if (pathname === '/' && homeImpression) {
    trackEvent('experiment_impression', { experiment_id: 'home_hero_v2' });
  }
  document.addEventListener('click', handleClick, true);

  const seenSections = new Set<string>();
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting && !seenSections.has(entry.target.id)) {
        seenSections.add(entry.target.id);
        trackEvent('section_view', { section: entry.target.id });
      }
    }
  }, { threshold: 0.3 }) : null;
  document.querySelectorAll('section[id]').forEach(section => observer?.observe(section));

  const milestones = new Set<number>();
  const scroll = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    if (height <= 0) return;
    const percent = Math.round(100 * window.scrollY / height);
    for (const mark of [25, 50, 75, 100]) {
      if (percent >= mark && !milestones.has(mark)) {
        milestones.add(mark); trackEvent('scroll_depth', { percent: mark });
      }
    }
  };
  window.addEventListener('scroll', scroll, { passive: true });
  const timers = [30, 60, 120, 300].map(seconds => window.setTimeout(() => trackEvent('time_on_page', { seconds }), seconds * 1000));
  return () => {
    document.removeEventListener('click', handleClick, true);
    window.removeEventListener('scroll', scroll);
    timers.forEach(id => window.clearTimeout(id));
    observer?.disconnect();
  };
}
