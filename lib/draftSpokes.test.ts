/**
 * A draft spoke must vanish from the whole site at once.
 *
 * The Tap to Pay on iPhone page was pulled because shipped builds carry no
 * Apple entitlement, so the flow it described could not work for anyone — and
 * Apple reviews public marketing of its own feature name before granting the
 * publishing entitlement. A half-pull is worse than no pull: a hub still
 * linking to a removed page, or a sitemap still submitting it to Google, is
 * exactly the state this guards against.
 *
 * The filter lives in one place (lib/data.ts) precisely so the route, the hub
 * listing and the sitemap cannot disagree — this test is what keeps a future
 * consumer from reading seo/data.json directly and reintroducing the page.
 */
import { describe, it, expect } from 'vitest';

import rawData from '../seo/data.json';
import { paymentHub, getPaymentSpokeBySlug } from './data';

const PULLED = 'tap-to-pay-iphone-tradies';

describe('draft payment spokes', () => {
  it('the Tap to Pay spoke is still flagged draft in the source data', () => {
    // If this fails, someone un-pulled it — check the entitlement actually
    // landed before letting the rest of these assertions be "fixed".
    const raw = (rawData as any).paymentHub.spokes.find(
      (s: any) => s.slug === PULLED,
    );
    expect(raw).toBeDefined();
    expect(raw.draft).toBe(true);
    expect(raw.draftReason).toMatch(/entitlement/i);
  });

  it('keeps the content in the repo rather than deleting it', () => {
    // Restoring should be one flag, not an archaeology dig through git history.
    const raw = (rawData as any).paymentHub.spokes.find(
      (s: any) => s.slug === PULLED,
    );
    expect(raw.sections.length).toBeGreaterThan(0);
  });

  it('does not expose a draft spoke through the data layer', () => {
    expect(paymentHub?.spokes.some((s) => s.slug === PULLED)).toBe(false);
    expect(getPaymentSpokeBySlug(PULLED)).toBeUndefined();
  });

  it('drops no published spoke while doing it', () => {
    const published = (rawData as any).paymentHub.spokes.filter(
      (s: any) => !s.draft,
    );
    expect(paymentHub?.spokes).toHaveLength(published.length);
    expect(paymentHub!.spokes.length).toBeGreaterThan(0);
  });

  it('exposes no draft spoke at all, not just this one', () => {
    expect(paymentHub?.spokes.every((s) => !s.draft)).toBe(true);
  });
});
