// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GA_ID, initialiseAnalytics, setAnalyticsDisabled, startPageTracking, trackingAllowed } from './analyticsTracking';
import { ACQUISITION_KEY } from './acquisition';

const w = window as unknown as Record<string, any>;
let cleanups: (() => void)[] = [];
const events = () => (w.dataLayer || []).map((entry: IArguments) => Array.from(entry)).filter((entry: unknown[]) => entry[0] === 'event');
const start = (path = '/') => { history.replaceState({}, '', path); initialiseAnalytics(); cleanups.push(startPageTracking(path)); };
const click = (selector: string, options: MouseEventInit = {}) => {
  document.querySelector(selector)!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...options }));
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear(); sessionStorage.clear();
  document.cookie = `${ACQUISITION_KEY}=;path=/;max-age=0`;
  history.replaceState({}, '', '/');
  document.body.innerHTML = '';
  // Exercise our delegated listeners without asking jsdom to leave the page.
  document.onclick = event => event.preventDefault();
  delete w.gtag; delete w.dataLayer; delete w.__qmGaConfigured;
  setAnalyticsDisabled(false);
  cleanups = [];
});
afterEach(() => { cleanups.forEach(fn => fn()); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('route-aware marketing analytics', () => {
  it('queues the initial impression and early CTA before GA loads, and configures once', () => {
    document.body.innerHTML = '<a href="/app?signup=1" class="hero-web-link">Try</a>';
    start(); click('a'); initialiseAnalytics();
    expect(events().map((e: unknown[]) => e[1])).toEqual(['experiment_impression', 'web_app_click']);
    expect(w.dataLayer.map((a: IArguments) => Array.from(a)).filter((a: unknown[]) => a[0] === 'config')).toEqual([['config', GA_ID]]);
  });
  it('tracks late-rendered CTAs with one event even when selectors overlap', () => {
    start('/templates/');
    document.body.innerHTML = '<section id="hero"><a href="/app?signup=1" class="hero-web-link nav-cta" data-hero-cta><span>Try</span></a></section>';
    click('span');
    expect(events()).toHaveLength(1);
    expect(events()[0][1]).toBe('web_app_click');
    expect(events()[0][2]).toMatchObject({ section: 'hero', page_path: '/templates/' });
  });
  it('cleans listeners and timers before the next route', () => {
    start('/templates/'); cleanups[0]();
    start('/articles/');
    document.body.innerHTML = '<a href="/app?signup=1">Try</a>';
    click('a'); vi.advanceTimersByTime(30_000);
    expect(events().map((e: unknown[]) => e[1])).toEqual(['web_app_click', 'time_on_page']);
    expect(events()[1][2]).toMatchObject({ page_path: '/articles/', seconds: 30 });
  });
  it('disconnects the old section observer and resets section impressions per route', () => {
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class { observe = vi.fn(); disconnect = disconnect; });
    document.body.innerHTML = '<section id="test"></section>';
    start('/templates/'); cleanups[0]();
    expect(disconnect).toHaveBeenCalledOnce();
  });
  it('classifies app/store links by the exact destination, not label text', () => {
    start('/templates/');
    document.body.innerHTML = '<a class="btn-store" href="https://apps.apple.com/au/app/id123">Get</a>';
    click('a');
    expect(events()[0][1]).toBe('app_store_click');
    document.body.innerHTML = '<a class="btn-store" href="https://apps.apple.com.evil.test/">App Store</a>';
    click('a');
    expect(events().filter((e: unknown[]) => e[1] === 'app_store_click')).toHaveLength(1);
  });
  it('tracks a download as a micro-event, not a signup or generic CTA', () => {
    start('/templates/');
    document.body.innerHTML = '<a href="/assets/quote-templates/test.pdf" download data-template-download="pdf" data-template-slug="test">PDF</a>';
    click('a');
    expect(events()).toHaveLength(1);
    expect(events()[0][1]).toBe('template_download');
    expect(events()[0][2]).toMatchObject({ file_format: 'pdf', template_slug: 'test' });
  });
  it('never sends email addresses or query strings in outbound custom events', () => {
    start('/templates/');
    document.body.innerHTML = '<a href="mailto:private@example.com?subject=private">Email</a>';
    click('a');
    document.body.innerHTML = '<a href="https://example.com/info?token=secret#private">Link</a>';
    click('a');
    expect(JSON.stringify(events())).not.toContain('private');
    expect(JSON.stringify(events())).not.toContain('secret');
    expect(events()[1][2]).toMatchObject({ url: 'https://example.com/info' });
  });
  it('never starts on internal routes or with owner opt-out / declined consent', () => {
    expect(trackingAllowed('/admin/analytics/')).toBe(false);
    expect(trackingAllowed('/q/')).toBe(false);
    history.replaceState({}, '', '/?notrack=1');
    expect(trackingAllowed('/')).toBe(false);
    expect(localStorage.getItem('qm_notrack')).toBe('1');
    history.replaceState({}, '', '/');
    start(); expect(events()).toHaveLength(0);
    localStorage.clear(); localStorage.setItem('qm_cookie_consent', 'declined');
    expect(trackingAllowed('/')).toBe(false);
  });
  it('stops custom events immediately on navigation to an internal route', () => {
    start('/templates/'); history.replaceState({}, '', '/admin/');
    document.body.innerHTML = '<a href="/app">Try</a>';
    click('a'); vi.advanceTimersByTime(30_000);
    expect(events()).toHaveLength(0);
  });
  it('does not break malformed anchors or hijack modified clicks', () => {
    start('/templates/');
    document.body.innerHTML = '<a href="#%zz">Broken</a>';
    expect(() => click('a')).not.toThrow();
    document.body.innerHTML = '<a href="#section">Section</a><section id="section"></section>';
    click('a', { ctrlKey: true });
    expect(events()).toHaveLength(0);
  });
});

describe('website events never impersonate a business outcome', () => {
  // The website measures interest; the app measures accounts. A CTA click is
  // an intent to visit /app, and a template download is a file being fetched
  // — neither is a signup, a sent quote or a dollar. If the site ever emitted
  // sign_up, every acquisition ratio downstream would be built on clicks.
  const OUTCOME_EVENTS = ['sign_up', 'login', 'purchase', 'subscribe', 'begin_checkout', 'quote_sent'];

  it('emits no signup, login or purchase event from any CTA on the page', () => {
    document.body.innerHTML = [
      '<section id="hero">',
      '<a href="/app?signup=1" class="hero-web-link">Get my first quote</a>',
      '<a href="/app" class="nav-cta">Open the app</a>',
      '<a href="/pricing" class="pricing-btn">See pricing</a>',
      '<a href="https://apps.apple.com/app/id1" class="btn-store">App Store</a>',
      '<a href="https://play.google.com/store/apps/details?id=x" class="btn-store">Google Play</a>',
      '<a href="/downloads/x.pdf" data-template-download="pdf" data-template-slug="fencing">PDF</a>',
      '</section>',
    ].join('');
    start('/templates/');
    for (const selector of ['.hero-web-link', '.nav-cta', '.pricing-btn', '.btn-store', '[data-template-download]']) {
      click(selector);
    }
    const names = events().map((e: unknown[]) => e[1]);
    expect(names.length).toBeGreaterThan(0);
    for (const outcome of OUTCOME_EVENTS) expect(names).not.toContain(outcome);
    // The CTA events themselves still fire, under their own names.
    expect(names).toContain('web_app_click');
    expect(names).toContain('template_download');
  });

  it('sends no manual page_view, leaving GA enhanced measurement to count them once', () => {
    // A manual page_view here would double-count every route against GA's own
    // history-based one.
    start('/pricing/');
    expect(events().map((e: unknown[]) => e[1])).not.toContain('page_view');
    expect((w.dataLayer || []).map((a: IArguments) => Array.from(a))
      .filter((a: unknown[]) => a[0] === 'config')).toHaveLength(1);
  });
});
