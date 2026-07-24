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
    | { available: true; variants: Array<{ variant: string; impressions: number; ctaClicks: number; ctr: number; storeExits?: number; storeExitRate?: number; signups?: number }> };
  abSince?: string;
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
    payingBilled?: number;
    payingRestored?: number;
    generatedList?: number;
    fetchedPrices?: number;
    usedConversation?: number;
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
    generatedListForQuote?: FunnelActionRow[];
    fetchedPricesForQuote?: FunnelActionRow[];
    usedConversationForQuote?: FunnelActionRow[];
  };
  asOf: number;
  cached: boolean;
}

// Payload of adminEventFunnelStats (functions/src/eventFunnel.helpers.ts).
// `pending` means the aggregateEventFunnel cron hasn't produced a cache yet.
interface EventFunnelData {
  pending?: boolean;
  shared: { signups: number; quoteDraft: number; quoteSent: number };
  pathA: {
    paywallViewed: number;
    checkoutStarted: number;
    proPaid: number;
    pctCheckoutStarted: number;
    pctProPaid: number;
  };
  pathB: { squareConnected: number; firstPaymentCollected: number; pctFirstPayment: number };
  monetized: { count: number; viaPro: number; viaSquare: number; viaBoth: number };
  conversion: { trialToMonetized: number; activationRate: number };
  trialStarted: number;
  histogram: {
    shared: { signup: number; quote_draft: number; quote_sent: number };
    pathA: { paywall_viewed: number; checkout_started: number; pro_paid: number };
    pathB: { square_connected: number; first_payment_collected: number };
  };
  asOf: number;
  eventWindowDays: number;
}

const DAY_OPTIONS = [7, 28, 90];

interface Digest {
  available: boolean;
  html?: string;
  aiGenerated?: boolean;
  generatedAt?: number | null;
}

interface SubAuditIssue {
  uid: string;
  email: string | null;
  reason: 'restored_awaiting_receipt' | 'restored_unknown_platform' | 'restored_expired' | 'bare_ispro';
  platform: string | null;
  incidentProUntil: string | null;
}

interface SubAudit {
  issues: SubAuditIssue[];
  billed: number;
  scanned: number;
  generatedAt: number;
}

const AUDIT_REASON_LABELS: Record<SubAuditIssue['reason'], string> = {
  restored_awaiting_receipt: 'Paying — awaiting receipt re-sync',
  restored_unknown_platform: 'Incident restore, platform unknown',
  restored_expired: 'Incident grant lapsed, still Pro',
  bare_ispro: 'Pro with no billing record',
};

export default function AnalyticsPage() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<Traffic | null>(null);
  const [signups7d, setSignups7d] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [funnelError, setFunnelError] = useState<string | null>(null);
  const [eventFunnel, setEventFunnel] = useState<EventFunnelData | null>(null);
  const [eventFunnelError, setEventFunnelError] = useState<string | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [subAudit, setSubAudit] = useState<SubAudit | null>(null);

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

  // Trial→monetised event funnel — cron-aggregated server-side, so this is a
  // cheap cache read. Same instant-paint-then-revalidate pattern as above.
  useEffect(() => {
    let cancelled = false;
    const cached = getCached<EventFunnelData>('analytics-event-funnel');
    if (cached) setEventFunnel(cached);
    setEventFunnelError(null);

    api
      .eventFunnelStats({})
      .then((f: any) => {
        if (cancelled) return;
        setEventFunnel(f as EventFunnelData);
        if (!f?.pending) setCached('analytics-event-funnel', f);
      })
      .catch((e) => {
        if (!cancelled) setEventFunnelError(e?.message || 'Failed to load event funnel');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Latest stored weekly AI digest — written by the weeklyAnalyticsDigest
  // function every Monday. Quiet failure: the card just doesn't render.
  useEffect(() => {
    let cancelled = false;
    const cached = getCached<Digest>('analytics-digest');
    if (cached) setDigest(cached);
    api
      .weeklyDigest({})
      .then((d: any) => {
        if (cancelled) return;
        setDigest(d as Digest);
        setCached('analytics-digest', d);
      })
      .catch(() => {});
    api
      .subscriptionAudit({})
      .then((a: any) => {
        if (!cancelled) setSubAudit(a as SubAudit);
      })
      .catch(() => {});
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
      <BusinessHealth funnel={funnel} error={funnelError} subAudit={subAudit} />

      {/* Trial → monetised: BOTH revenue paths (Pro subs + Square-collecting
          free tradies). Target 20%; the histogram shows where users stall. */}
      <EventFunnelSection data={eventFunnel} error={eventFunnelError} />

      <WeeklyDigestCard digest={digest} />

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
          {/* Full journey — the one strip that connects web traffic to revenue.
              Windows differ per segment (GA is day-scoped, Firestore funnel is
              all-time), so each segment carries its own window chip and the
              web→app bridge compares weekly rates instead of raw counts. */}
          <FullJourney data={data} funnel={funnel} signups7d={signups7d} />

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

            {/* Hero A/B test */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <div className={styles.cardTitle}>Hero A/B test</div>
                  <div className={styles.cardSubtitle}>
                    impression → clicks → store exits → web signups, by variant
                    {data.abSince ? ` · v2, data since ${data.abSince}` : ''}
                  </div>
                </div>
              </div>
              {data.abTest.available ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {/* "(not set)" rows are events from before the variant custom
                    dimension existed (pre 2026-06-29) — historical junk, not a
                    third arm of the test. */}
                {data.abTest.variants.filter((v) => v.variant !== '(not set)').map((v, _i, shown) => {
                  // Signups are the experiment's real outcome; fall back to CTA
                  // rate for the badge until sign_up-by-variant data exists
                  // (only web-app signups carry the variant — store installs
                  // are invisible to GA, so treat this as a directional read).
                  const haveSignups = shown.some((x) => (x.signups ?? 0) > 0);
                  const score = (x: typeof v) => (haveSignups ? (x.signups ?? 0) : x.ctr);
                  const winner = Math.max(...shown.map(score));
                  const isWinner = score(v) === winner && v.impressions > 0;
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
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        {(v.storeExits ?? 0).toLocaleString()} store exits · {((v.storeExitRate ?? 0) * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: (v.signups ?? 0) > 0 ? '#6ee7b7' : 'var(--color-text-tertiary)' }}>
                        {(v.signups ?? 0).toLocaleString()} web signups
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

function WeeklyDigestCard({ digest }: { digest: Digest | null }) {
  // No doc yet (function hasn't run) or still loading → render nothing rather
  // than an empty card.
  if (!digest?.available || !digest.html) return null;

  return (
    <div className={styles.card} style={{ marginBottom: 16 }}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Weekly AI digest</div>
          <div className={styles.cardSubtitle}>
            {digest.aiGenerated === false ? 'Numbers only — AI summary was unavailable this week' : 'What changed last week and the one thing to do'}
            {digest.generatedAt ? ` · generated ${fmtRelative(digest.generatedAt)}` : ''}
          </div>
        </div>
      </div>
      {/* The HTML fragment is produced by our own Cloud Function (Claude output
          constrained to h3/ul/li), stored admin-side, and served through an
          admin-gated callable — same trust level as the rest of this page. */}
      <div
        className="weekly-digest-body"
        style={{ fontSize: 13, lineHeight: 1.6 }}
        dangerouslySetInnerHTML={{ __html: digest.html }}
      />
      <style jsx global>{`
        .weekly-digest-body h3 {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: var(--color-text-tertiary, #94a3b8);
          margin: 14px 0 6px;
        }
        .weekly-digest-body h3:first-child {
          margin-top: 0;
        }
        .weekly-digest-body ul {
          margin: 0;
          padding-left: 18px;
        }
        .weekly-digest-body li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

function FullJourney({ data, funnel, signups7d }: { data: Traffic; funnel: Funnel | null; signups7d: number | null }) {
  const w = data.funnel;
  const f = funnel?.funnel;
  // The web→app bridge can't compare raw counts (GA is day-scoped, signups are
  // a 7d Firestore count), so it compares weekly averages instead.
  const clicksPerWeek = data.days > 0 ? (w.ctaClicks / data.days) * 7 : 0;
  const bridgePct = signups7d !== null && clicksPerWeek > 0 ? Math.round(Math.min(signups7d / clicksPerWeek, 9.99) * 100) : null;
  const webWindow = `last ${data.days}d`;

  return (
    <div className={styles.card} style={{ marginBottom: 16 }}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Full journey</div>
          <div className={styles.cardSubtitle}>Website visit → paying customer, in one strip</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 8 }}>
        <JourneyStage label="Sessions" value={w.sessions} windowLabel={webWindow} />
        <JourneyArrow label={pct(w.engaged, w.sessions)} />
        <JourneyStage label="Engaged" value={w.engaged} windowLabel={webWindow} />
        <JourneyArrow label={pct(w.ctaClicks, w.engaged)} />
        <JourneyStage label="Store / web clicks" value={w.ctaClicks} windowLabel={webWindow} />
        <JourneyArrow label={bridgePct !== null ? `≈${bridgePct}%` : '·'} note="weekly avg" />
        {signups7d !== null && <JourneyStage label="App signups" value={signups7d} windowLabel="last 7d" />}
        {f && (
          <>
            <JourneyStage label="Signups" value={f.signups} windowLabel="all-time" />
            <JourneyArrow label={pct(f.startedTrial, f.signups)} />
            <JourneyStage label="Trials" value={f.startedTrial} windowLabel="all-time" />
            <JourneyArrow label={pct(f.sentQuote, f.startedTrial)} />
            <JourneyStage label="Sent a quote" value={f.sentQuote} windowLabel="all-time" />
            <JourneyArrow label={pct(f.paying, f.sentQuote)} />
            <JourneyStage label="Paying" value={f.paying} windowLabel="all-time" accent />
          </>
        )}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 10 }}>
        Web stages come from GA ({webWindow}); app stages are all-time Firestore counts. The click → signup rate compares
        weekly averages, not the same users — treat it as a gauge, not a cohort.
      </div>
    </div>
  );
}

function JourneyStage({ label, value, windowLabel, accent }: { label: string; value: number; windowLabel: string; accent?: boolean }) {
  return (
    <div
      style={{
        flex: '1 1 104px',
        minWidth: 100,
        padding: '10px 12px',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.18)',
        border: `1px solid ${accent ? 'rgba(249,115,22,0.35)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, margin: '2px 0', color: accent ? '#fb923c' : 'inherit' }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{windowLabel}</div>
    </div>
  );
}

function JourneyArrow({ label, note }: { label: string; note?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 44, fontSize: 11, color: 'var(--color-text-secondary)' }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <span aria-hidden style={{ opacity: 0.6 }}>→</span>
      {note && <span style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>{note}</span>}
    </div>
  );
}

function EventFunnelSection({ data, error }: { data: EventFunnelData | null; error: string | null }) {
  const title = (
    <div className={styles.cardHeader} style={{ marginBottom: 12 }}>
      <div>
        <div className={styles.cardTitle}>Trial → monetised</div>
        <div className={styles.cardSubtitle}>
          Both revenue paths: Pro subscription (A) and Square collecting (B) · target 20%
        </div>
      </div>
    </div>
  );

  if (error && !data) {
    return (
      <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)', marginBottom: 16 }}>
        <div className={styles.cardTitle}>Couldn't load the event funnel</div>
        <div className={styles.cardSubtitle}>{error}</div>
        <div className={styles.cardSubtitle} style={{ marginTop: 8 }}>
          If this says the function isn't found, deploy <code>adminEventFunnelStats</code> first.
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.pending) {
    return (
      <div className={styles.card} style={{ marginBottom: 16 }}>
        {title}
        <div className={styles.cardSubtitle}>
          Waiting on the first <code>aggregateEventFunnel</code> run (every 6 hours). Trigger it manually
          from the Cloud Console to populate this now.
        </div>
      </div>
    );
  }

  const monetised = data.monetized;
  const h = data.histogram;

  return (
    <div style={{ marginBottom: 24 }}>
      {title}

      <div className={styles.statGrid}>
        <StatCard
          label="Trial → monetised"
          value={pct1(data.conversion.trialToMonetized)}
          valueSuffix="%"
          sub={`${monetised.count.toLocaleString()} of ${data.trialStarted.toLocaleString()} trials · target 20%`}
          accent
        />
        <StatCard
          label="Monetised — Pro"
          value={monetised.viaPro}
          sub={monetised.viaBoth ? `${monetised.viaBoth.toLocaleString()} also collect via Square` : 'billed subscriptions'}
        />
        <StatCard
          label="Monetised — Square"
          value={monetised.viaSquare}
          sub={`${data.pathB.squareConnected.toLocaleString()} connected · ${pct1(data.pathB.pctFirstPayment)}% collected`}
        />
        <StatCard
          label="Sent a quote"
          value={data.shared.quoteSent}
          sub={`${pct1(data.conversion.activationRate)}% of ${data.shared.signups.toLocaleString()} signups`}
        />
      </div>

      <div className={styles.dashGrid}>
        {/* Path A — Pro subscription */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Path A — Pro subscription</div>
              <div className={styles.cardSubtitle}>
                Events from the last {data.eventWindowDays} days; paid status is durable
              </div>
            </div>
          </div>
          <FunnelStep label="Viewed paywall" value={data.pathA.paywallViewed} max={Math.max(data.pathA.paywallViewed, 1)} />
          <FunnelStep
            label="Started checkout"
            value={data.pathA.checkoutStarted}
            max={Math.max(data.pathA.paywallViewed, 1)}
            detail={`${pct1(data.pathA.pctCheckoutStarted)}% of paywall viewers`}
          />
          <FunnelStep
            label="Paid — Pro"
            value={data.pathA.proPaid}
            max={Math.max(data.pathA.paywallViewed, 1)}
            detail={`${pct1(data.pathA.pctProPaid)}% of checkout starters`}
            accent
          />
          <MetricRow
            label="Viewed paywall, never checked out"
            value={h.pathA.paywall_viewed.toLocaleString()}
            detail="stalled at the paywall — pricing or value objection"
            barValue={h.pathA.paywall_viewed}
            barMax={Math.max(data.pathA.paywallViewed, 1)}
          />
          <MetricRow
            label="Started checkout, never paid"
            value={h.pathA.checkout_started.toLocaleString()}
            detail="abandoned mid-purchase — friction or store errors"
            barValue={h.pathA.checkout_started}
            barMax={Math.max(data.pathA.paywallViewed, 1)}
          />
        </div>

        {/* Path B — Square collecting */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Path B — Square collecting</div>
              <div className={styles.cardSubtitle}>Free tradies monetise via the payment cut</div>
            </div>
          </div>
          <FunnelStep
            label="Connected Square"
            value={data.pathB.squareConnected}
            max={Math.max(data.pathB.squareConnected, 1)}
          />
          <FunnelStep
            label="Collected a payment"
            value={data.pathB.firstPaymentCollected}
            max={Math.max(data.pathB.squareConnected, 1)}
            detail={`${pct1(data.pathB.pctFirstPayment)}% of connectors`}
            accent
          />
          <MetricRow
            label="Connected, never collected"
            value={h.pathB.square_connected.toLocaleString()}
            detail="have the button, haven't used it — prime nudge cohort"
            barValue={h.pathB.square_connected}
            barMax={Math.max(data.pathB.squareConnected, 1)}
            accent
          />
          <MetricRow
            label="Drafted, never sent"
            value={h.shared.quote_draft.toLocaleString()}
            detail="stalled before the funnel forks — send-nudge cohort"
            barValue={h.shared.quote_draft}
            barMax={Math.max(data.shared.signups, 1)}
          />
          <MetricRow
            label="Signed up, no quote yet"
            value={h.shared.signup.toLocaleString()}
            detail="never activated — first-quote email cohort"
            barValue={h.shared.signup}
            barMax={Math.max(data.shared.signups, 1)}
          />
        </div>
      </div>
    </div>
  );
}

function BusinessHealth({ funnel, error, subAudit }: { funnel: Funnel | null; error: string | null; subAudit: SubAudit | null }) {
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
  const generatedList = typeof f.generatedList === 'number' ? f.generatedList : funnel.actionable.generatedListForQuote?.length;
  const fetchedPrices = typeof f.fetchedPrices === 'number' ? f.fetchedPrices : funnel.actionable.fetchedPricesForQuote?.length;
  const usedConversation = typeof f.usedConversation === 'number' ? f.usedConversation : funnel.actionable.usedConversationForQuote?.length;

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
        <StatCard
          label="Paying customers"
          value={f.paying}
          sub={
            f.payingRestored
              ? `${(f.payingBilled ?? f.paying).toLocaleString()} billed · ${f.payingRestored.toLocaleString()} restored, awaiting receipt re-sync`
              : 'billed subscriptions'
          }
        />
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
              <div className={styles.cardSubtitle}>Bars and % are shares of signups; notes give the step-to-step rate</div>
            </div>
          </div>
          <FunnelStep label="Signups" value={f.signups} max={f.signups} />
          <FunnelStep label="Started a trial" value={f.startedTrial} max={f.signups} />
          {typeof generatedList === 'number' && (
            <FunnelStep
              label="Generated materials list"
              value={generatedList}
              max={f.signups}
              detail={`${pct1(f.startedTrial ? generatedList / f.startedTrial : 0)}% of trial starters generated one`}
            />
          )}
          {typeof fetchedPrices === 'number' && (
            <FunnelStep
              label="Fetched supplier prices"
              value={fetchedPrices}
              max={f.signups}
              detail={`${pct1((generatedList || 0) ? fetchedPrices / (generatedList || 1) : 0)}% of list generators fetched prices`}
            />
          )}
          {typeof usedConversation === 'number' && (
            <FunnelStep
              label="Used Mate conversation"
              value={usedConversation}
              max={f.signups}
              detail={`${pct1(f.startedTrial ? usedConversation / f.startedTrial : 0)}% of trial starters used a quote conversation`}
            />
          )}
          <FunnelStep label="Sent a quote" value={f.sentQuote} max={f.signups} detail={`${pct1(f.pctSentQuote)}% of trial starters send one`} />
          <FunnelStep label="Paying" value={f.paying} max={f.signups} detail={`${pct1(c.trialToPaid)}% of trial starters pay · north star`} accent />
          <WorkflowUserSnapshot funnel={funnel} />
        </div>

        {/* Activation snapshot */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Activation snapshot</div>
              <div className={styles.cardSubtitle}>How quickly signups reach value and convert</div>
            </div>
          </div>
          <MetricRow
            label="Quote activation"
            value={`${pct1(c.activationRate)}%`}
            detail={`${f.sentQuote.toLocaleString()} of ${f.signups.toLocaleString()} signups sent a quote`}
            barValue={f.sentQuote}
            barMax={f.signups}
          />
          <MetricRow
            label="Trial starters activated"
            value={`${pct1(f.startedTrial ? f.sentQuote / f.startedTrial : 0)}%`}
            detail={`${Math.max(f.startedTrial - f.sentQuote, 0).toLocaleString()} trial starters have not sent a quote yet`}
            barValue={f.sentQuote}
            barMax={f.startedTrial}
          />
          <MetricRow
            label="Trial → paid"
            value={`${pct1(c.trialToPaid)}%`}
            detail={`${Math.max(f.startedTrial - f.paying, 0).toLocaleString()} trial starters have not converted yet`}
            barValue={f.paying}
            barMax={f.startedTrial}
            accent
          />
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

      <SubscriptionAuditCard audit={subAudit} />

      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'right' }}>
        refreshed {fmtRelative(funnel.asOf)}
        {funnel.cached ? ' · cached' : ''}
      </div>
    </div>
  );
}

function SubscriptionAuditCard({ audit }: { audit: SubAudit | null }) {
  // Nothing to reconcile → no card. The nightly subscriptionAuditDaily
  // function keeps this fresh; the callable computes live if it's stale.
  if (!audit || audit.issues.length === 0) return null;

  return (
    <div className={styles.card} style={{ marginTop: 16, borderColor: 'rgba(249, 115, 22, 0.25)' }}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardTitle}>Subscription reconciliation</div>
          <div className={styles.cardSubtitle}>
            Pro access without a billing record — restored payers self-heal on next app open; the rest need a look
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {audit.issues.map((i) => (
          <div key={i.uid} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,0.15)', fontSize: 13 }}>
            <Link href={`/admin/users?uid=${encodeURIComponent(i.uid)}`} style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i.email || i.uid}
            </Link>
            <span style={{ color: i.reason === 'restored_awaiting_receipt' ? '#6ee7b7' : 'var(--color-text-secondary)' }}>
              {AUDIT_REASON_LABELS[i.reason] || i.reason}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', minWidth: 70, textAlign: 'right' }}>{i.platform || '—'}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
        {audit.billed} billed of {audit.scanned} subscription docs · checked {fmtRelative(audit.generatedAt)}
      </div>
    </div>
  );
}

function WorkflowUserSnapshot({ funnel }: { funnel: Funnel }) {
  const groups = [
    { label: 'Generated list', rows: funnel.actionable.generatedListForQuote || [] },
    { label: 'Fetched prices', rows: funnel.actionable.fetchedPricesForQuote || [] },
    { label: 'Used conversation', rows: funnel.actionable.usedConversationForQuote || [] },
  ].filter((g) => g.rows.length > 0);

  if (groups.length === 0) return null;

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Users behind quote workflow events</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
        {groups.map((g) => (
          <div key={g.label} style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.16)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{g.label}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{g.rows.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {g.rows.slice(0, 4).map((r) => (
                <Link key={r.uid} href={`/admin/users?uid=${encodeURIComponent(r.uid)}`} style={{ color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.email || r.businessName || r.uid}
                </Link>
              ))}
              {g.rows.length > 4 && <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>+{g.rows.length - 4} more</div>}
            </div>
          </div>
        ))}
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
          <Link href={`/admin/users?uid=${encodeURIComponent(r.uid)}`} style={{ color: 'inherit', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

function MetricRow({ label, value, detail, barValue, barMax, accent }: { label: string; value: string; detail: string; barValue: number; barMax: number; accent?: boolean }) {
  const w = Math.max(2, Math.min(100, (barValue / (barMax || 1)) * 100));
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>{label}</span>
        <span style={{ fontWeight: 800, fontSize: 18, color: accent ? '#fb923c' : 'inherit' }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${w}%`, background: accent ? 'linear-gradient(90deg,#f97316,#fb923c)' : 'var(--gradient-accent)', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{detail}</div>
    </div>
  );
}

// Whole-number percent from a 0..1 fraction (one decimal for small conversion
// rates). Capped at 100: the funnel cohorts aren't strictly nested (e.g. a payer
// who never wrote trialStartedAt), so raw ratios can exceed 1.
function pct1(fraction: number): number {
  const p = Math.min(fraction || 0, 1) * 100;
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
