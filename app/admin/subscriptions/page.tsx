'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, downloadCsv, fmtDate, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconSubscription, IconExternal } from '../components/icons';

interface Sub {
  uid: string;
  email: string | null;
  businessName: string | null;
  status: string;
  tier: string;
  platform: string | null;
  isPro: boolean;
  canceling: boolean;
  productId: string | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAt: number | null;
  validatedAt: number | null;
  quotesThisMonth: number;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'canceling', label: 'Canceling' },
  { id: 'canceled', label: 'Canceled' },
  { id: 'trialing', label: 'Trialing' },
  { id: 'trial_expired', label: 'Trial expired' },
  { id: 'free', label: 'Free' },
];

const PRO_MONTHLY_AUD = 29;

export default function SubscriptionsPage() {
  const [data, setData] = useState<{ subscriptions: Sub[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'status' | 'created' | 'renewal' | 'business'>('renewal');

  useEffect(() => {
    let cancelled = false;
    api.listSubscriptions({}).then((r: any) => {
      if (!cancelled) {
        setData(r);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.subscriptions;
    if (filter !== 'all') list = list.filter((s) => s.status === filter);
    const sortedList = [...list];
    if (sortBy === 'business') sortedList.sort((a, b) => (a.businessName || a.email || '').localeCompare(b.businessName || b.email || ''));
    else if (sortBy === 'created') sortedList.sort((a, b) => (b.validatedAt || 0) - (a.validatedAt || 0));
    else if (sortBy === 'renewal') sortedList.sort((a, b) => (a.currentPeriodEnd || Infinity) - (b.currentPeriodEnd || Infinity));
    else if (sortBy === 'status') sortedList.sort((a, b) => a.status.localeCompare(b.status));
    return sortedList;
  }, [data, filter, sortBy]);

  const mrr = useMemo(() => {
    if (!data) return 0;
    return data.subscriptions.filter((s) => s.isPro).length * PRO_MONTHLY_AUD;
  }, [data]);

  const arr = mrr * 12;
  const totals = data?.totals || { active: 0, canceling: 0, canceled: 0, trialing: 0, trial_expired: 0, free: 0, all: 0 };
  const retentionRate = totals.active + totals.canceled
    ? Math.round((totals.active / (totals.active + totals.canceled)) * 100)
    : 0;
  const trialConvRate = totals.trialing + totals.trial_expired + totals.active
    ? Math.round((totals.active / (totals.trialing + totals.trial_expired + totals.active)) * 100)
    : 0;

  const [exporting, setExporting] = useState(false);
  const doExport = async () => {
    setExporting(true);
    try { await downloadCsv('subscriptions'); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  useSetPageMeta({
    title: 'Subscriptions',
    breadcrumb: 'Revenue + subscriber health',
    actions: (
      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={doExport} disabled={exporting}>
        {exporting ? 'Exporting…' : 'Export CSV'}
      </button>
    ),
  });

  return (
    <>
      {loading ? (
        <div className={styles.centerLoader} style={{ minHeight: 200 }}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <>
          <div className={styles.statGrid}>
            <StatTile label="MRR (est.)" value={`$${mrr.toLocaleString()}`} sub={`ARR ≈ $${arr.toLocaleString()} · @$${PRO_MONTHLY_AUD}/mo`} accent />
            <StatTile label="Active" value={totals.active} sub={`${retentionRate}% retained · ${trialConvRate}% trial→paid`} />
            <StatTile label="Trialing" value={totals.trialing} sub={`${totals.trial_expired} expired`} />
            <StatTile label="Canceling" value={totals.canceling} sub="Active until period end" warn={totals.canceling > 0} />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Subscribers</div>
                <div className={styles.cardSubtitle}>{filtered.length} shown · sorted by {sortBy}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ width: 'auto' }}>
                  <option value="renewal">Next renewal</option>
                  <option value="created">Created</option>
                  <option value="status">Status</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
            <div className={styles.chipRow} style={{ marginBottom: 14 }}>
              {STATUS_FILTERS.map((f) => {
                const on = filter === f.id;
                const count = f.id === 'all' ? totals.all : (totals as any)[f.id] ?? 0;
                return (
                  <button
                    key={f.id}
                    className={styles.chip}
                    onClick={() => setFilter(f.id)}
                    style={on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
                  >
                    {f.label} · {count}
                  </button>
                );
              })}
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Subscriber</th>
                    <th>Status</th>
                    <th>Platform</th>
                    <th>Validated</th>
                    <th>Next renewal</th>
                    <th>Last validated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>No subscriptions match</td></tr>
                  ) : filtered.map((s) => {
                    const name = s.businessName || s.email || s.uid.slice(0, 8);
                    return (
                      <tr key={s.uid}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className={styles.listAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>{initials(name)}</div>
                            <div>
                              <div className={styles.rowPrimary}>{name}</div>
                              <div className={styles.rowSecondary}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><StatusTag status={s.status} /></td>
                        <td>{s.platform || '—'}</td>
                        <td>{fmtDate(s.validatedAt)}</td>
                        <td>
                          {s.cancelAt
                            ? <span style={{ color: '#fca5a5' }}>cancels {fmtDate(s.cancelAt)}</span>
                            : s.currentPeriodEnd
                            ? fmtDate(s.currentPeriodEnd)
                            : '—'}
                        </td>
                        <td>{fmtRelative(s.validatedAt)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/admin/users?uid=${encodeURIComponent(s.uid)}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                            <IconExternal style={{ width: 12, height: 12 }} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatTile({ label, value, sub, accent, warn }: { label: string; value: string | number; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : warn ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={warn ? { color: '#fca5a5' } : undefined}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: styles.tagPro,
    canceling: styles.tagAtRisk,
    trialing: styles.tagTrial,
    trial_expired: styles.tagCanceled,
    free: styles.tagFree,
    canceled: styles.tagCanceled,
    cancelled: styles.tagCanceled,
    past_due: styles.tagAtRisk,
    unpaid: styles.tagAtRisk,
  };
  return <span className={`${styles.tag} ${map[status] || ''}`}>{status.replace('_', ' ')}</span>;
}
