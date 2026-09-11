import { describe, it, expect } from 'vitest';
import { FOUNDING_COUNT_VISIBLE_AT, showFoundingSpotCount } from './foundingSpots';

describe('founding spot count visibility', () => {
  it('holds the tally back while plenty of spots remain', () => {
    // "92 left" says eight people have paid — never publish that.
    expect(showFoundingSpotCount(92)).toBe(false);
    expect(showFoundingSpotCount(FOUNDING_COUNT_VISIBLE_AT + 1)).toBe(false);
  });

  it('shows the tally once spots are genuinely scarce', () => {
    expect(showFoundingSpotCount(FOUNDING_COUNT_VISIBLE_AT)).toBe(true);
    expect(showFoundingSpotCount(19)).toBe(true);
    expect(showFoundingSpotCount(1)).toBe(true);
  });

  it('never shows a zero or invalid count', () => {
    expect(showFoundingSpotCount(0)).toBe(false);
    expect(showFoundingSpotCount(-3)).toBe(false);
    expect(showFoundingSpotCount(NaN)).toBe(false);
  });

  it('mirrors the app threshold', () => {
    // QuoteMate/src/config/pricingConfig.ts pins the same value.
    expect(FOUNDING_COUNT_VISIBLE_AT).toBe(25);
  });
});
