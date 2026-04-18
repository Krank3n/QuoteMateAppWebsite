'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from './components/AdminShell';
import styles from './admin.module.css';
import { api, fmtRelative } from './lib/adminApi';
import { IconUsers, IconSupplier, IconSubscription, IconFeedback, IconTrendUp, IconExternal } from './components/icons';
import { Sparkline, pctChange } from './components/Sparkline';

interface Stats {
  users: { total: number; signupsToday: number; signupsThisWeek: number; activeSevenDay: number };
  subscriptions: { active: number; canceling: number; canceled: number };
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

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.dashboardStats({}), api.metricsSeries({ days: 30 })])
      .then(([s, series]: any) => {
        if (cancelled) return;
        setStats(s as Stats);
        setSeries((series?.series as Snapshot[]) || []);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e?.message || 'Failed to load stats');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const usersTrend = series.map((s) => s.usersTotal || 0);
  const signupsTrend = series.map((s) => s.signupsToday || 0);
  const active7dTrend = series.map((s) => s.active7d || 0);
  const proTrend = series.map((s) => s.subscriptionsPro || 0);

  return (
    <AdminShell title="Dashboard" breadcrumb="Overview">
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
              label="Pro subscriptions"
              value={stats.subscriptions.active + stats.subscriptions.canceling}
              sub={`${stats.subscriptions.active} active${stats.subscriptions.canceling ? ` · ${stats.subscriptions.canceling} canceling` : ''}`}
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
    </AdminShell>
  );
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
