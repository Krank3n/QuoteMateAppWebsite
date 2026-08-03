'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';
import { api, fmtRelative } from './lib/adminApi';
import { getCached, setCached } from './lib/cache';
import { useSetPageMeta } from './lib/pageMeta';
import {
  IconUsers,
  IconSupplier,
  IconSubscription,
  IconFeedback,
  IconTrendUp,
  IconExternal,
  IconPhone,
  IconClock,
} from './components/icons';
import { Sparkline, pctChange } from './components/Sparkline';

interface Stats {
  users: { total: number; signupsToday: number; signupsThisWeek: number; activeSevenDay: number };
  subscriptions: { active: number; canceling: number; canceled: number; trialing: number; trialExpired: number };
  suppliers: { total: number; top: Array<{ id: string; name: string; subscriberCount: number }> };
  feedback: Array<{ id: string; message?: string; rating?: number; email?: string; createdAt?: any; replied?: boolean }>;
  generatedAt: string;
}

interface Snapshot {
  date: string;
  usersTotal?: number;
  signupsToday?: number;
  active7d?: number;
  subscriptionsActive?: number;
  subscriptionsPro?: number;
  subscriptionsCanceled?: number;
  suppliersTotal?: number;
}

interface FollowUpUser {
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

interface FollowUpSubscription {
  uid: string;
  status: string;
  currentPeriodEnd: number | null;
  cancelAt: number | null;
  // Real trial end (trialStartedAt + 14 days), from deriveSubFields. Never use
  // currentPeriodEnd for trial dates — on a non-Pro account that is the month
  // end of the free-quote counter, so it reads "trial ended" every 1st.
  trialEndsAt: number | null;
}

interface FollowUpSource {
  users: FollowUpUser[];
  subscriptions: FollowUpSubscription[];
}

type FollowUpKind = 'trial' | 'new' | 'stuck' | 'canceling' | 'square';
type FollowUpPriority = 'urgent' | 'soon' | 'new';

interface FollowUpItem extends FollowUpUser {
  name: string;
  priority: FollowUpPriority;
  score: number;
  kinds: FollowUpKind[];
  reasons: string[];
  onboardingSummary: string;
}

const DAY = 24 * 60 * 60 * 1000;
const FOLLOW_UP_FILTERS: Array<{ id: 'all' | FollowUpKind; label: string }> = [
  { id: 'all', label: 'All priorities' },
  { id: 'trial', label: 'Trials' },
  { id: 'new', label: 'New signups' },
  { id: 'stuck', label: 'Stuck' },
  { id: 'canceling', label: 'Canceling' },
  { id: 'square', label: 'Square issues' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [series, setSeries] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpSource, setFollowUpSource] = useState<FollowUpSource | null>(null);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<(typeof FOLLOW_UP_FILTERS)[number]['id']>('all');

  useEffect(() => {
    let cancelled = false;

    // Instant paint from cache, then revalidate in the background.
    const cachedStats = getCached<Stats>('dashboard-stats');
    const cachedSeries = getCached<Snapshot[]>('dashboard-series');
    if (cachedStats && cachedSeries) {
      setStats(cachedStats);
      setSeries(cachedSeries);
      setLoading(false);
    }

    Promise.all([api.dashboardStats({}), api.metricsSeries({ days: 30 })])
      .then(([s, series]: any) => {
        if (cancelled) return;
        const freshStats = s as Stats;
        const freshSeries = (series?.series as Snapshot[]) || [];
        setStats(freshStats);
        setSeries(freshSeries);
        setLoading(false);
        setCached('dashboard-stats', freshStats);
        setCached('dashboard-series', freshSeries);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load stats');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = getCached<FollowUpSource>('dashboard-follow-ups');
    if (cached) {
      setFollowUpSource(cached);
      setFollowUpsLoading(false);
    }

    Promise.all([
      api.listUsers({ limit: 500 }),
      api.listSubscriptions({}).catch(() => ({ subscriptions: [] })),
    ])
      .then(([userResult, subscriptionResult]: any[]) => {
        if (cancelled) return;
        const source: FollowUpSource = {
          users: userResult?.users || [],
          subscriptions: subscriptionResult?.subscriptions || [],
        };
        setFollowUpSource(source);
        setFollowUpsLoading(false);
        setCached('dashboard-follow-ups', source);
      })
      .catch((e) => {
        if (cancelled) return;
        setFollowUpsError(e?.message || 'Failed to build the follow-up list');
        setFollowUpsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const followUps = useMemo(() => buildFollowUps(followUpSource), [followUpSource]);
  const visibleFollowUps = useMemo(
    () => followUps.filter((item) => followUpFilter === 'all' || item.kinds.includes(followUpFilter)),
    [followUps, followUpFilter],
  );
  const followUpCounts = useMemo(() => {
    const counts: Record<string, number> = { all: followUps.length };
    for (const filter of FOLLOW_UP_FILTERS.slice(1)) {
      counts[filter.id] = followUps.filter((item) => item.kinds.includes(filter.id as FollowUpKind)).length;
    }
    return counts;
  }, [followUps]);

  const usersTrend = series.map((s) => s.usersTotal || 0);
  const signupsTrend = series.map((s) => s.signupsToday || 0);
  const active7dTrend = series.map((s) => s.active7d || 0);
  const proTrend = series.map((s) => s.subscriptionsPro || 0);

  useSetPageMeta({ title: 'Dashboard', breadcrumb: 'Overview' });

  return (
    <>
      {loading && (
        <div className={styles.statGrid}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.skeleton} style={{ height: 14, width: '40%', marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ height: 32, width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className={styles.cardTitle}>Couldn't load dashboard</div>
          <div className={styles.cardSubtitle}>{error}</div>
        </div>
      )}

      {stats && (
        <>
          <div className={styles.statGrid}>
            <StatCard
              label="Total users"
              value={stats.users.total}
              sub={`${stats.users.signupsToday} new today · ${stats.users.signupsThisWeek} this week`}
              icon={<IconUsers />}
              series={usersTrend}
            />
            <StatCard
              label="Active (7d)"
              value={stats.users.activeSevenDay}
              sub={`${percent(stats.users.activeSevenDay, stats.users.total)} of base`}
              icon={<IconTrendUp />}
              series={active7dTrend}
            />
            <StatCard
              label="Pro + trials"
              value={stats.subscriptions.active + stats.subscriptions.canceling + stats.subscriptions.trialing}
              sub={`${stats.subscriptions.active} pro · ${stats.subscriptions.trialing} trial · ${stats.subscriptions.canceling} canceling`}
              icon={<IconSubscription />}
              accent
              series={proTrend}
            />
            <StatCard
              label="Suppliers"
              value={stats.suppliers.total}
              sub={`${stats.suppliers.top.reduce((a, s) => a + s.subscriberCount, 0)} subscriptions`}
              icon={<IconSupplier />}
            />
          </div>

          <FollowUpCentre
            items={visibleFollowUps}
            total={followUps.length}
            counts={followUpCounts}
            activeFilter={followUpFilter}
            onFilter={setFollowUpFilter}
            loading={followUpsLoading}
            error={followUpsError}
          />

          {series.length >= 2 && (
            <div className={styles.card} style={{ marginBottom: 20 }}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Last {series.length} days</div>
                  <div className={styles.cardSubtitle}>Trend snapshots</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <TrendTile label="Signups / day" series={signupsTrend} stroke="#60a5fa" fill="rgba(96, 165, 250, 0.15)" />
                <TrendTile label="Active 7d" series={active7dTrend} stroke="#10b981" fill="rgba(16, 185, 129, 0.15)" />
                <TrendTile label="Pro subscribers" series={proTrend} stroke="#f97316" fill="rgba(249, 115, 22, 0.15)" />
                <TrendTile label="Total users" series={usersTrend} stroke="#a78bfa" fill="rgba(168, 139, 250, 0.15)" />
              </div>
            </div>
          )}

          <div className={styles.dashGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Top suppliers by subscriber count</div>
                  <div className={styles.cardSubtitle}>Who's winning the tradie supply book</div>
                </div>
                <Link href="/admin/suppliers" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                  All suppliers <IconExternal style={{ width: 12, height: 12 }} />
                </Link>
              </div>
              {stats.suppliers.top.length === 0 ? (
                <EmptyInline label="No suppliers yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.suppliers.top.map((s) => (
                    <Link
                      key={s.id}
                      href={`/admin/suppliers?id=${encodeURIComponent(s.id)}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.04)',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          <SubscriberBar count={s.subscriberCount} max={stats.suppliers.top[0]?.subscriberCount || 1} />
                        </div>
                      </div>
                      <div style={{ alignSelf: 'center', fontWeight: 700, fontSize: 16 }}>
                        {s.subscriberCount}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Latest feedback</div>
                  <div className={styles.cardSubtitle}>Reply before it goes cold</div>
                </div>
                <Link href="/admin/feedback" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                  Inbox <IconExternal style={{ width: 12, height: 12 }} />
                </Link>
              </div>
              {stats.feedback.length === 0 ? (
                <EmptyInline label="Inbox zero." icon={<IconFeedback />} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {stats.feedback.slice(0, 6).map((f: any) => {
                    const ts = f.createdAt?._seconds
                      ? f.createdAt._seconds * 1000
                      : f.createdAt?.toMillis?.() || null;
                    return (
                      <div key={f.id} style={{
                        padding: 12,
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.15)',
                        border: '1px solid rgba(255,255,255,0.04)',
                      }}>
                        <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>
                          {(f.message || '').slice(0, 140)}{(f.message || '').length > 140 ? '…' : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', gap: 10 }}>
                          <span>{f.email || 'anonymous'}</span>
                          <span>{fmtRelative(ts)}</span>
                          {f.replied && <span style={{ color: '#10b981' }}>replied</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
            Refreshed {fmtRelative(new Date(stats.generatedAt).getTime())}
          </div>
        </>
      )}
    </>
  );
}

function FollowUpCentre({
  items,
  total,
  counts,
  activeFilter,
  onFilter,
  loading,
  error,
}: {
  items: FollowUpItem[];
  total: number;
  counts: Record<string, number>;
  activeFilter: (typeof FOLLOW_UP_FILTERS)[number]['id'];
  onFilter: (filter: (typeof FOLLOW_UP_FILTERS)[number]['id']) => void;
  loading: boolean;
  error: string | null;
}) {
  const urgentCount = items.filter((item) => item.priority === 'urgent').length;

  return (
    <section className={styles.followUpSection}>
      <div className={styles.followUpHeader}>
        <div>
          <div className={styles.followUpEyebrow}>Today&apos;s action list</div>
          <div className={styles.followUpTitle}>People to follow up</div>
          <div className={styles.cardSubtitle}>
            Prioritised from trial timing, onboarding progress and recent activity.
          </div>
        </div>
        <div className={styles.followUpHeaderStats}>
          {urgentCount > 0 && <span className={styles.followUpUrgentCount}>{urgentCount} urgent</span>}
          <span>{total} to review</span>
        </div>
      </div>

      <div className={styles.followUpFilters}>
        {FOLLOW_UP_FILTERS.map((filter) => (
          <button
            key={filter.id}
            className={`${styles.chip} ${activeFilter === filter.id ? styles.followUpFilterActive : ''}`}
            onClick={() => onFilter(filter.id)}
          >
            {filter.label} <span className={styles.followUpFilterCount}>{counts[filter.id] || 0}</span>
          </button>
        ))}
      </div>

      {loading && total === 0 ? (
        <div className={styles.followUpLoading}>
          {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : error && total === 0 ? (
        <div className={styles.followUpEmpty}>Couldn&apos;t load follow-ups: {error}</div>
      ) : items.length === 0 ? (
        <div className={styles.followUpEmpty}>
          <strong>Nothing in this queue.</strong>
          <span>Try another filter — or enjoy the clear list.</span>
        </div>
      ) : (
        <div className={styles.followUpList}>
          {items.slice(0, 18).map((item) => (
            <FollowUpRow key={item.uid} item={item} />
          ))}
          {items.length > 18 && (
            <Link href="/admin/users" className={styles.followUpMore}>
              Open users to review {items.length - 18} more <IconExternal />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}

function FollowUpRow({ item }: { item: FollowUpItem }) {
  const statusSteps = [
    { label: 'Account', done: true, warning: false },
    { label: 'Business', done: !!item.businessName, warning: false },
    { label: 'Supplier', done: item.supplierBookCount > 0, warning: false },
    { label: 'First quote', done: item.quoteCount > 0, warning: false },
    ...(item.squareStatus === 'none'
      ? []
      : [{ label: 'Square', done: item.squareStatus === 'connected', warning: item.squareStatus === 'broken' }]),
  ];

  return (
    <div className={styles.followUpRow}>
      <div className={styles.followUpPerson}>
        <span className={`${styles.followUpPriorityDot} ${styles[`followUpPriority${capitalize(item.priority)}`]}`} />
        <div className={styles.listAvatar}>{initialsForFollowUp(item.name)}</div>
        <div className={styles.followUpPersonBody}>
          <Link href={`/admin/users?uid=${encodeURIComponent(item.uid)}`} className={styles.followUpPersonName}>
            {item.name}
          </Link>
          <div className={styles.followUpPersonMeta}>
            {item.phone || item.email || 'No contact details'}
          </div>
        </div>
      </div>

      <div className={styles.followUpReason}>
        <div className={styles.followUpReasonTop}>
          <span className={`${styles.followUpPriorityLabel} ${styles[`followUpPriorityText${capitalize(item.priority)}`]}`}>
            {item.priority}
          </span>
          <span>{item.reasons[0]}</span>
        </div>
        {item.reasons.length > 1 && (
          <div className={styles.followUpReasonMore}>{item.reasons.slice(1).join(' · ')}</div>
        )}
        <div className={styles.followUpTiming}>
          <IconClock /> Joined {fmtRelative(item.signupAt)} · active {fmtRelative(item.lastActivityAt)}
          {item.lastNoteAt ? ` · touched ${fmtRelative(item.lastNoteAt)}` : ' · never contacted'}
        </div>
      </div>

      <div className={styles.followUpProgress}>
        <div className={styles.followUpProgressSummary}>{item.onboardingSummary}</div>
        <div className={styles.followUpSteps}>
          {statusSteps.map((step) => (
            <span
              key={step.label}
              className={`${styles.followUpStep} ${step.warning ? styles.followUpStepWarning : step.done ? styles.followUpStepDone : ''}`}
            >
              <span>{step.warning ? '!' : step.done ? '✓' : '○'}</span> {step.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.followUpActions}>
        {item.phone ? (
          <a href={`tel:${item.phone}`} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}>
            <IconPhone /> Call
          </a>
        ) : (
          <Link href={`/admin/users?uid=${encodeURIComponent(item.uid)}`} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>
            View
          </Link>
        )}
        <Link
          href={`/admin/users?uid=${encodeURIComponent(item.uid)}`}
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
          title="Open full CRM profile and log the outcome"
        >
          <IconExternal />
        </Link>
      </div>
    </div>
  );
}

function buildFollowUps(source: FollowUpSource | null): FollowUpItem[] {
  if (!source) return [];
  const now = Date.now();
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
      const days = trialEndsAt ? Math.ceil((trialEndsAt - now) / DAY) : null;
      if (days !== null && days <= 7) {
        kinds.push('trial');
        if (days <= 0) reasons.push('Trial ends today');
        else if (days === 1) reasons.push('Trial ends tomorrow');
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

function onboardingSummary(user: FollowUpUser): string {
  if (user.quoteCount > 0) {
    return `${user.quoteCount} quote${user.quoteCount === 1 ? '' : 's'} · ${user.invoiceCount || 0} invoice${user.invoiceCount === 1 ? '' : 's'}`;
  }
  if (user.supplierBookCount > 0) return `${user.supplierBookCount} supplier${user.supplierBookCount === 1 ? '' : 's'} added · no quote yet`;
  if (user.businessName) return 'Business set up · no supplier or quote yet';
  return 'Account created · onboarding not started';
}

function formatDays(ms: number): string {
  if (!Number.isFinite(ms)) return 'since signup';
  const days = Math.max(1, Math.floor(ms / DAY));
  return `${days}d`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initialsForFollowUp(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  series,
}: {
  label: string;
  value: number;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
  series?: number[];
}) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
        <div className={styles.statLabel}>{label}</div>
        {icon && (
          <div style={{ opacity: 0.5, color: accent ? 'var(--color-accent-light)' : undefined }}>
            <span style={{ display: 'inline-block', width: 18, height: 18 }}>
              {icon as any}
            </span>
          </div>
        )}
      </div>
      <div className={styles.statValue}>{value.toLocaleString()}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
      {series && series.length >= 2 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline values={series} height={32} />
        </div>
      )}
    </div>
  );
}

function TrendTile({ label, series, stroke, fill }: { label: string; series: number[]; stroke: string; fill: string }) {
  const change = pctChange(series);
  const last = series[series.length - 1] || 0;
  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)' }}>{label}</div>
        {change && (
          <div style={{ fontSize: 11, fontWeight: 700, color: change.delta >= 0 ? '#6ee7b7' : '#fca5a5' }}>{change.label}</div>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>{last.toLocaleString()}</div>
      <Sparkline values={series} height={36} stroke={stroke} fill={fill} />
    </div>
  );
}

function SubscriberBar({ count, max }: { count: number; max: number }) {
  const w = Math.max(4, Math.min(100, (count / max) * 100));
  return (
    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${w}%`,
          background: 'var(--gradient-accent)',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

function EmptyInline({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>
      {icon}
      <div style={{ marginTop: 8 }}>{label}</div>
    </div>
  );
}

function percent(a: number, b: number) {
  if (!b) return '0%';
  return `${Math.round((a / b) * 100)}%`;
}
