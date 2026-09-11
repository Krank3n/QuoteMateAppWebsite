/**
 * The one-line "what happened last" for a row in the admin documents list.
 *
 * Kept pure so it can be tested without the page. Order is "most informative
 * single event": money first, then the customer's answer, then whether the
 * customer or the tradie acted most recently (a view vs a re-send), then the
 * first send. `sentAt` is first-send-only on the unified row; `lastSentAt`
 * and `sendCount` are stamped on every real send since 2026-09-11, so a doc
 * with `lastSentAt` later than `sentAt` was followed up or re-sent.
 */
export interface ActivitySource {
  type: 'quote' | 'invoice';
  stage: string;
  sentAt: number | null;
  lastSentAt?: number | null;
  sendCount?: number | null;
  respondedAt: number | null;
  lastViewedAt: number | null;
  depositPaidAt?: number | null;
  paidInFullAt: number | null;
}

export interface ActivityLine {
  word: string;
  at: number;
  /** Extra detail appended after the relative time, e.g. "×3". */
  suffix?: string;
}

export function wasResent(d: Pick<ActivitySource, 'sentAt' | 'lastSentAt'>): boolean {
  return !!d.lastSentAt && !!d.sentAt && d.lastSentAt > d.sentAt;
}

export function activityLine(d: ActivitySource): ActivityLine | null {
  if (d.paidInFullAt) return { word: 'paid', at: d.paidInFullAt };
  if (d.depositPaidAt && d.stage === 'quote_accepted') return { word: 'deposit', at: d.depositPaidAt };
  // An invoice only carries respondedAt because its quote was customer-accepted
  // before conversion (same document id), so say what actually happened.
  if (d.respondedAt) return { word: d.type === 'invoice' ? 'accepted' : 'responded', at: d.respondedAt };

  const resent = wasResent(d);
  const viewedAfterResend = !!d.lastViewedAt && (!resent || d.lastViewedAt > (d.lastSentAt as number));
  if (viewedAfterResend) return { word: 'viewed', at: d.lastViewedAt as number };
  if (resent) {
    const count = Number(d.sendCount) || 0;
    return { word: 're-sent', at: d.lastSentAt as number, suffix: count >= 2 ? `×${count}` : undefined };
  }
  if (d.lastViewedAt) return { word: 'viewed', at: d.lastViewedAt };
  if (d.sentAt) return { word: 'sent', at: d.sentAt };
  return null;
}
