import { describe, it, expect } from 'vitest';
import { firstCampaign, withAppAttribution } from './campaignAttribution';

const origin = 'https://quotemateapp.au';
const now = new Date('2026-09-07T00:00:00Z');
const paid = firstCampaign('?utm_source=facebook&utm_medium=cpc&fbclid=abc', null, now)!;

describe('campaign handoff', () => {
  it('keeps the original campaign when a later navigation has no params or different params', () => {
    expect(firstCampaign('', JSON.stringify(paid), now)).toEqual(paid);
    expect(firstCampaign('?utm_source=google', JSON.stringify(paid), now)).toEqual(paid);
  });
  it('recovers from junk, empty and incorrectly typed stored payloads', () => {
    for (const raw of ['bad', 'null', '{}', '[]', '{"utm_source":42}']) {
      expect(firstCampaign('?utm_source=facebook', raw, now)?.utm_source).toBe('facebook');
    }
  });
  it('allowlists and bounds parameters', () => {
    const p = firstCampaign(`?utm_source=${'a'.repeat(300)}&email=private&signup=1`, null, now)!;
    expect(p.utm_source).toHaveLength(200);
    expect(Object.keys(p).sort()).toEqual(['landedAt', 'utm_source']);
  });
  it('keeps signup intent and fragments intact when handing off paid attribution', () => {
    const href = withAppAttribution('/app?signup=1#auth', paid, origin);
    const url = new URL(href, origin);
    expect(url.searchParams.get('signup')).toBe('1');
    expect(url.hash).toBe('#auth');
    expect(url.searchParams.get('utm_source')).toBe('facebook');
    expect(url.searchParams.get('fbclid')).toBe('abc');
  });
  it('never adds internal UTMs to an organic visit', () => {
    expect(firstCampaign('?signup=1', null, now)).toBeNull();
    expect(withAppAttribution('/app?signup=1', null, origin)).toBe('/app?signup=1');
  });
  it.each(['/application', '/app-store', 'https://evil.test/app', '/templates/'])('leaves non-app URL %s unchanged', href => {
    expect(withAppAttribution(href, paid, origin)).toBe(href);
  });
  it('is idempotent and first-touch wins over stale link parameters', () => {
    const href = withAppAttribution('/app?utm_source=other&utm_term=stale&signup=1', paid, origin);
    expect(withAppAttribution(href, paid, origin)).toBe(href);
    expect(href).not.toContain('other');
    expect(href).not.toContain('stale');
  });
});
