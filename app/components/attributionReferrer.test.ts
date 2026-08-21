import { describe, it, expect } from 'vitest';
import { withAttributionReferrer } from './attributionReferrer';

const BADGE =
  'https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU&referrer=utm_source%3Dquotemateapp.au%26utm_medium%3Dwebsite';

const stored = (payload: unknown) => JSON.stringify(payload);

describe('withAttributionReferrer', () => {
  it('swaps the hardcoded organic referrer for the stored campaign params', () => {
    const href = withAttributionReferrer(
      BADGE,
      stored({ utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'phase2', landedAt: '2026-08-20T00:00:00Z' }),
    );
    expect(href).toContain('referrer=utm_source%3Dfacebook%26utm_medium%3Dcpc%26utm_campaign%3Dphase2');
    expect(href).not.toContain('quotemateapp.au');
  });

  it('keeps the non-referrer query params intact', () => {
    const href = withAttributionReferrer(BADGE, stored({ utm_source: 'facebook' }));
    expect(href).toContain('id=com.quotemate.app');
    expect(href).toContain('hl=en_AU');
  });

  it('carries click ids so an ad tap survives into the install', () => {
    const href = withAttributionReferrer(BADGE, stored({ fbclid: 'abc123' }));
    expect(href).toContain('referrer=fbclid%3Dabc123');
  });

  it('leaves non-Play links alone', () => {
    expect(withAttributionReferrer('https://apps.apple.com/au/app/id123', stored({ utm_source: 'facebook' }))).toBeNull();
  });

  it('leaves the organic default when nothing is stored', () => {
    expect(withAttributionReferrer(BADGE, null)).toBeNull();
  });

  it('leaves the organic default when the payload has no attribution keys', () => {
    expect(withAttributionReferrer(BADGE, stored({ landedAt: '2026-08-20T00:00:00Z' }))).toBeNull();
  });

  it('survives a corrupt stored payload', () => {
    expect(withAttributionReferrer(BADGE, 'not-json{')).toBeNull();
    expect(withAttributionReferrer(BADGE, stored('a string'))).toBeNull();
    expect(withAttributionReferrer(BADGE, stored({ utm_source: 42 }))).toBeNull();
  });
});
