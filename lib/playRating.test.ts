import { describe, expect, it } from 'vitest';
import { FALLBACK_PLAY_RATING, formatRating, parsePlayRating } from './playRating';

describe('Google Play rating parser', () => {
  it('reads the aggregate rating out of the listing JSON-LD', () => {
    const html = '<script type="application/ld+json">{"@type":"SoftwareApplication","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.857142925262451","ratingCount":"7"}}</script>';
    expect(parsePlayRating(html)).toEqual({ value: 4.857142925262451, count: 7 });
  });

  it('returns null rather than a bogus score when the markup is missing or out of range', () => {
    expect(parsePlayRating('<html>no rating here</html>')).toBeNull();
    expect(parsePlayRating('"ratingValue":"7.2","ratingCount":"3"')).toBeNull();
    expect(parsePlayRating('"ratingValue":"4.5","ratingCount":"0"')).toBeNull();
  });

  it('formats to one decimal and never shows more than 5.0', () => {
    expect(formatRating(4.857142925262451)).toBe('4.9');
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(5.04)).toBe('5.0');
  });

  it('keeps a sane hand-verified fallback for when Play is unreachable at build time', () => {
    expect(FALLBACK_PLAY_RATING.value).toBeGreaterThan(0);
    expect(FALLBACK_PLAY_RATING.value).toBeLessThanOrEqual(5);
    expect(FALLBACK_PLAY_RATING.count).toBeGreaterThanOrEqual(1);
  });
});
