'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtDate, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconQuote, IconExternal } from '../components/icons';

interface Quote {
  id: string;
  uid: string;
  userEmail: string | null;
  userBusinessName: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  jobAddress: string | null;
  job: string | null;
  status: string;
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
  respondedAt: number | null;
  respondedBy: string | null;
  firstViewedAt: number | null;
  lastViewedAt: number | null;
  viewCount: number;
  hasAcceptanceToken: boolean;
  depositPaid: number;
  paidTotal: number;
  balanceDue: number;
  depositPaidAt: number | null;
  squarePaymentId: string | null;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'declined', label: 'Declined' },
];

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Quote | null>(null);
  const [quoteDetail, setQuoteDetail] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 500 };
    if (status !== 'all') params.status = status;
    api.listQuotes(params)
      .then((r: any) => {
        console.log('[admin/quotes] listQuotes resolved', {
          count: r?.quotes?.length,
          totals: r?.totals,
          cancelled,
        });
        if (cancelled) return;
        setQuotes(r?.quotes || []);
        setTotals(r?.totals || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error('[admin/quotes] listQuotes failed', err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [status]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quotes;
    return quotes.filter((qu) =>
      [qu.customerName, qu.customerEmail, qu.customerPhone, qu.jobAddress, qu.job, qu.userBusinessName, qu.userEmail]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [quotes, search]);

  useSetPageMeta({
    title: 'Quotes',
    breadcrumb: `${quotes.length} recent quotes · $${Math.round(totals.valueAccepted || 0).toLocaleString()} accepted`,
    search: { value: search, onChange: setSearch, placeholder: 'Customer, job, tradie…' },
  });

  const openQuote = async (q: Quote) => {
    setSelected(q);
    setQuoteDetail(null);
    try {
      const r: any = await api.getQuote({ uid: q.uid, id: q.id });
      setQuoteDetail(r);
    } catch (e) {
      setQuoteDetail({ error: true });
    }
  };

  return (
    <>
      <div className={styles.statGrid}>
        <StatTile label="Total quoted value" value={`$${Math.round(totals.valueAll || 0).toLocaleString()}`} sub={`${totals.all || 0} quotes incl. drafts`} />
        <StatTile label="Sent out" value={`$${Math.round(totals.valueSent || 0).toLocaleString()}`} sub={`${totals.sent + totals.viewed + totals.accepted + totals.declined || 0} sent to customers`} />
        <StatTile
          label="Accepted"
          value={`$${Math.round(totals.valueAccepted || 0).toLocaleString()}`}
          sub={`${totals.accepted || 0} quotes · ${conversionRate(totals)}% of sent`}
          accent
        />
        <StatTile
          label="Paid via Square"
          value={`$${Math.round(totals.valuePaid || 0).toLocaleString()}`}
          sub={`${totals.paidCount || 0} quotes with Square payments`}
        />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Quote log</div>
            <div className={styles.cardSubtitle}>{loading ? 'Loading…' : `${filtered.length} of ${quotes.length} shown`}</div>
          </div>
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          {STATUS_FILTERS.map((f) => {
            const on = status === f.id;
            const count = f.id === 'all' ? totals.all : totals[f.id];
            return (
              <button
                key={f.id}
                className={styles.chip}
                onClick={() => setStatus(f.id)}
                style={on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
              >
                {f.label}
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
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Created</th>
                <th>Responded</th>
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
                    <div className={styles.emptyTitle}>No quotes match</div>
                    <div className={styles.emptyText}>Try a different filter.</div>
                  </div>
                </td></tr>
              ) : filtered.map((q) => (
                <tr key={`${q.uid}-${q.id}`} onClick={() => openQuote(q)}>
                  <td>
                    <div className={styles.rowPrimary} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                      {q.customerName || <span style={{ opacity: 0.5 }}>no customer name</span>}
                    </div>
                    <div className={styles.rowSecondary} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 }}>
                      {q.job || q.jobAddress || q.customerEmail || ''}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/users?uid=${encodeURIComponent(q.uid)}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
                    >
                      <div className={styles.listAvatar} style={{ width: 24, height: 24, fontSize: 10 }}>
                        {initials(q.userBusinessName || q.userEmail)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                          {q.userBusinessName || q.userEmail?.split('@')[0] || q.uid.slice(0, 8)}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <QuoteStatusTag status={q.status} />
                      {q.firstViewedAt && !q.respondedAt && (
                        <span
                          style={{ fontSize: 10, color: '#6ee7b7', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Viewed ${q.viewCount}× · last ${fmtRelative(q.lastViewedAt)}`}
                        >
                          👁 viewed{q.viewCount > 1 ? ` ${q.viewCount}×` : ''}
                        </span>
                      )}
                      {(q.paidTotal > 0 || q.depositPaid > 0) && (
                        <span
                          style={{ fontSize: 10, color: '#6ee7b7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={q.balanceDue > 0 ? `$${(q.paidTotal || q.depositPaid).toFixed(2)} of $${q.total.toFixed(2)}` : 'Paid in full'}
                        >
                          💳 ${(Math.max(q.paidTotal, q.depositPaid)).toFixed(2)}
                          {q.balanceDue > 0 ? ` (-$${q.balanceDue.toFixed(2)})` : ' paid'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>${q.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{fmtRelative(q.createdAt)}</td>
                  <td>{q.respondedAt ? fmtRelative(q.respondedAt) : q.firstViewedAt ? <span style={{ color: '#6ee7b7', fontSize: 12 }}>viewed {fmtRelative(q.lastViewedAt)}</span> : <span style={{ opacity: 0.4 }}>—</span>}</td>
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
        <QuoteModal
          quote={selected}
          detail={quoteDetail}
          onClose={() => { setSelected(null); setQuoteDetail(null); }}
        />
      )}
    </>
  );
}

function QuoteStatusTag({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: styles.tagFree,
    sent: styles.tagTrial,
    viewed: styles.tagTrial,
    accepted: styles.tagPro,
    declined: styles.tagCanceled,
    expired: styles.tagCanceled,
  };
  return <span className={`${styles.tag} ${map[status] || ''}`}>{status}</span>;
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

function conversionRate(totals: any): number {
  const sent = (totals.sent || 0) + (totals.viewed || 0) + (totals.accepted || 0) + (totals.declined || 0);
  if (!sent) return 0;
  return Math.round(((totals.accepted || 0) / sent) * 100);
}

function QuoteModal({
  quote,
  detail,
  onClose,
}: {
  quote: Quote;
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
  const full = detail?.quote;
  const materials: any[] = full?.materials || [];
  const sections: any[] = full?.sections || [];

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
            <div style={{ fontSize: 18, fontWeight: 700 }}>{quote.customerName || '(no customer)'}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <QuoteStatusTag status={quote.status} />
              <span>${quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span>Created {fmtDate(quote.createdAt)}</span>
              {quote.firstViewedAt && (
                <span style={{ color: '#6ee7b7' }}>
                  👁 Viewed {quote.viewCount}× · first {fmtRelative(quote.firstViewedAt)} · last {fmtRelative(quote.lastViewedAt)}
                </span>
              )}
              {quote.respondedAt && <span>Responded {fmtRelative(quote.respondedAt)}</span>}
              {(quote.paidTotal > 0 || quote.depositPaid > 0) && (
                <span style={{ color: '#6ee7b7', fontWeight: 600 }}>
                  💳 ${(Math.max(quote.paidTotal, quote.depositPaid)).toFixed(2)} paid{quote.balanceDue > 0 ? ` · $${quote.balanceDue.toFixed(2)} owing` : ' in full'}
                  {quote.depositPaidAt && ` · ${fmtRelative(quote.depositPaidAt)}`}
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
              <div className={styles.cardTitle}>Couldn't load quote</div>
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
                  <Fact label="Open profile" value={<Link href={`/admin/users?uid=${encodeURIComponent(quote.uid)}`} style={{ color: 'var(--color-accent-light)' }}>Go to user →</Link>} />
                </div>
              </div>

              <div className={styles.detailSection}>
                <h3>Job</h3>
                {renderJob(full.job)}
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
                  {Number(full.travelAdjustmentAmount || 0) > 0 && (
                    <Fact
                      label={`Travel (${Number(full.travelAdjustment || 0)}%)`}
                      value={`+$${Number(full.travelAdjustmentAmount || 0).toFixed(2)}`}
                    />
                  )}
                  <Fact
                    label="Subtotal with markup"
                    value={`$${(Number(full.subtotal || 0) + Number(full.markupAmount || 0) + Number(full.travelAdjustmentAmount || 0)).toFixed(2)}`}
                  />
                  <Fact label="GST" value={`$${Number(full.gst || 0).toFixed(2)}`} />
                  <Fact label="Total" value={<strong>${Number(full.total || 0).toFixed(2)}</strong>} />
                </div>
              </div>

              {sections.length > 0 && (
                <div className={styles.detailSection}>
                  <h3>Sections ({sections.length})</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {sections.map((s: any, i: number) => {
                      const sectionTotal = Number(s.total ?? s.laborTotal) || 0;
                      const label = typeof s.name === 'string' ? s.name : typeof s.title === 'string' ? s.title : `Section ${i + 1}`;
                      const hoursLabel = typeof s.laborHours === 'number'
                        ? `${s.laborHours}${typeof s.laborUnit === 'string' ? ` ${s.laborUnit}` : 'h'}`
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
                  <Fact label="Quote ID" value={<code style={{ fontSize: 11 }}>{quote.id}</code>} />
                  <Fact label="Created" value={fmtDateTime(quote.createdAt)} />
                  <Fact label="Updated" value={fmtDateTime(quote.updatedAt)} />
                  <Fact label="Acceptance token" value={quote.hasAcceptanceToken ? 'Generated' : '—'} />
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

// Coerce a quote field that might be a string, number, or object into something
// React can render. Object shapes vary (job, clientNotes, notes can all be either).
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
  // Object shape: { name, description, template, estimatedHours, customParams, ... }
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
