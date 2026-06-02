'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconPhone } from '../components/icons';

interface LeadInterestItem {
  id: string;
  userId: string | null;
  email: string | null;
  businessName: string | null;
  contactPhone: string | null;
  missedCalls: string | null;
  typicalJobValue: number | null;
  estLostPerYear: number | null;
  notes: string | null;
  product: string | null;
  status: string | null;
  handledAt: number | null;
  handledBy: string | null;
  createdAt: number | null;
}

interface Totals {
  all: number;
  new: number;
  handled: number;
  last7d: number;
}

const STATUS_FILTERS = ['new', 'all', 'handled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

export default function InterestsPage() {
  const [items, setItems] = useState<LeadInterestItem[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('new');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listLeadInterests({ limit: 500 }).then((r: any) => {
      if (cancelled) return;
      setItems(r?.items || []);
      setTotals(r?.totals || null);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const base = statusFilter === 'all'
      ? items
      : items.filter((i) => (statusFilter === 'handled' ? i.status === 'handled' : i.status !== 'handled'));
    return [...base].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [items, statusFilter]);

  const setHandled = async (id: string, handled: boolean) => {
    setBusyId(id);
    try {
      await api.markLeadInterestHandled({ id, handled });
      setToast({ msg: handled ? 'Marked handled' : 'Reopened' });
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Failed', error: true });
    } finally {
      setBusyId(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  useSetPageMeta({
    title: 'Katie leads',
    breadcrumb: totals ? `${totals.new} new · ${totals.all} total` : '',
  });

  const activeChipStyle = { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' };

  return (
    <>
      {totals && (
        <div className={styles.statGrid}>
          <StatTile label="New" value={totals.new} sub={`${totals.all} total`} warn={totals.new > 0} />
          <StatTile label="Last 7 days" value={totals.last7d} sub="new sign-ups" />
          <StatTile label="Handled" value={totals.handled} sub="set up or contacted" />
          <StatTile label="Total" value={totals.all} sub="all-time interest" />
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Call-answering interest</div>
            <div className={styles.cardSubtitle}>{loading ? 'Loading…' : `${filtered.length} shown`}</div>
          </div>
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Status</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => setStatusFilter(s)}
              style={statusFilter === s ? activeChipStyle : undefined}
            >
              {s}
              {totals && s === 'new' && totals.new ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals.new}</span> : null}
              {totals && s === 'handled' && totals.handled ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals.handled}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.centerLoader} style={{ minHeight: 200 }}><div className={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <IconPhone className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>{statusFilter === 'new' ? 'No new leads' : 'Nothing here'}</div>
            <div className={styles.emptyText}>{statusFilter === 'new' ? 'Nobody waiting to be set up right now.' : 'No sign-ups match this filter.'}</div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            {filtered.map((it) => (
              <LeadRow
                key={it.id}
                item={it}
                busy={busyId === it.id}
                onSetHandled={(h) => setHandled(it.id, h)}
              />
            ))}
          </div>
        )}
      </div>
      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </>
  );
}

function LeadRow({
  item: it,
  busy,
  onSetHandled,
}: {
  item: LeadInterestItem;
  busy: boolean;
  onSetHandled: (handled: boolean) => void;
}) {
  const isHandled = it.status === 'handled';
  const telHref = it.contactPhone ? `tel:${it.contactPhone.replace(/[^\d+]/g, '')}` : null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 14,
        padding: '14px 4px',
        borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
        opacity: isHandled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(249, 115, 22, 0.12)',
        }}
      >
        <IconPhone style={{ width: 16, height: 16 }} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {it.businessName || 'Unknown business'}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 4, fontSize: 13 }}>
          {telHref ? (
            <a href={telHref} style={{ color: 'var(--color-accent-light)', fontWeight: 600 }}>
              📞 {it.contactPhone}
            </a>
          ) : (
            <span style={{ opacity: 0.6 }}>No number</span>
          )}
          {it.missedCalls && (
            <span style={{ opacity: 0.85 }}>Misses: <strong>{it.missedCalls}</strong></span>
          )}
          {typeof it.estLostPerYear === 'number' && it.estLostPerYear > 0 && (
            <span style={{ color: '#cfa153', fontWeight: 700 }}>~${it.estLostPerYear.toLocaleString()}/yr missed</span>
          )}
          {typeof it.typicalJobValue === 'number' && it.typicalJobValue > 0 && (
            <span style={{ opacity: 0.7 }}>job ~${it.typicalJobValue.toLocaleString()}</span>
          )}
        </div>

        {it.notes && (
          <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', fontSize: 13, opacity: 0.9 }}>
            {it.notes}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)', alignItems: 'center' }}>
          {it.userId ? (
            <Link href={`/admin/users/${it.userId}`} style={{ color: 'var(--color-text-secondary)' }}>
              {it.email || it.userId}
            </Link>
          ) : (
            <span>{it.email || 'anonymous'}</span>
          )}
          <span>{fmtRelative(it.createdAt)}</span>
          {isHandled && <span style={{ color: '#10b981' }}>✓ handled {fmtRelative(it.handledAt)}</span>}
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <button
          className={`${styles.btn} ${isHandled ? styles.btnGhost : styles.btnSecondary} ${styles.btnSmall}`}
          onClick={() => onSetHandled(!isHandled)}
          disabled={busy}
        >
          {busy ? '…' : isHandled ? 'Reopen' : 'Mark handled'}
        </button>
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, warn }: { label: string; value: number | string; sub?: string; warn?: boolean }) {
  return (
    <div className={styles.statCard} style={warn ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={warn ? { color: '#fca5a5' } : undefined}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}
