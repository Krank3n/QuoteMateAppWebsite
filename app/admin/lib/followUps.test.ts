import { describe, it, expect } from 'vitest';
import {
  buildFollowUps,
  contactNoteText,
  followUpCounts,
  forgetContacted,
  outstanding,
  pruneContacted,
  undoableNoteIds,
  withContactNote,
  DAY,
  type ContactedEntry,
  type FollowUpSource,
  type FollowUpUser,
} from './followUps';

const NOW = Date.parse('2026-08-03T00:00:00Z');

function user(over: Partial<FollowUpUser> = {}): FollowUpUser {
  return {
    uid: 'u1',
    email: 'tradie@example.com',
    displayName: null,
    businessName: 'Test Trades',
    phone: '0400000000',
    signupAt: NOW - 4 * DAY,
    lastActivityAt: NOW - 4 * DAY,
    planTier: 'trialing',
    quoteCount: 0,
    invoiceCount: 0,
    supplierBookCount: 0,
    healthScore: 50,
    squareStatus: 'none',
    noteCount: 0,
    lastNoteAt: null,
    ...over,
  };
}

function source(users: FollowUpUser[], subs: FollowUpSource['subscriptions'] = []): FollowUpSource {
  return { users, subscriptions: subs };
}

describe('buildFollowUps trial reasons', () => {
  // The bug this guards: currentPeriodEnd on a non-Pro account is the free-quote
  // counter's month end, so on the 3rd of the month it sits 2 days in the past.
  const quotaMonthEnd = Date.parse('2026-07-31T13:59:59Z');

  it('never says a trialing user has ended, whatever currentPeriodEnd holds', () => {
    const items = buildFollowUps(
      source([user()], [{ uid: 'u1', status: 'trialing', currentPeriodEnd: quotaMonthEnd, cancelAt: null, trialEndsAt: NOW + 10 * DAY }]),
      NOW,
    );
    // 10 days left is outside the 7-day window, so no trial reason at all.
    expect(items[0]?.reasons.join(' ')).not.toMatch(/trial ended|trial expired/i);
    expect(items[0]?.kinds).not.toContain('trial');
  });

  it('counts down to the real trial end, not the month boundary', () => {
    const items = buildFollowUps(
      source([user()], [{ uid: 'u1', status: 'trialing', currentPeriodEnd: quotaMonthEnd, cancelAt: null, trialEndsAt: NOW + 3 * DAY }]),
      NOW,
    );
    expect(items[0].reasons).toContain('Trial ends in 3 days');
  });

  it('reads the last hours as today, not tomorrow', () => {
    const end = (ms: number) => buildFollowUps(
      source([user()], [{ uid: 'u1', status: 'trialing', currentPeriodEnd: quotaMonthEnd, cancelAt: null, trialEndsAt: ms }]),
      NOW,
    )[0].reasons[0];
    expect(end(NOW + 2 * 60 * 60 * 1000)).toBe('Trial ends today');
    expect(end(NOW + 0.5 * DAY)).toBe('Trial ends today');
    expect(end(NOW + 1.5 * DAY)).toBe('Trial ends tomorrow');
    expect(end(NOW + 2.5 * DAY)).toBe('Trial ends in 3 days');
  });

  it('dates an expired trial from the trial end', () => {
    const items = buildFollowUps(
      source([user({ signupAt: NOW - 20 * DAY, lastActivityAt: NOW - 14 * DAY, planTier: 'trial_expired' })], [
        { uid: 'u1', status: 'trial_expired', currentPeriodEnd: quotaMonthEnd, cancelAt: null, trialEndsAt: NOW - 6 * DAY },
      ]),
      NOW,
    );
    expect(items[0].reasons).toContain('Trial expired 6d ago');
  });

  it('skips the trial reason when no trial date is known', () => {
    const items = buildFollowUps(
      source([user()], [{ uid: 'u1', status: 'trialing', currentPeriodEnd: quotaMonthEnd, cancelAt: null, trialEndsAt: null }]),
      NOW,
    );
    expect(items[0]?.kinds).not.toContain('trial');
  });

  it('still uses the billing period for a canceling subscription', () => {
    const items = buildFollowUps(
      source([user({ planTier: 'pro_canceling' })], [
        { uid: 'u1', status: 'canceling', currentPeriodEnd: NOW + 5 * DAY, cancelAt: NOW + 5 * DAY, trialEndsAt: null },
      ]),
      NOW,
    );
    expect(items[0].reasons).toContain('Subscription cancels in 5d');
  });
});

describe('contactNoteText', () => {
  it('falls back to a readable default when no summary is typed', () => {
    expect(contactNoteText()).toBe('Contacted');
    expect(contactNoteText('')).toBe('Contacted');
    expect(contactNoteText('   ')).toBe('Contacted');
  });

  it('keeps the typed summary, trimmed', () => {
    expect(contactNoteText('  Left a voicemail, calling back Thursday ')).toBe('Left a voicemail, calling back Thursday');
  });
});

describe('ticking someone off the list', () => {
  const items = buildFollowUps(
    source([
      user({ uid: 'a' }),
      user({ uid: 'b', squareStatus: 'broken' }),
    ]),
    NOW,
  );
  const tick = (over: Partial<ContactedEntry> = {}): ContactedEntry => ({ at: NOW, summary: null, noteIds: ['n1'], ...over });

  it('drops contacted people from the outstanding work', () => {
    expect(items).toHaveLength(2);
    expect(outstanding(items, { a: tick() }).map((i) => i.uid)).toEqual(['b']);
  });

  it('subtracts them from the queue counts too', () => {
    const before = followUpCounts(items, {});
    const after = followUpCounts(items, { b: tick({ summary: 'Fixed their Square link' }) });
    expect(before.all).toBe(2);
    expect(before.square).toBe(1);
    expect(after.all).toBe(1);
    expect(after.square).toBe(0);
  });

  it('puts an undone person straight back into the queue', () => {
    const contacted = { a: tick() };
    expect(outstanding(items, contacted)).toHaveLength(1);
    const undone = forgetContacted(contacted, 'a');
    expect(outstanding(items, undone)).toHaveLength(2);
    expect(followUpCounts(items, undone).all).toBe(2);
    expect(contacted.a).toBeDefined(); // original map untouched
  });
});

describe('withContactNote', () => {
  it('records the note the tick wrote', () => {
    const entry = withContactNote(undefined, { at: NOW, noteId: 'n1' });
    expect(entry).toEqual({ at: NOW, summary: null, noteIds: ['n1'] });
  });

  it('adds the summary note without losing the tick or its first note', () => {
    const ticked = withContactNote(undefined, { at: NOW, noteId: 'n1' });
    const withSummary = withContactNote(ticked, { at: NOW + 9000, noteId: 'n2', summary: 'Callback Thursday' });
    expect(withSummary.at).toBe(NOW);
    expect(withSummary.summary).toBe('Callback Thursday');
    expect(withSummary.noteIds).toEqual(['n1', 'n2']);
  });
});

describe('undoableNoteIds', () => {
  it('returns every note the tick created, so undo removes all of them', () => {
    expect(undoableNoteIds({ at: NOW, summary: 'x', noteIds: ['n1', 'n2'] })).toEqual(['n1', 'n2']);
  });

  it('refuses to guess for ticks saved before note ids were tracked', () => {
    expect(undoableNoteIds({ at: NOW, summary: null } as ContactedEntry)).toEqual([]);
    expect(undoableNoteIds(undefined)).toEqual([]);
    expect(undoableNoteIds({ at: NOW, summary: null, noteIds: ['', null as any] })).toEqual([]);
  });
});

describe('pruneContacted', () => {
  it('keeps today\'s ticks and drops yesterday\'s', () => {
    const pruned = pruneContacted(
      {
        fresh: { at: NOW - 2 * 60 * 60 * 1000, summary: null, noteIds: ['n1'] },
        stale: { at: NOW - 30 * 60 * 60 * 1000, summary: null, noteIds: ['n2'] },
      },
      NOW,
    );
    expect(Object.keys(pruned)).toEqual(['fresh']);
  });

  it('survives junk in storage', () => {
    expect(pruneContacted({ bad: null as any, worse: { at: 'nope' } as any }, NOW)).toEqual({});
    expect(pruneContacted({} as any, NOW)).toEqual({});
  });
});
