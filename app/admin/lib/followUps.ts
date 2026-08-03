// Follow-up queue logic for the admin dashboard — kept out of the page
// component so the prioritisation and contact bookkeeping can be tested.

export interface FollowUpUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  businessName: string | null;
  phone: string | null;
  signupAt: number | null;
  lastActivityAt: number | null;
  planTier: string;
  quoteCount: number;
  invoiceCount: number;
  supplierBookCount: number;
  healthScore: number;
  squareStatus: 'connected' | 'broken' | 'none';
  noteCount: number;
  lastNoteAt: number | null;
}

export interface FollowUpSubscription {
  uid: string;
  status: string;
  currentPeriodEnd: number | null;
  cancelAt: number | null;
  // Real trial end (trialStartedAt + 14 days), from deriveSubFields. Never use
  // currentPeriodEnd for trial dates — on a non-Pro account that is the month
  // end of the free-quote counter, so it reads "trial ended" every 1st.
  trialEndsAt: number | null;
}

export interface FollowUpSource {
  users: FollowUpUser[];
  subscriptions: FollowUpSubscription[];
}

export type FollowUpKind = 'trial' | 'new' | 'stuck' | 'canceling' | 'square';
export type FollowUpPriority = 'urgent' | 'soon' | 'new';

export interface FollowUpItem extends FollowUpUser {
  name: string;
  priority: FollowUpPriority;
  score: number;
  kinds: FollowUpKind[];
  reasons: string[];
  onboardingSummary: string;
}

/** A person ticked off this session: the note is already saved server-side. */
export interface ContactedEntry {
  at: number;
  summary: string | null;
}

export type ContactedMap = Record<string, ContactedEntry>;

export const DAY = 24 * 60 * 60 * 1000;

export const FOLLOW_UP_FILTERS: Array<{ id: 'all' | FollowUpKind; label: string }> = [
  { id: 'all', label: 'All priorities' },
  { id: 'trial', label: 'Trials' },
  { id: 'new', label: 'New signups' },
  { id: 'stuck', label: 'Stuck' },
  { id: 'canceling', label: 'Canceling' },
  { id: 'square', label: 'Square issues' },
];

export function buildFollowUps(source: FollowUpSource | null, now: number = Date.now()): FollowUpItem[] {
  if (!source) return [];
  const subscriptions = new Map(source.subscriptions.map((sub) => [sub.uid, sub]));
  const result: FollowUpItem[] = [];

  for (const user of source.users) {
    const sub = subscriptions.get(user.uid);
    const kinds: FollowUpKind[] = [];
    const reasons: string[] = [];
    let score = 0;
    const signupAge = user.signupAt ? now - user.signupAt : Infinity;
    const inactiveFor = user.lastActivityAt ? now - user.lastActivityAt : Infinity;
    const status = sub?.status || user.planTier;
    const trialEndsAt = sub?.trialEndsAt || null;

    if (status === 'trialing') {
      // Still trialing by definition (status is derived from trialStartedAt +
      // 14 days), so this branch never reports a trial as over.
      const remaining = trialEndsAt !== null ? trialEndsAt - now : null;
      const days = remaining !== null ? Math.ceil(remaining / DAY) : null;
      if (remaining !== null && days !== null && days <= 7) {
        kinds.push('trial');
        // Measured off the hours left, not the rounded day count — a trial
        // with two hours to run is not "tomorrow".
        if (remaining <= DAY) reasons.push('Trial ends today');
        else if (remaining <= 2 * DAY) reasons.push('Trial ends tomorrow');
        else reasons.push(`Trial ends in ${days} days`);
        score += days <= 1 ? 100 : days <= 3 ? 82 : 65;
      }
    } else if (status === 'trial_expired') {
      const daysSinceEnd = trialEndsAt ? Math.floor((now - trialEndsAt) / DAY) : null;
      if (daysSinceEnd === null || daysSinceEnd <= 14) {
        kinds.push('trial');
        reasons.push(daysSinceEnd !== null && daysSinceEnd > 0 ? `Trial expired ${daysSinceEnd}d ago` : 'Trial has expired');
        score += 94;
      }
    }

    if (status === 'canceling' || status === 'pro_canceling') {
      const periodEnd = sub?.cancelAt || sub?.currentPeriodEnd;
      kinds.push('canceling');
      const days = periodEnd ? Math.max(0, Math.ceil((periodEnd - now) / DAY)) : null;
      reasons.push(days !== null ? `Subscription cancels in ${days}d` : 'Subscription is canceling');
      score += 96;
    }

    if (user.squareStatus === 'broken') {
      kinds.push('square');
      reasons.push('Square connection needs help');
      score += 90;
    }

    if (signupAge <= 7 * DAY && (user.noteCount || 0) === 0) {
      kinds.push('new');
      reasons.push(signupAge < DAY ? 'New signup today — welcome call' : `New signup ${Math.max(1, Math.floor(signupAge / DAY))}d ago — not contacted`);
      score += signupAge < DAY ? 72 : 55;
    }

    if (signupAge >= 2 * DAY && signupAge <= 21 * DAY && user.quoteCount === 0 && inactiveFor >= 2 * DAY) {
      kinds.push('stuck');
      reasons.push(`No quote yet · inactive ${formatDays(inactiveFor)}`);
      score += 68;
    }

    if (kinds.length === 0) continue;
    if (user.phone) score += 4;
    if ((user.healthScore || 0) < 30) score += 6;

    const priority: FollowUpPriority = score >= 90 ? 'urgent' : score >= 65 ? 'soon' : 'new';
    result.push({
      ...user,
      name: user.businessName || user.displayName || user.email || user.uid.slice(0, 8),
      priority,
      score,
      kinds: Array.from(new Set(kinds)),
      reasons,
      onboardingSummary: onboardingSummary(user),
    });
  }

  return result.sort((a, b) => b.score - a.score || (b.signupAt || 0) - (a.signupAt || 0));
}

export function onboardingSummary(user: FollowUpUser): string {
  if (user.quoteCount > 0) {
    return `${user.quoteCount} quote${user.quoteCount === 1 ? '' : 's'} · ${user.invoiceCount || 0} invoice${user.invoiceCount === 1 ? '' : 's'}`;
  }
  if (user.supplierBookCount > 0) return `${user.supplierBookCount} supplier${user.supplierBookCount === 1 ? '' : 's'} added · no quote yet`;
  if (user.businessName) return 'Business set up · no supplier or quote yet';
  return 'Account created · onboarding not started';
}

export function formatDays(ms: number): string {
  if (!Number.isFinite(ms)) return 'since signup';
  const days = Math.max(1, Math.floor(ms / DAY));
  return `${days}d`;
}

/**
 * What to write into the CRM note when someone is ticked off the list. The
 * summary is optional — ticking the box on its own still has to leave a
 * readable trail, since that note is what clears "never contacted".
 */
export function contactNoteText(summary?: string | null): string {
  return (summary || '').trim() || 'Contacted';
}

/** Ticked-off rows stay on screen but stop counting as outstanding work. */
export function outstanding(items: FollowUpItem[], contacted: ContactedMap): FollowUpItem[] {
  return items.filter((item) => !contacted[item.uid]);
}

export function followUpCounts(items: FollowUpItem[], contacted: ContactedMap): Record<string, number> {
  const open = outstanding(items, contacted);
  const counts: Record<string, number> = { all: open.length };
  for (const filter of FOLLOW_UP_FILTERS.slice(1)) {
    counts[filter.id] = open.filter((item) => item.kinds.includes(filter.id as FollowUpKind)).length;
  }
  return counts;
}

/**
 * Drop ticks older than a day. They are only a local echo of a note that the
 * server already has — once listUsers reports the note, the row falls out of
 * the queue on its own and a stale tick would hide fresh work.
 */
export function pruneContacted(contacted: ContactedMap, now: number = Date.now(), maxAgeMs: number = DAY): ContactedMap {
  const out: ContactedMap = {};
  for (const [uid, entry] of Object.entries(contacted || {})) {
    if (entry && typeof entry.at === 'number' && now - entry.at < maxAgeMs) out[uid] = entry;
  }
  return out;
}
