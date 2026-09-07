// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { ACQUISITION_KEY, captureAcquisition, inferAcquisition, isMarketingPath, parseAcquisition, readAcquisition } from './acquisition';

const now = new Date('2026-09-07T10:00:00Z');
const href = 'https://quotemateapp.au/articles/how-to-quote-electrical-work/?email=private#customer';

beforeEach(() => {
  sessionStorage.clear();
  document.cookie = `${ACQUISITION_KEY}=;path=/;max-age=0`;
  history.replaceState({}, '', '/');
});

describe('first-touch acquisition', () => {
  it('captures Google organic without query, search terms, hash or customer details', () => {
    expect(inferAcquisition(href, 'https://www.google.com.au/search?q=private', now)).toEqual({
      source: 'google', medium: 'organic', landingPage: '/articles/how-to-quote-electrical-work/',
      referrerHost: 'www.google.com.au', landedAt: now.toISOString(),
    });
  });
  it('identifies other search engines without loose hostname matching', () => {
    expect(inferAcquisition(href, 'https://www.bing.com/search?q=x', now)?.medium).toBe('organic');
    expect(inferAcquisition(href, 'https://au.search.yahoo.com/search', now)?.source).toBe('yahoo');
    expect(inferAcquisition(href, 'https://google.com.evil.test/', now)?.medium).toBe('referral');
  });
  it('gives explicit campaigns priority over search inference', () => {
    const paid = inferAcquisition(href + '&unused', 'https://google.com/', now);
    expect(paid?.medium).toBe('organic');
    expect(inferAcquisition('https://quotemateapp.au/?utm_source=google&utm_medium=cpc', 'https://google.com/', now)?.medium).toBe('cpc');
    expect(inferAcquisition('https://quotemateapp.au/?gclid=secret', '', now)?.medium).toBe('paid');
  });
  it('does not invent an organic source for internal or referrerless visits', () => {
    expect(inferAcquisition(href, '', now)?.source).toBe('(direct)');
    expect(inferAcquisition(href, 'https://quotemateapp.au/templates/', now)?.source).toBe('(unknown)');
  });
  it.each(['/admin', '/admin/analytics', '/q/', '/portal/review/', '/join/', '/app', '/app/NewJob', '/reece/callback/', '/xero/callback/', '/articles/person@example.com'])('rejects non-marketing/private route %s', path => {
    expect(isMarketingPath(path)).toBe(false);
  });
  it.each(['/', '/templates/', '/templates/ducted-aircon-quote-template/', '/quotes-for-electricians/sydney/', '/integrations/reece/'])('allows marketing route %s', path => {
    expect(isMarketingPath(path)).toBe(true);
  });
  it('validates stored data and drops unknown fields', () => {
    expect(parseAcquisition('garbage')).toBeNull();
    expect(parseAcquisition('[]')).toBeNull();
    const valid = inferAcquisition(href, 'https://google.com/', now)!;
    expect(parseAcquisition(JSON.stringify({ ...valid, email: 'private' }))).toEqual(valid);
    expect(parseAcquisition(JSON.stringify({ ...valid, landingPage: '/q/private' }))).toBeNull();
  });
  it('retains the original context after internal navigation', () => {
    const original = inferAcquisition(href, 'https://google.com/', new Date())!;
    sessionStorage.setItem(ACQUISITION_KEY, JSON.stringify(original));
    history.replaceState({}, '', '/templates/');
    expect(captureAcquisition()).toEqual(original);
  });
  it('uses a same-origin cookie when a noopener tab has no session storage', () => {
    const first = captureAcquisition();
    sessionStorage.clear();
    expect(readAcquisition()).toEqual(first);
    expect(document.cookie).not.toContain('utm_');
  });
});
