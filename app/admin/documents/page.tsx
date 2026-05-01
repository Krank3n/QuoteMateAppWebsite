'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { api, fmtDate, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconQuote, IconExternal } from '../components/icons';

type DocStage =
  | 'draft'
  | 'quote_sent'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'invoice_sent'
  | 'partially_paid'
  | 'paid'
  | 'cancelled';
type DocType = 'quote' | 'invoice';

interface DocumentRow {
  id: string;
  uid: string;
  userEmail: string | null;
  userBusinessName: string | null;
  type: DocType;
  stage: DocStage;
  legacyStatus: string;
  number: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  jobAddress: string | null;
  job: string | null;
  total: number;
  subtotal: number;
  gst: number;
  materialsSubtotal: number;
  laborTotal: number;
  markup: number;
  materialCount: number;
  photoCount: number;
  createdAt: number | null;
  updatedAt: number | null;
  sentAt: number | null;
  respondedAt: number | null;
  respondedBy: string | null;
  firstViewedAt: number | null;
  lastViewedAt: number | null;
  viewCount: number;
  acceptedAt: number | null;
  invoicedAt: number | null;
  paidInFullAt: number | null;
  issueDate: number | null;
  dueDate: number | null;
  hasAcceptanceToken: boolean;
  depositPaid: number;
  paidTotal: number;
  balanceDue: number;
  depositPaidAt: number | null;
  squarePaymentId: string | null;
  paymentLinkUrl: string | null;
  jobId: string | null;
  stuck: boolean;
}

interface ListTotals {
  all: number;
  draft: number;
  quote_sent: number;
  quote_accepted: number;
  quote_rejected: number;
  invoice_sent: number;
  partially_paid: number;
  paid: number;
  cancelled: number;
  quotes: number;
  invoices: number;
  stuck: number;
  viewedNoResponse: number;
  valueAll: number;
  valueDraft: number;
  valueQuoteSent: number;
  valueAccepted: number;
  valueInvoiced: number;
  valuePaid: number;
  paidCount: number;
}

const TYPE_FILTERS: Array<{ id: '' | DocType; label: string }> = [
  { id: '', label: 'All' },
  { id: 'quote', label: 'Quotes' },
  { id: 'invoice', label: 'Invoices' },
];

// Stage filter chips. The "stuck" / "viewed-no-response" buckets are pseudo-stages
// rendered client-side from the row's `stuck` / firstViewedAt fields.
type ChipId = '' | DocStage | 'stuck' | 'viewedNoResponse';
const STAGE_CHIPS: Array<{ id: ChipId; label: string; totalsKey?: keyof ListTotals }> = [
  { id: '', label: 'All', totalsKey: 'all' },
  { id: 'draft', label: 'Drafts', totalsKey: 'draft' },
  { id: 'quote_sent', label: 'Quote sent', totalsKey: 'quote_sent' },
  { id: 'viewedNoResponse', label: 'Viewed, no reply', totalsKey: 'viewedNoResponse' },
  { id: 'quote_accepted', label: 'Accepted', totalsKey: 'quote_accepted' },
  { id: 'quote_rejected', label: 'Rejected', totalsKey: 'quote_rejected' },
  { id: 'invoice_sent', label: 'Invoiced', totalsKey: 'invoice_sent' },
  { id: 'partially_paid', label: 'Part-paid', totalsKey: 'partially_paid' },
  { id: 'paid', label: 'Paid', totalsKey: 'paid' },
  { id: 'cancelled', label: 'Cancelled', totalsKey: 'cancelled' },
  { id: 'stuck', label: '⚠ Stuck', totalsKey: 'stuck' },
];

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <DocumentsPageInner />
    </Suspense>
  );
}

function DocumentsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidParam = searchParams?.get('uid') || '';
  const stageParam = (searchParams?.get('stage') || '') as ChipId;
  const typeParam = (searchParams?.get('type') || '') as '' | DocType;

  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [totals, setTotals] = useState<Partial<ListTotals>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DocumentRow | null>(null);
  const [detail, setDetail] = useState<any>(null);

  // Server-side filter knobs are kept in URL params so admins can deep-link
  // (e.g. /admin/documents?uid=xyz&type=invoice&stage=invoice_sent).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 1000 };
    if (uidParam) params.userId = uidParam;
    if (typeParam) params.type = typeParam;
    // 'stage' chip values that map to a real DocumentStage are sent server-side;
    // pseudo-buckets (stuck, viewedNoResponse) are filtered client-side below.
    if (stageParam && stageParam !== 'stuck' && stageParam !== 'viewedNoResponse') {
      params.stage = stageParam;
    }
    api.listDocuments(params)
      .then((r: any) => {
        if (cancelled) return;
        setDocs(r?.documents || []);
        setTotals(r?.totals || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error('[admin/documents] listDocuments failed', err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uidParam, typeParam, stageParam]);

  const updateParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams?.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`/admin/documents${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let rows = docs;
    if (stageParam === 'stuck') rows = rows.filter((d) => d.stuck);
    if (stageParam === 'viewedNoResponse') rows = rows.filter((d) => d.firstViewedAt && !d.respondedAt);
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((d) =>
      [d.customerName, d.customerEmail, d.customerPhone, d.jobAddress, d.job, d.userBusinessName, d.userEmail, d.number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [docs, search, stageParam]);

  const breadcrumb = uidParam
    ? `${docs.length} document${docs.length === 1 ? '' : 's'} for ${docs[0]?.userBusinessName || docs[0]?.userEmail || uidParam}`
    : `${docs.length} recent · $${Math.round(totals.valueAccepted || 0).toLocaleString()} accepted · $${Math.round(totals.valuePaid || 0).toLocaleString()} paid`;

  useSetPageMeta({
    title: uidParam ? 'Documents · single tradie' : 'Documents',
    breadcrumb,
    search: { value: search, onChange: setSearch, placeholder: 'Customer, job, tradie, doc number…' },
    actions: uidParam ? (
      <Link
        href="/admin/documents"
        className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
      >
        Clear tradie filter
      </Link>
    ) : undefined,
  });

  const openDoc = async (d: DocumentRow) => {
    setSelected(d);
    setDetail(null);
    try {
      const r: any = await api.getDocument({ uid: d.uid, id: d.id });
      setDetail(r);
    } catch {
      setDetail({ error: true });
    }
  };

  return (
    <>
      <div className={styles.statGrid}>
        <StatTile
          label="Pipeline value"
          value={`$${Math.round(totals.valueQuoteSent || 0).toLocaleString()}`}
          sub={`${(totals.quote_sent || 0) + (totals.quote_accepted || 0)} live quotes`}
        />
        <StatTile
          label="Accepted"
          value={`$${Math.round(totals.valueAccepted || 0).toLocaleString()}`}
          sub={`${totals.quote_accepted || 0} won · ${conversionRate(totals)}% of sent`}
          accent
        />
        <StatTile
          label="Invoiced"
          value={`$${Math.round(totals.valueInvoiced || 0).toLocaleString()}`}
          sub={`${(totals.invoice_sent || 0) + (totals.partially_paid || 0) + (totals.paid || 0)} invoices · ${totals.paid || 0} paid`}
        />
        <StatTile
          label="Paid via Square"
          value={`$${Math.round(totals.valuePaid || 0).toLocaleString()}`}
          sub={`${totals.paidCount || 0} docs with payments`}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Documents</div>
            <div className={styles.cardSubtitle}>
              {loading ? 'Loading…' : `${filtered.length} of ${docs.length} shown`}
            </div>
          </div>
        </div>

        {/* Type tabs */}
        <div className={styles.chipRow} style={{ marginBottom: 8 }}>
          {TYPE_FILTERS.map((f) => {
            const on = typeParam === f.id;
            const count = f.id === '' ? totals.all : f.id === 'quote' ? totals.quotes : totals.invoices;
            return (
              <button
                key={f.id || 'all'}
                className={styles.chip}
                onClick={() => updateParam('type', f.id || null)}
                style={on ? activeChipStyle : undefined}
              >
                {f.label}
                {typeof count === 'number' ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Stage chips */}
        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          {STAGE_CHIPS.map((c) => {
            const on = stageParam === c.id;
            const count = c.totalsKey ? (totals as any)[c.totalsKey] : undefined;
            const isWarn = c.id === 'stuck';
            return (
              <button
                key={c.id || 'all'}
                className={styles.chip}
                onClick={() => updateParam('stage', c.id || null)}
                style={on
                  ? isWarn ? activeWarnChipStyle : activeChipStyle
                  : isWarn ? { color: '#fcd34d' } : undefined}
              >
                {c.label}
                {typeof count === 'number' ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Customer / Job</th>
                <th>Tradie</th>
                <th>Stage</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Updated</th>
                <th>Activity</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className={styles.empty}>
                    <IconQuote className={styles.emptyIcon} />
                    <div className={styles.emptyTitle}>No documents match</div>
                    <div className={styles.emptyText}>Try a different filter.</div>
                  </div>
                </td></tr>
              ) : filtered.map((d) => (
                <tr key={`${d.uid}-${d.id}`} onClick={() => openDoc(d)}>
                  <td>
                    <div className={styles.rowPrimary} style={truncStyle}>
                      {d.customerName || <span style={{ opacity: 0.5 }}>no customer name</span>}
                      {d.number && <span style={{ opacity: 0.4, fontSize: 11, marginLeft: 6, fontWeight: 400 }}>· {d.number}</span>}
                    </div>
                    <div className={styles.rowSecondary} style={truncStyle}>
                      {d.job || d.jobAddress || d.customerEmail || ''}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/users?uid=${encodeURIComponent(d.uid)}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
                    >
                      <div className={styles.listAvatar} style={{ width: 24, height: 24, fontSize: 10 }}>
                        {initials(d.userBusinessName || d.userEmail)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, ...truncStyle, maxWidth: 180 }}>
                          {d.userBusinessName || d.userEmail?.split('@')[0] || d.uid.slice(0, 8)}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                      <StageTag stage={d.stage} type={d.type} />
                      {d.stuck && <StuckBadge />}
                      {d.firstViewedAt && !d.respondedAt && d.type === 'quote' && (
                        <span
                          style={{ fontSize: 10, color: '#6ee7b7', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Viewed ${d.viewCount}× · last ${fmtRelative(d.lastViewedAt)}`}
                        >
                          👁 viewed{d.viewCount > 1 ? ` ${d.viewCount}×` : ''}
                        </span>
                      )}
                      {(d.paidTotal > 0 || d.depositPaid > 0) && (
                        <span
                          style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={d.balanceDue > 0 ? `$${Math.max(d.paidTotal, d.depositPaid).toFixed(2)} of $${d.total.toFixed(2)}` : 'Paid in full'}
                        >
                          💳 ${Math.max(d.paidTotal, d.depositPaid).toFixed(2)}
                          {d.balanceDue > 0 ? ` (-$${d.balanceDue.toFixed(2)})` : ' paid'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    ${d.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td>{fmtRelative(d.updatedAt || d.createdAt)}</td>
                  <td style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                    <ActivityCell d={d} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <IconExternal style={{ width: 12, height: 12, color: 'var(--color-text-secondary)' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DocModal
          row={selected}
          detail={detail}
          onClose={() => { setSelected(null); setDetail(null); }}
        />
      )}
    </>
  );
}

const truncStyle = { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, maxWidth: 320 };
const activeChipStyle = {
  background: 'rgba(249, 115, 22, 0.15)',
  color: 'var(--color-accent-light)',
  borderColor: 'rgba(249, 115, 22, 0.3)',
};
const activeWarnChipStyle = {
  background: 'rgba(245, 158, 11, 0.18)',
  color: '#fcd34d',
  borderColor: 'rgba(245, 158, 11, 0.35)',
};

function StageTag({ stage, type }: { stage: DocStage; type: DocType }) {
  const cfg = stageStyle(stage);
  const label = stageLabel(stage, type);
  return (
    <span className={styles.tag} style={{
      background: `rgba(${cfg.rgb}, 0.15)`,
      color: cfg.color,
      borderColor: `rgba(${cfg.rgb}, 0.3)`,
      fontSize: 11,
    }}>
      {label}
    </span>
  );
}

function StuckBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        color: '#fcd34d',
        background: 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 999,
        padding: '1px 6px',
        fontWeight: 600,
      }}
      title="No movement for a while — may need a nudge"
    >
      ⚠ stuck
    </span>
  );
}

function stageStyle(stage: DocStage): { rgb: string; color: string } {
  switch (stage) {
    case 'draft': return { rgb: '100, 116, 139', color: '#94a3b8' };
    case 'quote_sent': return { rgb: '59, 130, 246', color: '#60a5fa' };
    case 'quote_accepted': return { rgb: '249, 115, 22', color: 'var(--color-accent-light)' };
    case 'quote_rejected': return { rgb: '239, 68, 68', color: '#fca5a5' };
    case 'invoice_sent': return { rgb: '245, 158, 11', color: '#fcd34d' };
    case 'partially_paid': return { rgb: '168, 85, 247', color: '#d8b4fe' };
    case 'paid': return { rgb: '16, 185, 129', color: '#6ee7b7' };
    case 'cancelled': return { rgb: '100, 116, 139', color: '#94a3b8' };
    default: return { rgb: '100, 116, 139', color: '#94a3b8' };
  }
}

function stageLabel(stage: DocStage, type: DocType): string {
  switch (stage) {
    case 'draft': return type === 'invoice' ? 'invoice draft' : 'draft';
    case 'quote_sent': return 'quote sent';
    case 'quote_accepted': return 'accepted';
    case 'quote_rejected': return 'rejected';
    case 'invoice_sent': return 'invoiced';
    case 'partially_paid': return 'part-paid';
    case 'paid': return 'paid';
    case 'cancelled': return 'cancelled';
    default: return stage;
  }
}

function ActivityCell({ d }: { d: DocumentRow }) {
  // Pick the most informative single line per stage. Avoids stuffing the cell.
  if (d.paidInFullAt) return <>paid {fmtRelative(d.paidInFullAt)}</>;
  if (d.depositPaidAt && d.stage === 'quote_accepted') return <>deposit {fmtRelative(d.depositPaidAt)}</>;
  if (d.respondedAt) return <>responded {fmtRelative(d.respondedAt)}</>;
  if (d.lastViewedAt) return <>viewed {fmtRelative(d.lastViewedAt)}</>;
  if (d.sentAt) return <>sent {fmtRelative(d.sentAt)}</>;
  return <span style={{ opacity: 0.4 }}>—</span>;
}

function StatTile({ label, value, sub, accent, warn }: { label: string; value: number | string; sub?: string; accent?: boolean; warn?: boolean }) {
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

function conversionRate(totals: Partial<ListTotals>): number {
  const sent = (totals.quote_sent || 0) + (totals.quote_accepted || 0) + (totals.quote_rejected || 0);
  if (!sent) return 0;
  return Math.round(((totals.quote_accepted || 0) / sent) * 100);
}

function DocModal({
  row,
  detail,
  onClose,
}: {
  row: DocumentRow;
  detail: any;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loading = !detail;
  const error = detail?.error;
  const full = detail?.document;
  const materials: any[] = full?.materials || [];
  const sections: any[] = full?.sections || [];
  const payments: any[] = full?.payments || [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 880, maxHeight: '90vh',
          background: '#0B1220', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <header style={{ display: 'flex', alignItems: 'start', gap: 14, padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconQuote style={{ width: 22, height: 22 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {row.customerName || '(no customer)'}
              {row.number && <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>· {row.number}</span>}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <StageTag stage={row.stage} type={row.type} />
              <span>${row.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span>Created {fmtDate(row.createdAt)}</span>
              {row.firstViewedAt && (
                <span style={{ color: '#6ee7b7' }}>
                  👁 Viewed {row.viewCount}× · first {fmtRelative(row.firstViewedAt)} · last {fmtRelative(row.lastViewedAt)}
                </span>
              )}
              {row.respondedAt && <span>Responded {fmtRelative(row.respondedAt)}</span>}
              {(row.paidTotal > 0 || row.depositPaid > 0) && (
                <span style={{ color: '#6ee7b7', fontWeight: 600 }}>
                  💳 ${Math.max(row.paidTotal, row.depositPaid).toFixed(2)} paid
                  {row.balanceDue > 0 ? ` · $${row.balanceDue.toFixed(2)} owing` : ' in full'}
                  {row.depositPaidAt && ` · ${fmtRelative(row.depositPaidAt)}`}
                </span>
              )}
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClose}>Close</button>
        </header>

        <div style={{ overflowY: 'auto', padding: 20 }}>
          {loading && (
            <div className={styles.centerLoader} style={{ minHeight: 120 }}><div className={styles.spinner} /></div>
          )}
          {error && (
            <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              <div className={styles.cardTitle}>Couldn't load document</div>
              <div className={styles.cardSubtitle}>Deleted or permissions changed.</div>
            </div>
          )}
          {full && (
            <>
              <div className={styles.detailSection}>
                <h3>Customer</h3>
                <div className={styles.detailFactGrid}>
                  <Fact label="Name" value={full.customerName || '—'} />
                  <Fact label="Email" value={full.customerEmail ? <a href={`mailto:${full.customerEmail}`}>{full.customerEmail}</a> : '—'} />
                  <Fact label="Phone" value={full.customerPhone ? <a href={`tel:${full.customerPhone}`}>{full.customerPhone}</a> : '—'} />
                  <Fact label="Address" value={full.jobAddress || '—'} />
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Tradie</h3>
                <div className={styles.detailFactGrid}>
                  <Fact label="Business" value={detail.userBusinessName || '—'} />
                  <Fact label="Email" value={detail.userEmail ? <a href={`mailto:${detail.userEmail}`}>{detail.userEmail}</a> : '—'} />
                  <Fact label="Profile" value={<Link href={`/admin/users?uid=${encodeURIComponent(row.uid)}`} style={{ color: 'var(--color-accent-light)' }}>Open profile →</Link>} />
                  <Fact label="All their docs" value={<Link href={`/admin/documents?uid=${encodeURIComponent(row.uid)}`} style={{ color: 'var(--color-accent-light)' }}>View all →</Link>} />
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Job</h3>
                {renderJob(full.job)}
              </div>

              <div className={styles.detailSection}>
                <h3>Lifecycle</h3>
                <div className={styles.detailFactGrid}>
                  <Fact label="Stage" value={<StageTag stage={row.stage} type={row.type} />} />
                  <Fact label="Type" value={row.type} />
                  <Fact label="Created" value={fmtDateTime(row.createdAt)} />
                  <Fact label="Updated" value={fmtDateTime(row.updatedAt)} />
                  {row.sentAt && <Fact label="First sent" value={fmtDateTime(row.sentAt)} />}
                  {row.firstViewedAt && <Fact label="First viewed" value={fmtDateTime(row.firstViewedAt)} />}
                  {row.respondedAt && <Fact label="Responded" value={fmtDateTime(row.respondedAt)} />}
                  {row.acceptedAt && <Fact label="Accepted" value={fmtDateTime(row.acceptedAt)} />}
                  {row.invoicedAt && <Fact label="Invoiced" value={fmtDateTime(row.invoicedAt)} />}
                  {row.dueDate && <Fact label="Due" value={fmtDate(row.dueDate)} />}
                  {row.paidInFullAt && <Fact label="Paid in full" value={fmtDateTime(row.paidInFullAt)} />}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Pricing</h3>
                <div className={styles.detailFactGrid}>
                  <Fact label="Materials subtotal" value={`$${Number(full.materialsSubtotal || 0).toFixed(2)}`} />
                  <Fact label="Labor total" value={`$${Number(full.laborTotal || 0).toFixed(2)}`} />
                  <Fact label="Subtotal (pre-markup)" value={`$${Number(full.subtotal || 0).toFixed(2)}`} />
                  <Fact
                    label={`Markup (${Number(full.markup || 0)}%${full.laborMarkup ? ` / labor ${Number(full.laborMarkup)}%` : ''})`}
                    value={`+$${Number(full.markupAmount || 0).toFixed(2)}`}
                  />
                  <Fact label="GST" value={`$${Number(full.gst || 0).toFixed(2)}`} />
                  <Fact label="Total" value={<strong>${Number(full.total || 0).toFixed(2)}</strong>} />
                  {Number(full.paidTotal || 0) > 0 && <Fact label="Paid" value={`$${Number(full.paidTotal).toFixed(2)}`} />}
                  {Number(full.balanceDue || 0) > 0 && <Fact label="Balance due" value={<span style={{ color: '#fcd34d' }}>${Number(full.balanceDue).toFixed(2)}</span>} />}
                </div>
              </div>

              {payments.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Payments ({payments.length})</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Kind</th>
                          <th>Method</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p: any, i: number) => (
                          <tr key={p.id || i} style={{ cursor: 'default' }}>
                            <td>{fmtDateTime(p.paidAt)}</td>
                            <td>{p.kind || '—'}</td>
                            <td>{p.method || '—'}</td>
                            <td style={{ textAlign: 'right' }}>${Number(p.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {sections.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Sections ({sections.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sections.map((s: any, i: number) => {
                      const sectionTotal = Number(s.total ?? s.laborTotal) || 0;
                      const label = typeof s.name === 'string' ? s.name : typeof s.title === 'string' ? s.title : `Section ${i + 1}`;
                      const totalHours = typeof s.laborHoursTotal === 'number'
                        ? s.laborHoursTotal
                        : typeof s.laborHours === 'number'
                          ? Math.round(s.laborHours * (Number(s.multiplier) || 1) * 100) / 100
                          : null;
                      const hoursLabel = totalHours !== null
                        ? `${totalHours}${typeof s.laborUnit === 'string' ? ` ${s.laborUnit}` : 'h'}`
                        : '';
                      return (
                        <div key={s.id || i} style={{ padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, fontSize: 13 }}>
                          <strong>{label}</strong>
                          {hoursLabel && (
                            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                              {hoursLabel}
                            </span>
                          )}
                          {sectionTotal > 0 && <span style={{ float: 'right' }}>${sectionTotal.toFixed(2)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {materials.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Materials ({materials.length})</h3>
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Unit</th>
                          <th style={{ textAlign: 'right' }}>Price</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.slice(0, 50).map((m: any, i: number) => (
                          <tr key={i} style={{ cursor: 'default' }}>
                            <td>{asText(m.name) || asText(m.title) || '—'}</td>
                            <td>{m.quantity ?? m.qty ?? '—'}</td>
                            <td>{asText(m.unit) || 'each'}</td>
                            <td style={{ textAlign: 'right' }}>${Number(m.price || 0).toFixed(2)}</td>
                            <td style={{ textAlign: 'right' }}>${Number(m.totalPrice || (Number(m.price || 0) * Number(m.quantity || m.qty || 0))).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {materials.length > 50 && (
                      <div style={{ padding: 10, fontSize: 12, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        {materials.length - 50} more…
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className={styles.detailSection}>
                <h3>Meta</h3>
                <div className={styles.detailFactGrid}>
                  <Fact label="Document ID" value={<code style={{ fontSize: 11 }}>{row.id}</code>} />
                  <Fact label="Job ID" value={row.jobId ? <code style={{ fontSize: 11 }}>{row.jobId}</code> : '—'} />
                  <Fact label="Acceptance token" value={row.hasAcceptanceToken ? 'Generated' : '—'} />
                  {row.paymentLinkUrl && (
                    <Fact label="Pay link" value={<a href={row.paymentLinkUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent-light)' }}>Open →</a>} />
                  )}
                  {full.notes && <Fact label="Internal notes" value={asText(full.notes)} />}
                  {full.clientNotes && <Fact label="Client notes" value={asText(full.clientNotes)} />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailFact}>
      <div className={styles.detailFactLabel}>{label}</div>
      <div className={styles.detailFactValue}>{value}</div>
    </div>
  );
}

function asText(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text;
    if (typeof v.value === 'string') return v.value;
    if (typeof v.description === 'string') return v.description;
    if (typeof v.name === 'string') return v.name;
    try { return JSON.stringify(v); } catch { return ''; }
  }
  return '';
}

function renderJob(job: any): React.ReactNode {
  if (!job) return <span style={{ color: 'var(--color-text-secondary)' }}>—</span>;
  if (typeof job === 'string') {
    return (
      <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {job}
      </div>
    );
  }
  const name = typeof job.name === 'string' ? job.name : null;
  const description = typeof job.description === 'string' ? job.description : null;
  const template = typeof job.template === 'string' ? job.template : null;
  const estimatedHours = typeof job.estimatedHours === 'number' ? job.estimatedHours : null;
  return (
    <div>
      {name && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{name}</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
        {template && <span>template: {template}</span>}
        {estimatedHours !== null && <span>est. {estimatedHours}h</span>}
      </div>
      {description && (
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {description}
        </div>
      )}
      {!name && !description && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No job description.</div>
      )}
    </div>
  );
}
