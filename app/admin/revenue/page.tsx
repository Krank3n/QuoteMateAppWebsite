'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtDate, fmtRelative, initials } from '../lib/adminApi';
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

// Rolled up per STORE PURCHASE by the backend (subscription.helpers
// rollupRevenue) — two accounts sharing one Play subscription are one payer,
// and everyone is priced at what the store actually charges them.
interface Rollup {
  payers: number;
  mrrGross: number;
  mrrNet: number;
  arrGross: number;
  arrNet: number;
  byPlatform: Record<string, { payers: number; mrrGross: number; mrrNet: number }>;
  byInterval: { monthly: number; yearly: number };
  estimatedPricing: number;
  duplicateUids: string[];
  lapsed: { count: number; mrrGross: number };
  restoredUnverified: number;
  foreignCurrency: number;
}

interface Sub {
  uid: string;
  email: string | null;
  businessName: string | null;
  status: string;
  platform: string | null;
  billed: boolean;
  interval: 'monthly' | 'yearly' | null;
  monthlyAud: number;
  netMonthlyAud: number;
  priceAmount: number;
  priceCurrency: string;
  priceSource: 'store' | 'listed';
  periodEnded: boolean;
  purchaseKey: string | null;
  currentPeriodEnd: number | null;
}

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;

const PLATFORM_LABEL: Record<string, string> = {
  ios: 'Apple App Store',
  android: 'Google Play',
  web: 'Stripe (web)',
  unknown: 'Unknown',
};

export default function RevenuePage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [rollup, setRollup] = useState<Rollup | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [subsLoading, setSubsLoading] = useState(true);
  const [channel, setChannel] = useState<'all' | 'online' | 'in_person'>('all');

  useSetPageMeta({
    title: 'Revenue',
    breadcrumb: rollup
      ? `${money0(rollup.mrrGross)}/mo from ${rollup.payers} subscriber${rollup.payers === 1 ? '' : 's'}`
      : 'Subscription revenue + Square app fees',
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

    api.listSubscriptions({}).then((r: any) => {
      if (cancelled) return;
      setRollup(r?.revenue || null);
      setSubs(r?.subscriptions || []);
      setSubsLoading(false);
    }).catch(() => { if (!cancelled) setSubsLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const filtered = channel === 'all' ? payments : payments.filter((p) => p.channel === channel);

  // Everyone actually billing right now, biggest first. Duplicate accounts on
  // one purchase are shown once — the same rule the MRR total uses.
  const seenPurchases = new Set<string>();
  const payers = subs
    .filter((s) => s.billed && !s.periodEnded && s.monthlyAud > 0)
    .sort((a, b) => b.monthlyAud - a.monthlyAud)
    .filter((s) => {
      if (!s.purchaseKey) return true;
      if (seenPurchases.has(s.purchaseKey)) return false;
      seenPurchases.add(s.purchaseKey);
      return true;
    });

  const caveats: string[] = [];
  if (rollup) {
    if (rollup.estimatedPricing > 0) {
      caveats.push(`${rollup.estimatedPricing} subscriber${rollup.estimatedPricing === 1 ? '' : 's'} priced at the list price — the store never told us what they really pay.`);
    }
    if (rollup.duplicateUids.length > 0) {
      caveats.push(`${rollup.duplicateUids.length} duplicate account${rollup.duplicateUids.length === 1 ? '' : 's'} sharing a purchase already counted (not double-counted here).`);
    }
    if (rollup.lapsed.count > 0) {
      caveats.push(`${rollup.lapsed.count} paid period${rollup.lapsed.count === 1 ? ' has' : 's have'} run out with no renewal confirmed — ${money(rollup.lapsed.mrrGross)}/mo unconfirmed.`);
    }
    if (rollup.restoredUnverified > 0) {
      caveats.push(`${rollup.restoredUnverified} incident-restored payer${rollup.restoredUnverified === 1 ? '' : 's'} still carry no billing record, so they bill $0 here.`);
    }
    if (rollup.foreignCurrency > 0) {
      caveats.push(`${rollup.foreignCurrency} subscriber${rollup.foreignCurrency === 1 ? '' : 's'} billed in a non-AUD currency — excluded from these totals.`);
    }
  }

  return (
    <>
      <div className={styles.statGrid}>
        <StatTile
          label="MRR"
          value={rollup ? money(rollup.mrrGross) : '—'}
          sub={rollup ? `ARR ≈ ${money0(rollup.arrGross)} · ${rollup.payers} paying subscriber${rollup.payers === 1 ? '' : 's'}` : 'Loading…'}
          accent
        />
        <StatTile
          label="Net in the bank"
          value={rollup ? money(rollup.mrrNet) : '—'}
          sub={rollup ? `${money0(rollup.arrNet)}/yr after GST + the 15% store cut` : 'Loading…'}
        />
        <StatTile
          label="Plan mix"
          value={rollup ? `${rollup.byInterval.yearly}y / ${rollup.byInterval.monthly}m` : '—'}
          sub={rollup ? `${rollup.byInterval.yearly} annual · ${rollup.byInterval.monthly} monthly` : 'Loading…'}
        />
        <StatTile
          label="Square app fees"
          value={totals ? money(totals.allTime.feeDollars) : '—'}
          sub={totals ? `All-time, across ${totals.allTime.count} customer payment${totals.allTime.count === 1 ? '' : 's'}` : 'Loading…'}
        />
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Paying subscribers</div>
              <div className={styles.cardSubtitle}>
                {subsLoading ? 'Loading…' : `${payers.length} billing right now · priced at what the store actually charges them`}
              </div>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tradie</th>
                  <th>Store</th>
                  <th>Plan</th>
                  <th style={{ textAlign: 'right' }}>Charged</th>
                  <th style={{ textAlign: 'right' }}>Per month</th>
                  <th>Renews</th>
                </tr>
              </thead>
              <tbody>
                {subsLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
                ) : payers.length === 0 ? (
                  <tr><td colSpan={6}>
                    <div className={styles.empty}>
                      <IconRevenue className={styles.emptyIcon} />
                      <div className={styles.emptyTitle}>No paying subscribers</div>
                      <div className={styles.emptyText}>Store and Stripe subscriptions land here the moment a receipt validates.</div>
                    </div>
                  </td></tr>
                ) : payers.map((s) => (
                  <tr key={s.uid} style={{ cursor: 'default' }}>
                    <td>
                      <Link
                        href={`/admin/users?uid=${encodeURIComponent(s.uid)}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
                      >
                        <div className={styles.listAvatar} style={{ width: 26, height: 26, fontSize: 10 }}>
                          {initials(s.businessName || s.email)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.businessName || s.email?.split('@')[0] || s.uid.slice(0, 8)}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td><span className={styles.tag}>{PLATFORM_LABEL[s.platform || 'unknown'] || s.platform}</span></td>
                    <td><span className={styles.tag}>{s.interval === 'yearly' ? 'annual' : 'monthly'}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      {money(s.priceAmount)}
                      {s.priceCurrency !== 'AUD' && <span style={{ fontSize: 10, marginLeft: 3 }}>{s.priceCurrency}</span>}
                      {s.priceSource === 'listed' && (
                        <span
                          title="No price from the store — this is today's list price, which is wrong for anyone on a grandfathered plan."
                          style={{ fontSize: 10, color: '#fca5a5', marginLeft: 4 }}
                        >
                          (est.)
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', color: '#6ee7b7', fontWeight: 600 }}>{money(s.monthlyAud)}</td>
                    <td>{s.currentPeriodEnd ? fmtDate(s.currentPeriodEnd) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Where it comes from</div>
                <div className={styles.cardSubtitle}>Monthly, by store</div>
              </div>
            </div>
            {!rollup || Object.keys(rollup.byPlatform).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No subscription revenue yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(rollup.byPlatform)
                  .sort((a, b) => b[1].mrrGross - a[1].mrrGross)
                  .map(([platform, v]) => {
                    const share = rollup.mrrGross > 0 ? (v.mrrGross / rollup.mrrGross) * 100 : 0;
                    return (
                      <div key={platform}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{PLATFORM_LABEL[platform] || platform}</span>
                          <span style={{ color: 'var(--color-text-secondary)' }}>
                            {money(v.mrrGross)}/mo · {v.payers} payer{v.payers === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ width: `${share}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 3 }}>
                          {money(v.mrrNet)}/mo lands after the store cut
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>How much to trust this</div>
                <div className={styles.cardSubtitle}>Everything the totals had to assume</div>
              </div>
            </div>
            {subsLoading ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Loading…</div>
            ) : caveats.length === 0 ? (
              <div style={{ fontSize: 13, color: '#6ee7b7' }}>
                Every payer is priced from a real store or Stripe amount. Nothing estimated, nothing double-counted.
              </div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {caveats.map((c) => (
                  <li key={c} style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{c}</li>
                ))}
              </ul>
            )}
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
              Net = what reaches the bank. App-store prices include GST (the store remits it) and Apple/Google keep 15%.
              Stripe charges are received in full less 1.75% + 30c.
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card} style={{ marginTop: 16 }}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Square app fees</div>
            <div className={styles.cardSubtitle}>
              QuoteMate's cut of customer payments taken through the app — separate from subscriptions.
              {totals && ` ${money(totals.last30d.feeDollars)} in the last 30 days · ${money0(totals.last30d.grossDollars)} gross processed.`}
              {totals && totals.legacyCount > 0 && ` ${totals.legacyCount} pre-tracking payment${totals.legacyCount === 1 ? '' : 's'} carry an estimated fee.`}
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
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
            {loading ? 'Loading…' : `${filtered.length} of ${payments.length} shown`}
          </span>
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

        {topUsers.length > 0 && (
          <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <div className={styles.cardTitle} style={{ fontSize: 13, marginBottom: 8 }}>Top contributors</div>
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
                      {u.count} payment{u.count === 1 ? '' : 's'} · {money0(u.grossDollars)} gross
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#6ee7b7' }}>
                    {money(u.feeDollars)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
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
