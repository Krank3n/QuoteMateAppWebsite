'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { getCached, setCached } from '../lib/cache';
import { useSetPageMeta } from '../lib/pageMeta';
import { Sparkline } from '../components/Sparkline';
import { IconTrendUp, IconUsers, IconExternal } from '../components/icons';

interface Traffic {
  propertyId: string;
  days: number;
  generatedAt: string;
  summary: {
    sessions: number;
    users: number;
    newUsers: number;
    pageViews: number;
    avgSessionDuration: number;
    engagementRate: number;
  };
  channels: Array<{ channel: string; sessions: number; users: number; newUsers: number }>;
  daily: Array<{ date: string; sessions: number; users: number }>;
  funnel: {
    sessions: number;
    engaged: number;
    ctaClicks: number;
    byCta: { web: number; appStore: number; googlePlay: number; cta: number; pricing: number };
    formStarts: number;
  };
  topPages: Array<{ path: string; views: number; sessions: number; users: number }>;
  abTest:
    | { available: false; reason: string }
    | { available: true; variants: Array<{ variant: string; impressions: number; ctaClicks: number; ctr: number }> };
}

interface FunnelActionRow {
  uid: string;
  email: string | null;
  businessName: string | null;
  signupAt: number | null;
  lastActivityAt: number | null;
  trialDaysRemaining: number | null;
}

interface Funnel {
  funnel: {
    signups: number;
    startedTrial: number;
    sentQuote: number;
    paying: number;
    pctStartedTrial: number;
    pctSentQuote: number;
    pctPaying: number;
  };
  conversion: {
    trialToPaid: number;
    activationRate: number;
  };
  expiringTrials: number;
  actionable: {
    neverSentQuote: FunnelActionRow[];
    expiringTrialsInactive: FunnelActionRow[];
  };
  asOf: number;
  cached: boolean;
}

const DAY_OPTIONS = [7, 28, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<Traffic | null>(null);
  const [signups7d, setSignups7d] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [funnelError, setFunnelError] = useState<string | null>(null);

  useSetPageMeta({
    title: 'Analytics',
    breadcrumb: 'Web traffic',
    actions: (
      <div style={{ display: 'flex', gap: 6 }}>
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            className={`${styles.btn} ${styles.btnSmall} ${d === days ? styles.btnPrimary : styles.btnGhost}`}
            onClick={() => setDays(d)}
          >
            {d}d
          </button>
        ))}
      </div>
    ),
  });

  useEffect(() => {
    let cancelled = false;
    const cacheKey = `analytics-traffic-${days}`;
    const cached = getCached<Traffic>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    Promise.all([api.trafficStats({ days }), api.dashboardStats({}).catch(() => null)])
      .then(([t, s]: any) => {
        if (cancelled) return;
        setData(t as Traffic);
        setCached(cacheKey, t);
        setSignups7d(s?.users?.signupsThisWeek ?? null);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load analytics');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  // Business health funnel — not day-scoped, so it loads once. Instant-paint
  // from cache, then revalidate, exactly like the traffic stats above.
  useEffect(() => {
    let cancelled = false;
    const cached = getCached<Funnel>('analytics-funnel');
    if (cached) setFunnel(cached);
    setFunnelError(null);

    api
      .funnelStats({})
      .then((f: any) => {
        if (cancelled) return;
        setFunnel(f as Funnel);
        setCached('analytics-funnel', f);
      })
      .catch((e) => {
        if (!cancelled) setFunnelError(e?.message || 'Failed to load business health');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sessionsSeries = (data?.daily || []).map((d) => d.sessions);
  const usersSeries = (data?.daily || []).map((d) => d.users);

  return (
    <>
      {/* Business health — trial→paid conversion is the founder's #1 metric, so
          it sits above the web-traffic content. */}
      <BusinessHealth funnel={funnel} error={funnelError} />

      {loading && !data && (
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
          <div className={styles.cardTitle}>Couldn't load analytics</div>
          <div className={styles.cardSubtitle}>{error}</div>
          <div className={styles.cardSubtitle} style={{ marginTop: 8 }}>
            If this says the function isn't found, deploy <code>adminTrafficStats</code> first.
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Headline metrics */}
          <div className={styles.statGrid}>
            <StatCard label="Sessions" value={data.summary.sessions} sub={`last ${data.days} days`} icon={<IconTrendUp />} series={sessionsSeries} />
            <StatCard label="Users" value={data.summary.users} sub={`${data.summary.newUsers.toLocaleString()} new`} icon={<IconUsers />} series={usersSeries} />
            <StatCard label="Page views" value={data.summary.pageViews} sub={`${avg(data.summary.pageViews, data.summary.sessions)} / session`} />
            <StatCard
              label="Engagement"
              value={Math.round(data.summary.engagementRate * 100)}
              valueSuffix="%"
              sub={`${fmtDuration(data.summary.avgSessionDuration)} avg session`}
              accent
            />
          </div>

          <div className={styles.dashGrid}>
            {/* Acquisition by channel */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Acquisition by channel</div>
                  <div className={styles.cardSubtitle}>Where sessions come from</div>
                </div>
              </div>
              {data.channels.length === 0 ? (
                <EmptyInline label="No sessions in range" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.channels.map((c) => (
                    <div key={c.channel} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{c.channel}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {c.sessions.toLocaleString()} · {pct(c.sessions, data.summary.sessions)}
                          </span>
                        </div>
                        <Bar value={c.sessions} max={data.channels[0]?.sessions || 1} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signup funnel */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Signup funnel</div>
                  <div className={styles.cardSubtitle}>Web → CTA → app signup</div>
                </div>
              </div>
              <FunnelStep label="Sessions" value={data.funnel.sessions} max={data.funnel.sessions} />
              <FunnelStep label="Engaged sessions" value={data.funnel.engaged} max={data.funnel.sessions} />
              <FunnelStep
                label="Store / web CTA clicks"
                value={data.funnel.ctaClicks}
                max={data.funnel.sessions}
                detail={`web ${data.funnel.byCta.web} · App Store ${data.funnel.byCta.appStore} · Play ${data.funnel.byCta.googlePlay} · pricing ${data.funnel.byCta.pricing}`}
              />
              {signups7d !== null && (
                <FunnelStep label="App signups (7d)" value={signups7d} max={data.funnel.sessions} note="separate timeframe — from Firestore" accent />
              )}
            </div>
          </div>

          {/* Hero A/B test */}
          <div className={styles.card} style={{ marginTop: 16 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Hero A/B test</div>
                <div className={styles.cardSubtitle}>experiment_impression → CTA click-through, by variant</div>
              </div>
            </div>
            {data.abTest.available ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {data.abTest.variants.map((v) => {
                  const winner = Math.max(...(data.abTest as any).variants.map((x: any) => x.ctr));
                  const isWinner = v.ctr === winner && v.impressions > 0;
                  return (
                    <div key={v.variant} style={{ padding: 14, borderRadius: 12, background: 'rgba(0,0,0,0.2)', border: `1px solid ${isWinner ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.05)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>Variant {v.variant}</span>
                        {isWinner && <span className={styles.miniBadge} style={{ color: '#6ee7b7' }}>leading</span>}
                      </div>
                      <div style={{ fontSize: 26, fontWeight: 800 }}>{(v.ctr * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                        {v.ctaClicks.toLocaleString()} clicks / {v.impressions.toLocaleString()} impressions
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '8px 2px' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                  Not available yet. {data.abTest.reason}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
                  GA → <strong>Admin</strong> → <strong>Custom definitions</strong> → <strong>Create custom dimensions</strong>
                  <br />Dimension name: <code>Hero variant</code> · Scope: <code>Event</code> · Event parameter: <code>variant</code>
                </div>
              </div>
            )}
          </div>

          {/* Top pages */}
          <div className={styles.card} style={{ marginTop: 16 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Top pages</div>
                <div className={styles.cardSubtitle}>Marketing pages only (admin excluded)</div>
              </div>
              <a href={`https://analytics.google.com/analytics/web/#/p${data.propertyId}/reports/intelligenthome`} target="_blank" rel="noreferrer" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                Open GA <IconExternal style={{ width: 12, height: 12 }} />
              </a>
            </div>
            {data.topPages.length === 0 ? (
              <EmptyInline label="No page views in range" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.topPages.map((p) => (
                  <div key={p.path} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.15)', fontSize: 13 }}>
                    <Link href={`https://quotemateapp.au${p.path}`} target="_blank" style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.path}
                    </Link>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{p.views.toLocaleString()} views</span>
                    <span style={{ color: 'var(--color-text-tertiary)', minWidth: 70, textAlign: 'right' }}>{p.users.toLocaleString()} users</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
            GA property {data.propertyId} · refreshed {fmtRelative(new Date(data.generatedAt).getTime())}
          </div>
        </>
      )}
    </>
  );
}

function BusinessHealth({ funnel, error }: { funnel: Funnel | null; error: string | null }) {
  const title = (
    <div className={styles.cardHeader} style={{ marginBottom: 12 }}>
      <div>
        <div className={styles.cardTitle}>Business health</div>
        <div className={styles.cardSubtitle}>Signup → trial → sent quote → paying</div>
      </div>
    </div>
  );

  if (error && !funnel) {
    return (
      <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 }}>
        <div className={styles.cardTitle}>Couldn't load business health</div>
        <div className={styles.cardSubtitle}>{error}</div>
        <div className={styles.cardSubtitle} style={{ marginTop: 8 }}>
          If this says the function isn't found, deploy <code>adminFunnelStats</code> first.
        </div>
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className={styles.statGrid} style={{ marginBottom: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={styles.statCard}>
            <div className={styles.skeleton} style={{ height: 14, width: '40%', marginBottom: 12 }} />
            <div className={styles.skeleton} style={{ height: 32, width: '60%' }} />
          </div>
        ))}
      </div>
    );
  }

  const f = funnel.funnel;
  const c = funnel.conversion;

  return (
    <div style={{ marginBottom: 24 }}>
      {title}

      {/* North-star cards. Trial→paid is highlighted (target 5%). */}
      <div className={styles.statGrid}>
        <StatCard
          label="Trial → paid"
          value={pct1(c.trialToPaid)}
          valueSuffix="%"
          sub={`${f.paying.toLocaleString()} of ${f.startedTrial.toLocaleString()} trials · target 5%`}
          accent
        />
        <StatCard
          label="Activation"
          value={pct1(c.activationRate)}
          valueSuffix="%"
          sub={`${f.sentQuote.toLocaleString()} of ${f.signups.toLocaleString()} sent a quote`}
        />
        <StatCard label="Paying customers" value={f.paying} sub="billed subscriptions" />
        <StatCard
          label="Trials expiring ≤3d"
          value={funnel.expiringTrials}
          sub={`${funnel.actionable.expiringTrialsInactive.length.toLocaleString()} inactive · need a nudge`}
        />
      </div>

      <div className={styles.dashGrid}>
        {/* Conversion funnel */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Conversion funnel</div>
              <div className={styles.cardSubtitle}>Each step as a share of signups</div>
            </div>
          </div>
          <FunnelStep label="Signups" value={f.signups} max={f.signups} />
          <FunnelStep label="Started a trial" value={f.startedTrial} max={f.signups} detail={`${pct1(f.pctStartedTrial)}% of signups`} />
          <FunnelStep label="Sent a quote" value={f.sentQuote} max={f.signups} detail={`${pct1(f.pctSentQuote)}% of trials`} />
          <FunnelStep label="Paying" value={f.paying} max={f.signups} detail={`${pct1(f.pctPaying)}% of quoters`} accent />
        </div>

        {/* Actionable: never sent a quote */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Signed up, never sent a quote</div>
              <div className={styles.cardSubtitle}>≥2 days in, still no quote or invoice sent</div>
            </div>
          </div>
          <ActionTable rows={funnel.actionable.neverSentQuote} lastCol="activity" emptyLabel="Everyone past the grace window has sent something" />
        </div>
      </div>

      {/* Actionable: expiring trials with no recent activity */}
      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Expiring trials to nudge</div>
            <div className={styles.cardSubtitle}>≤3 days left and no activity in the last week</div>
          </div>
        </div>
        <ActionTable rows={funnel.actionable.expiringTrialsInactive} lastCol="daysLeft" emptyLabel="No expiring trials need a nudge right now" />
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
        refreshed {fmtRelative(funnel.asOf)}
        {funnel.cached ? ' · cached' : ''}
      </div>
    </div>
  );
}

function ActionTable({ rows, lastCol, emptyLabel }: { rows: FunnelActionRow[]; lastCol: 'activity' | 'daysLeft'; emptyLabel: string }) {
  if (rows.length === 0) return <EmptyInline label={emptyLabel} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, padding: '2px 12px', fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        <span>Email</span>
        <span style={{ textAlign: 'right' }}>Signed up</span>
        <span style={{ textAlign: 'right', minWidth: 84 }}>{lastCol === 'daysLeft' ? 'Days left' : 'Last active'}</span>
      </div>
      {rows.map((r) => (
        <div key={r.uid} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.15)', fontSize: 13 }}>
          <Link href={`/admin/users/${r.uid}`} style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.email || r.businessName || r.uid}
          </Link>
          <span style={{ color: 'var(--color-text-secondary)' }}>{fmtRelative(r.signupAt)}</span>
          <span style={{ color: 'var(--color-text-tertiary)', minWidth: 84, textAlign: 'right' }}>
            {lastCol === 'daysLeft'
              ? `${(r.trialDaysRemaining ?? 0).toLocaleString()}d`
              : fmtRelative(r.lastActivityAt)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Whole-number percent from a 0..1 fraction (one decimal for small conversion rates).
function pct1(fraction: number): number {
  const p = (fraction || 0) * 100;
  return Math.round(p * 10) / 10;
}

function StatCard({ label, value, valueSuffix, sub, icon, accent, series }: { label: string; value: number; valueSuffix?: string; sub?: string; icon?: React.ReactNode; accent?: boolean; series?: number[] }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : undefined}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
        <div className={styles.statLabel}>{label}</div>
        {icon && <span style={{ opacity: 0.5, display: 'inline-block', width: 18, height: 18 }}>{icon as any}</span>}
      </div>
      <div className={styles.statValue}>
        {value.toLocaleString()}
        {valueSuffix}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
      {series && series.length >= 2 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline values={series} height={32} />
        </div>
      )}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  const w = Math.max(3, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${w}%`, background: 'var(--gradient-accent)', borderRadius: 3 }} />
    </div>
  );
}

function FunnelStep({ label, value, max, detail, note, accent }: { label: string; value: number; max: number; detail?: string; note?: string; accent?: boolean }) {
  const w = Math.max(2, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700 }}>
          {value.toLocaleString()} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>· {pct(value, max)}</span>
        </span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: accent ? 'linear-gradient(90deg,#f97316,#fb923c)' : 'var(--gradient-accent)', borderRadius: 4 }} />
      </div>
      {detail && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{detail}</div>}
      {note && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4, fontStyle: 'italic' }}>{note}</div>}
    </div>
  );
}

function EmptyInline({ label }: { label: string }) {
  return <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>{label}</div>;
}

function pct(a: number, b: number): string {
  if (!b) return '0%';
  return `${Math.round((a / b) * 100)}%`;
}

function avg(a: number, b: number): string {
  if (!b) return '0';
  return (a / b).toFixed(1);
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
