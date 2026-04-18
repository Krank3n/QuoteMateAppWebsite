'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, downloadCsv, fmtDate, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconAffiliate, IconExternal } from '../components/icons';

interface Affiliate {
  uid: string;
  email: string | null;
  businessName: string | null;
  referralCode: string | null;
  commissionRate: number;
  totalReferrals: number;
  convertedReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  joinedAt: number | null;
}

export default function AffiliatesPage() {
  const [data, setData] = useState<{ affiliates: Affiliate[]; totals: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'earnings' | 'referrals' | 'conversion' | 'joined'>('earnings');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.listAffiliates({}).then((r: any) => {
      if (!cancelled) {
        setData(r);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    let list = data.affiliates;
    if (q) {
      list = list.filter((a) => {
        const hay = `${a.businessName || ''} ${a.email || ''} ${a.referralCode || ''}`.toLowerCase();
        return hay.includes(q);
      });
    }
    const sortedList = [...list];
    if (sortBy === 'earnings') sortedList.sort((a, b) => b.totalEarnings - a.totalEarnings);
    else if (sortBy === 'referrals') sortedList.sort((a, b) => b.totalReferrals - a.totalReferrals);
    else if (sortBy === 'conversion') sortedList.sort((a, b) => conversionRate(b) - conversionRate(a));
    else sortedList.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));
    return sortedList;
  }, [data, sortBy, search]);

  const totals = data?.totals || { affiliates: 0, referrals: 0, converted: 0, totalEarnings: 0, pending: 0, paid: 0 };

  const [exporting, setExporting] = useState(false);
  const doExport = async () => {
    setExporting(true);
    try { await downloadCsv('affiliates'); }
    catch (e) { console.error(e); }
    finally { setExporting(false); }
  };

  useSetPageMeta({
    title: 'Affiliates',
    breadcrumb: `${totals.affiliates} affiliates earning commission`,
    search: { value: search, onChange: setSearch, placeholder: 'Search by business, email, code…' },
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
            <StatTile label="Affiliates" value={totals.affiliates} sub={`${totals.referrals} referrals sent`} />
            <StatTile label="Conversions" value={totals.converted} sub={`${totals.referrals ? Math.round((totals.converted / totals.referrals) * 100) : 0}% of referrals`} />
            <StatTile label="Earned (lifetime)" value={`$${totals.totalEarnings.toLocaleString()}`} accent />
            <StatTile label="Pending payout" value={`$${totals.pending.toLocaleString()}`} sub={`$${totals.paid.toLocaleString()} already paid`} warn={totals.pending > 100} />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Affiliates</div>
                <div className={styles.cardSubtitle}>{filtered.length} shown</div>
              </div>
              <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} style={{ width: 'auto' }}>
                <option value="earnings">Top earners</option>
                <option value="referrals">Most referrals</option>
                <option value="conversion">Best conversion</option>
                <option value="joined">Newest</option>
              </select>
            </div>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <IconAffiliate className={styles.emptyIcon} />
                <div className={styles.emptyTitle}>No affiliates yet</div>
                <div className={styles.emptyText}>Invite power users to start referring.</div>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Affiliate</th>
                      <th>Code</th>
                      <th style={{ textAlign: 'right' }}>Referrals</th>
                      <th style={{ textAlign: 'right' }}>Converted</th>
                      <th style={{ textAlign: 'right' }}>Conv. rate</th>
                      <th style={{ textAlign: 'right' }}>Lifetime</th>
                      <th style={{ textAlign: 'right' }}>Pending</th>
                      <th>Joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a) => {
                      const name = a.businessName || a.email || a.uid.slice(0, 8);
                      const cr = conversionRate(a);
                      return (
                        <tr key={a.uid}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={styles.listAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>{initials(name)}</div>
                              <div>
                                <div className={styles.rowPrimary}>{name}</div>
                                <div className={styles.rowSecondary}>{a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {a.referralCode ? (
                              <code style={{ fontSize: 12, padding: '2px 6px', background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                                {a.referralCode}
                              </code>
                            ) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>{a.totalReferrals}</td>
                          <td style={{ textAlign: 'right' }}>{a.convertedReferrals}</td>
                          <td style={{ textAlign: 'right', color: cr >= 30 ? '#6ee7b7' : cr >= 10 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                            {cr}%
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>${a.totalEarnings.toLocaleString()}</td>
                          <td style={{ textAlign: 'right', color: a.pendingEarnings > 0 ? '#fcd34d' : 'var(--color-text-secondary)' }}>
                            ${a.pendingEarnings.toLocaleString()}
                          </td>
                          <td>{fmtDate(a.joinedAt)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Link href={`/admin/users?uid=${encodeURIComponent(a.uid)}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                              <IconExternal style={{ width: 12, height: 12 }} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}

function conversionRate(a: Affiliate) {
  if (!a.totalReferrals) return 0;
  return Math.round((a.convertedReferrals / a.totalReferrals) * 100);
}

function StatTile({ label, value, sub, accent, warn }: { label: string; value: string | number; sub?: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : warn ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={warn ? { color: '#fcd34d' } : undefined}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}
