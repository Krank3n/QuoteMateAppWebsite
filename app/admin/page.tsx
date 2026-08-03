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
import {
  buildFollowUps,
  contactNoteText,
  followUpCounts,
  outstanding,
  pruneContacted,
  FOLLOW_UP_FILTERS,
  type ContactedEntry,
  type ContactedMap,
  type FollowUpItem,
  type FollowUpSource,
} from './lib/followUps';

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


export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [series, setSeries] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpSource, setFollowUpSource] = useState<FollowUpSource | null>(null);
  const [followUpsLoading, setFollowUpsLoading] = useState(true);
  const [followUpsError, setFollowUpsError] = useState<string | null>(null);
  const [followUpFilter, setFollowUpFilter] = useState<(typeof FOLLOW_UP_FILTERS)[number]['id']>('all');
  const [contacted, setContacted] = useState<ContactedMap>({});

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

  // Ticks live on until the server-side note comes back through listUsers,
  // which is what actually drops the row out of the queue.
  useEffect(() => {
    const stored = getCached<ContactedMap>('dashboard-contacted');
    if (stored) setContacted(pruneContacted(stored));
  }, []);

  const markContacted = (uid: string, entry: ContactedEntry) => {
    setContacted((prev) => {
      const next = pruneContacted({ ...prev, [uid]: entry });
      setCached('dashboard-contacted', next);
      return next;
    });
  };

  const followUps = useMemo(() => buildFollowUps(followUpSource), [followUpSource]);
  const visibleFollowUps = useMemo(
    () => followUps.filter((item) => followUpFilter === 'all' || item.kinds.includes(followUpFilter)),
    [followUps, followUpFilter],
  );
  const counts = useMemo(() => followUpCounts(followUps, contacted), [followUps, contacted]);
  const openCount = useMemo(() => outstanding(followUps, contacted).length, [followUps, contacted]);

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
            total={openCount}
            counts={counts}
            contacted={contacted}
            onContacted={markContacted}
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
  contacted,
  onContacted,
  activeFilter,
  onFilter,
  loading,
  error,
}: {
  items: FollowUpItem[];
  total: number;
  counts: Record<string, number>;
  contacted: ContactedMap;
  onContacted: (uid: string, entry: ContactedEntry) => void;
  activeFilter: (typeof FOLLOW_UP_FILTERS)[number]['id'];
  onFilter: (filter: (typeof FOLLOW_UP_FILTERS)[number]['id']) => void;
  loading: boolean;
  error: string | null;
}) {
  const urgentCount = items.filter((item) => item.priority === 'urgent' && !contacted[item.uid]).length;
  const doneCount = items.filter((item) => contacted[item.uid]).length;

  return (
    <section className={styles.followUpSection}>
      <div className={styles.followUpHeader}>
        <div>
          <div className={styles.followUpEyebrow}>Today&apos;s action list</div>
          <div className={styles.followUpTitle}>People to follow up</div>
          <div className={styles.cardSubtitle}>
            Prioritised from trial timing, onboarding progress and recent activity. Tick someone off once
            you&apos;ve spoken to them — it logs a note against their profile.
          </div>
        </div>
        <div className={styles.followUpHeaderStats}>
          {urgentCount > 0 && <span className={styles.followUpUrgentCount}>{urgentCount} urgent</span>}
          <span>{total} to review</span>
          {doneCount > 0 && <span className={styles.followUpDoneCount}>{doneCount} done</span>}
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
            <FollowUpRow key={item.uid} item={item} contacted={contacted[item.uid]} onContacted={onContacted} />
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

function FollowUpRow({
  item,
  contacted,
  onContacted,
}: {
  item: FollowUpItem;
  contacted: ContactedEntry | undefined;
  onContacted: (uid: string, entry: ContactedEntry) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [summarySaving, setSummarySaving] = useState(false);

  // The tick writes straight away with a plain "Contacted" note, so a single
  // click is never lost. The summary is a second, optional note on top.
  const tick = async () => {
    if (contacted || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.addUserNote({ uid: item.uid, note: contactNoteText() });
      onContacted(item.uid, { at: Date.now(), summary: null });
    } catch (e: any) {
      setSaveError(e?.message || 'Could not save that');
    } finally {
      setSaving(false);
    }
  };

  const saveSummary = async () => {
    const note = summary.trim();
    if (!note || summarySaving) return;
    setSummarySaving(true);
    setSaveError(null);
    try {
      await api.addUserNote({ uid: item.uid, note });
      onContacted(item.uid, { at: contacted?.at || Date.now(), summary: note });
      setSummary('');
    } catch (e: any) {
      setSaveError(e?.message || 'Could not save that');
    } finally {
      setSummarySaving(false);
    }
  };

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
    <div className={`${styles.followUpRow} ${contacted ? styles.followUpRowDone : ''}`}>
      <div className={styles.followUpPerson}>
        <button
          type="button"
          role="checkbox"
          aria-checked={!!contacted}
          aria-label={contacted ? `${item.name} contacted` : `Mark ${item.name} as contacted`}
          title={contacted ? 'Contacted — note saved to their profile' : 'Tick once you’ve spoken to them'}
          className={`${styles.followUpTick} ${contacted ? styles.followUpTickDone : ''}`}
          onClick={tick}
          disabled={!!contacted || saving}
        >
          {contacted ? '✓' : saving ? '…' : ''}
        </button>
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
          {contacted
            ? ' · contacted just now'
            : item.lastNoteAt
            ? ` · touched ${fmtRelative(item.lastNoteAt)}`
            : ' · never contacted'}
        </div>

        {contacted && (
          contacted.summary ? (
            <div className={styles.followUpContactNote}>“{contacted.summary}”</div>
          ) : (
            <form
              className={styles.followUpContactForm}
              onSubmit={(e) => { e.preventDefault(); saveSummary(); }}
            >
              <input
                className={styles.followUpContactInput}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Add what happened (optional)"
                maxLength={280}
                disabled={summarySaving}
              />
              {summary.trim() && (
                <button type="submit" className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={summarySaving}>
                  {summarySaving ? 'Saving…' : 'Save'}
                </button>
              )}
            </form>
          )
        )}

        {saveError && <div className={styles.followUpContactError}>{saveError}</div>}
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
