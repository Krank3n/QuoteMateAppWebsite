'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconRevenue, IconExternal } from '../components/icons';

interface Payment {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userBusinessName: string | null;
  kind: string;
  quoteId: string | null;
  invoiceId: string | null;
  amountDollars: number;
  appFeeDollars: number;
  channel: string;
  paidAt: number | null;
  orderId: string | null;
  currency: string;
  enriched: boolean;
}

interface Totals {
  allTime: { grossDollars: number; feeDollars: number; count: number };
  last24h: { grossDollars: number; feeDollars: number; count: number };
  last7d: { grossDollars: number; feeDollars: number; count: number };
  last30d: { grossDollars: number; feeDollars: number; count: number };
  enrichedCount: number;
  legacyCount: number;
}

interface TopUser {
  userId: string;
  userEmail: string | null;
  userBusinessName: string | null;
  grossDollars: number;
  feeDollars: number;
  count: number;
}

export default function RevenuePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState<'all' | 'online' | 'in_person'>('all');

  useSetPageMeta({
    title: 'Revenue',
    breadcrumb: totals ? `$${totals.allTime.feeDollars.toFixed(2)} earned · ${totals.allTime.count} payments` : 'QuoteMate app-fee earnings from Square',
  });

  useEffect(() => {
    let cancelled = false;
    api.listPayments({ limit: 1000 }).then((r: any) => {
      if (cancelled) return;
      setPayments(r?.payments || []);
      setTotals(r?.totals || null);
      setTopUsers(r?.topUsers || []);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = channel === 'all' ? payments : payments.filter((p) => p.channel === channel);

  return (
    <>
      {totals && (
        <div className={styles.statGrid}>
          <StatTile
            label="QM earned (all-time)"
            value={`$${totals.allTime.feeDollars.toFixed(2)}`}
            sub={`Across ${totals.allTime.count} payments · $${Math.round(totals.allTime.grossDollars).toLocaleString()} gross processed`}
            accent
          />
          <StatTile
            label="Last 30 days"
            value={`$${totals.last30d.feeDollars.toFixed(2)}`}
            sub={`${totals.last30d.count} payments · $${Math.round(totals.last30d.grossDollars).toLocaleString()} gross`}
          />
          <StatTile
            label="Last 7 days"
            value={`$${totals.last7d.feeDollars.toFixed(2)}`}
            sub={`${totals.last7d.count} payments`}
          />
          <StatTile
            label="Last 24 hours"
            value={`$${totals.last24h.feeDollars.toFixed(2)}`}
            sub={`${totals.last24h.count} payments`}
          />
        </div>
      )}

      <div className={styles.dashGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Payments</div>
              <div className={styles.cardSubtitle}>
                {loading ? 'Loading…' : `${filtered.length} of ${payments.length} shown`}
                {totals && totals.legacyCount > 0 && (
                  <span style={{ marginLeft: 8, color: 'var(--color-text-secondary)' }}>
                    · {totals.legacyCount} pre-tracking payment{totals.legacyCount === 1 ? '' : 's'} with estimated fee
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.chipRow} style={{ marginBottom: 12 }}>
            {[
              { id: 'all', label: 'All channels' },
              { id: 'online', label: 'Online (hosted link)' },
              { id: 'in_person', label: 'Tap to Pay' },
            ].map((c) => {
              const on = channel === c.id;
              return (
                <button
                  key={c.id}
                  className={styles.chip}
                  onClick={() => setChannel(c.id as any)}
                  style={on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tradie</th>
                  <th>Kind</th>
                  <th>Channel</th>
                  <th style={{ textAlign: 'right' }}>Gross</th>
                  <th style={{ textAlign: 'right' }}>QM fee</th>
                  <th>Paid</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className={styles.empty}>
                      <IconRevenue className={styles.emptyIcon} />
                      <div className={styles.emptyTitle}>No payments yet</div>
                      <div className={styles.emptyText}>Once a customer pays a quote or invoice via Square, it'll land here.</div>
                    </div>
                  </td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td>
                      {p.userId ? (
                        <Link
                          href={`/admin/users?uid=${encodeURIComponent(p.userId)}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
                        >
                          <div className={styles.listAvatar} style={{ width: 26, height: 26, fontSize: 10 }}>
                            {initials(p.userBusinessName || p.userEmail)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{p.userBusinessName || p.userEmail?.split('@')[0] || p.userId.slice(0, 8)}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{p.userEmail}</div>
                          </div>
                        </Link>
                      ) : '—'}
                    </td>
                    <td><KindTag kind={p.kind} /></td>
                    <td><ChannelTag channel={p.channel} /></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${p.amountDollars.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: '#6ee7b7', fontWeight: 600 }}>
                      ${p.appFeeDollars.toFixed(2)}
                      {!p.enriched && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginLeft: 4 }}>(est.)</span>}
                    </td>
                    <td>{fmtRelative(p.paidAt)}</td>
                    <td style={{ textAlign: 'right' }}>
                      {p.userId && (p.quoteId || p.invoiceId) && (
                        <Link
                          href={`/admin/users?uid=${encodeURIComponent(p.userId)}`}
                          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                        >
                          <IconExternal style={{ width: 12, height: 12 }} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Top contributors</div>
                <div className={styles.cardSubtitle}>Tradies who've earned QuoteMate the most</div>
              </div>
            </div>
            {topUsers.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No contributors yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topUsers.map((u, i) => (
                  <Link
                    key={u.userId}
                    href={`/admin/users?uid=${encodeURIComponent(u.userId)}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.18)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', width: 18 }}>#{i + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.userBusinessName || u.userEmail?.split('@')[0] || u.userId.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {u.count} payment{u.count === 1 ? '' : 's'} · ${Math.round(u.grossDollars).toLocaleString()} gross
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>
                      ${u.feeDollars.toFixed(2)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={accent ? { color: 'var(--color-accent-light)' } : undefined}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}

function KindTag({ kind }: { kind: string }) {
  const label = kind === 'invoice' ? 'invoice' : kind === 'quote_deposit' ? 'deposit' : kind === 'quote_full' ? 'quote (full)' : kind;
  return <span className={`${styles.tag}`}>{label}</span>;
}

function ChannelTag({ channel }: { channel: string }) {
  return <span className={`${styles.tag}`}>{channel === 'in_person' ? 'tap-to-pay' : 'online'}</span>;
}
