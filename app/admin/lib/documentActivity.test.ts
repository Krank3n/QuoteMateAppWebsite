import { describe, it, expect } from 'vitest';
import { activityLine, wasResent, type ActivitySource } from './documentActivity';

const base: ActivitySource = {
  type: 'quote',
  stage: 'quote_sent',
  sentAt: 1_000,
  lastSentAt: null,
  sendCount: 0,
  respondedAt: null,
  lastViewedAt: null,
  depositPaidAt: null,
  paidInFullAt: null,
};

describe('wasResent', () => {
  it('needs a lastSentAt strictly after the first send', () => {
    expect(wasResent({ sentAt: 1_000, lastSentAt: null })).toBe(false);
    expect(wasResent({ sentAt: 1_000, lastSentAt: 1_000 })).toBe(false);
    expect(wasResent({ sentAt: 1_000, lastSentAt: 5_000 })).toBe(true);
    // Pre-audit docs (sent before the field existed) never read as re-sent.
    expect(wasResent({ sentAt: null, lastSentAt: 5_000 })).toBe(false);
  });
});

describe('activityLine', () => {
  it('shows the first send for a plain sent quote', () => {
    expect(activityLine(base)).toEqual({ word: 'sent', at: 1_000 });
  });

  it('shows a re-send when the tradie acted last', () => {
    expect(activityLine({ ...base, lastSentAt: 5_000, sendCount: 2 }))
      .toEqual({ word: 're-sent', at: 5_000, suffix: '×2' });
  });

  it('omits the count when only the post-audit send was counted', () => {
    // First sent before sendCount existed, re-sent once after: count is 1.
    expect(activityLine({ ...base, lastSentAt: 5_000, sendCount: 1 }))
      .toEqual({ word: 're-sent', at: 5_000, suffix: undefined });
  });

  it('prefers a view that happened after the re-send', () => {
    expect(activityLine({ ...base, lastSentAt: 5_000, sendCount: 2, lastViewedAt: 6_000 }))
      .toEqual({ word: 'viewed', at: 6_000 });
  });

  it('prefers the re-send over a view that predates it', () => {
    expect(activityLine({ ...base, lastSentAt: 5_000, sendCount: 2, lastViewedAt: 2_000 }))
      .toEqual({ word: 're-sent', at: 5_000, suffix: '×2' });
  });

  it('a customer answer outranks any send', () => {
    expect(activityLine({ ...base, lastSentAt: 5_000, respondedAt: 3_000 }))
      .toEqual({ word: 'responded', at: 3_000 });
  });

  it('says accepted, not responded, on an invoice converted from an accepted quote', () => {
    expect(activityLine({ ...base, type: 'invoice', stage: 'draft', respondedAt: 3_000 }))
      .toEqual({ word: 'accepted', at: 3_000 });
  });

  it('money always wins', () => {
    expect(activityLine({ ...base, lastSentAt: 5_000, paidInFullAt: 9_000 }))
      .toEqual({ word: 'paid', at: 9_000 });
    expect(activityLine({ ...base, stage: 'quote_accepted', depositPaidAt: 4_000, respondedAt: 3_000 }))
      .toEqual({ word: 'deposit', at: 4_000 });
  });

  it('is null for an untouched draft', () => {
    expect(activityLine({ ...base, sentAt: null })).toBeNull();
  });
});
