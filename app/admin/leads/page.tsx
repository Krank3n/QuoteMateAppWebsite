'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconUsers, IconSend, IconEmail, IconPhone, IconExternal, IconNote } from '../components/icons';

// ============================================================
// TYPES + CONSTANTS
// ============================================================

interface LeadRow {
  id: string;
  businessName: string | null;
  trade: string | null;
  ownerName: string | null;
  suburb: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  websiteUrl: string | null;
  status: string;
  googleRating: number | null;
  googleReviewCount: number | null;
  generatedSubject: string | null;
  enrichmentSummary: string | null;
  enrichmentConfidence: 'low' | 'medium' | 'high' | null;
  campaignId: string | null;
  scrapedAt: number | null;
  enrichedAt: number | null;
  queuedAt: number | null;
  sentAt: number | null;
  engagedAt: number | null;
  repliedAt: number | null;
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'researched', label: 'Researched' },
  { id: 'queued', label: 'Queued' },
  { id: 'sent', label: 'Sent' },
  { id: 'engaged', label: 'Engaged' },
  { id: 'replied', label: 'Replied' },
  { id: 'converted', label: 'Converted' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'dnc', label: 'DNC' },
  { id: 'bounced', label: 'Bounced' },
];

const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8',
  researching: '#94a3b8',
  researched: '#60a5fa',
  queued: '#fcd34d',
  sent: '#a78bfa',
  engaged: '#10b981',
  replied: '#22d3ee',
  converted: '#10b981',
  rejected: '#fca5a5',
  dnc: '#fca5a5',
  bounced: '#fca5a5',
};

function StatusBadge({ status, size = 'md' }: { status: string; size?: 'sm' | 'md' }) {
  const c = STATUS_COLORS[status] || '#94a3b8';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        borderRadius: 12,
        background: `${c}22`,
        color: c,
        fontSize: size === 'sm' ? 10 : 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ============================================================
// PAGE SHELL — split view
// ============================================================

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <LeadsPageInner />
    </Suspense>
  );
}

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const detailId = searchParams?.get('id') || null;

  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const args: any = { limit: 300 };
    if (statusFilter !== 'all') args.status = statusFilter;
    if (tradeFilter !== 'all') args.trade = tradeFilter;
    api.listLeads(args).then((r: any) => {
      if (cancelled) return;
      setLeads(r.leads || []);
      setSummary(r.summary || {});
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      setLoading(false);
      setToast({ msg: e?.message || 'Failed to load leads', error: true });
    });
    return () => { cancelled = true; };
  }, [statusFilter, tradeFilter, refreshTick]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) =>
      (l.businessName || '').toLowerCase().includes(q) ||
      (l.suburb || '').toLowerCase().includes(q) ||
      (l.ownerName || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q),
    );
  }, [leads, search]);

  useSetPageMeta({
    title: 'Leads',
    breadcrumb: `${filtered.length} ${statusFilter === 'all' ? 'total' : statusFilter}`,
    actions: (
      <Link href="/admin/leads/discovery" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}>
        + Discover leads
      </Link>
    ),
  });

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(filtered.map((l) => l.id)));
  const clearSelection = () => setSelected(new Set());
  const refresh = () => setRefreshTick((n) => n + 1);

  const ids = Array.from(selected);

  const runBulk = async (kind: 'research' | 'generate' | 'approve' | 'reject') => {
    if (!ids.length) return;
    if (kind === 'approve') {
      const sample = filtered
        .filter((l) => ids.includes(l.id))
        .slice(0, 3)
        .map((l) => `• ${l.businessName} → ${l.generatedSubject || '(no subject)'}`).join('\n');
      const ok = window.confirm(`Send ${ids.length} cold email(s)?\n\nFirst few:\n${sample}\n\nThis can't be undone.`);
      if (!ok) return;
    }
    if (kind === 'reject') {
      const reason = window.prompt('Rejection reason?', 'manual');
      if (!reason) return;
      const dnc = window.confirm('Add to DNC list?');
      setBusy(kind);
      try {
        const r: any = await api.rejectLeads({ leadIds: ids, reason, dnc });
        setToast({ msg: `Rejected ${r.rejected}` });
        clearSelection();
        refresh();
      } catch (e: any) {
        setToast({ msg: e?.message || 'Reject failed', error: true });
      } finally {
        setBusy(null);
        setTimeout(() => setToast(null), 4000);
      }
      return;
    }
    setBusy(kind);
    try {
      let r: any;
      if (kind === 'research') r = await api.enrichLeads({ leadIds: ids });
      else if (kind === 'generate') r = await api.generateLeadMessages({ leadIds: ids });
      else r = await api.approveLeads({ leadIds: ids });
      const labels: Record<string, string> = { research: 'Enriched', generate: 'Generated', approve: 'Sent' };
      const successKey = kind === 'research' ? 'enriched' : kind === 'generate' ? 'generated' : 'sent';
      setToast({
        msg: `${labels[kind]} ${r[successKey] ?? 0} · skipped ${r.skipped ?? 0}${r.failed ? ` · failed ${r.failed}` : ''}`,
        error: r.failed > 0,
      });
      clearSelection();
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || `${kind} failed`, error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const closeDetail = () => {
    router.replace('/admin/leads');
  };

  // Layout: when a detail pane is open, list collapses to a narrow column.
  const splitView = !!detailId;

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: splitView ? '0 0 380px' : 1, minWidth: 0 }}>
        {!splitView && (
          <div className={styles.statGrid} style={{ marginBottom: 16 }}>
            {['new', 'researched', 'queued', 'sent', 'engaged', 'replied', 'converted'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
                style={{
                  textAlign: 'left',
                  background: statusFilter === s ? `${STATUS_COLORS[s]}22` : 'var(--color-surface, #1e293b)',
                  border: `1px solid ${statusFilter === s ? STATUS_COLORS[s] : 'var(--color-border, #334155)'}`,
                  borderRadius: 12,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div className={styles.statLabel} style={{ color: STATUS_COLORS[s] }}>{s}</div>
                <div className={styles.statValue}>{summary[s] || 0}</div>
              </button>
            ))}
          </div>
        )}

        <div className={styles.card} style={{ marginBottom: 12, padding: splitView ? 12 : undefined }}>
          {!splitView ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Search business / suburb / owner / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 280px', maxWidth: 360 }}
              />
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); clearSelection(); }}
              >
                {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select
                className={styles.select}
                value={tradeFilter}
                onChange={(e) => { setTradeFilter(e.target.value); clearSelection(); }}
              >
                <option value="all">All trades</option>
                <option value="fencer">Fencer</option>
                <option value="landscaper">Landscaper</option>
                <option value="deck-builder">Deck builder</option>
              </select>
              <div style={{ flex: 1 }} />
              {selected.size > 0 ? <BulkActions selected={selected.size} busy={busy} onClear={clearSelection} onAction={runBulk} /> : (
                <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={selectAll} disabled={!filtered.length}>Select all</button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                className={styles.input}
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.select}
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); clearSelection(); }}
              >
                {STATUS_FILTERS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              {selected.size > 0 && (
                <div style={{ paddingTop: 4 }}>
                  <BulkActions selected={selected.size} busy={busy} onClear={clearSelection} onAction={runBulk} compact />
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.centerLoader} style={{ minHeight: 200 }}><div className={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.card}>
            <div className={styles.empty}>
              <IconUsers className={styles.emptyIcon} />
              <div className={styles.emptyTitle}>No leads</div>
              <div className={styles.emptyText}>Run a discovery to find tradies in a suburb.</div>
              <Link href="/admin/leads/discovery" className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} style={{ marginTop: 12 }}>
                Discover leads
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
            {filtered.map((l) => (
              <LeadListRow
                key={l.id}
                lead={l}
                isSelected={selected.has(l.id)}
                isOpen={detailId === l.id}
                compact={splitView}
                onToggle={() => toggle(l.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detailId && (
        <div style={{ flex: 1, minWidth: 0, position: 'sticky', top: 16 }}>
          <LeadDetail leadId={detailId} onClose={closeDetail} onChange={refresh} />
        </div>
      )}

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

// ============================================================
// LIST ROW
// ============================================================

function LeadListRow({ lead, isSelected, isOpen, compact, onToggle }: {
  lead: LeadRow;
  isSelected: boolean;
  isOpen: boolean;
  compact: boolean;
  onToggle: () => void;
}) {
  const lastTouchMs = lead.engagedAt || lead.sentAt || lead.queuedAt || lead.enrichedAt || lead.scrapedAt;
  const bg = isOpen ? 'rgba(249, 115, 22, 0.08)' : isSelected ? 'rgba(249, 115, 22, 0.04)' : 'transparent';

  if (compact) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '20px 1fr auto',
          gap: 10,
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid var(--color-border, #334155)',
          background: bg,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onToggle(); }}
          onClick={(e) => e.stopPropagation()}
          aria-label="select"
        />
        <Link href={`/admin/leads?id=${lead.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0 }}>
          <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lead.businessName || '(unnamed)'}
          </div>
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 2 }}>
            {lead.suburb || '—'}
          </div>
        </Link>
        <StatusBadge status={lead.status} size="sm" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '24px minmax(220px, 1.6fr) 110px 90px 100px minmax(180px, 1.4fr) 90px',
        gap: 12,
        alignItems: 'center',
        padding: '12px 14px',
        borderBottom: '1px solid var(--color-border, #334155)',
        background: bg,
      }}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        aria-label="select"
      />
      <Link href={`/admin/leads?id=${lead.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', minWidth: 0 }}>
        <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.businessName || '(unnamed)'}
        </div>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.ownerName ? `${lead.ownerName} · ` : ''}
          {lead.suburb || '—'}{lead.state ? `, ${lead.state}` : ''}
          {lead.googleRating ? ` · ★ ${lead.googleRating} (${lead.googleReviewCount || 0})` : ''}
        </div>
      </Link>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{lead.trade || '—'}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {lead.email && <span title={lead.email} style={{ display: 'inline-flex' }}><IconEmail style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
        {(lead.mobile || lead.phone) && <span title={lead.mobile || lead.phone || ''} style={{ display: 'inline-flex' }}><IconPhone style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
        {lead.websiteUrl && <span title={lead.websiteUrl} style={{ display: 'inline-flex' }}><IconExternal style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
      </div>
      <div><StatusBadge status={lead.status} size="sm" /></div>
      <div
        style={{ color: 'var(--color-text-secondary)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={lead.generatedSubject || lead.enrichmentSummary || ''}
      >
        {lead.generatedSubject || (
          <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
            {lead.enrichmentSummary ? lead.enrichmentSummary.slice(0, 80) : '—'}
          </span>
        )}
      </div>
      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, textAlign: 'right' }}>{fmtRelative(lastTouchMs)}</div>
    </div>
  );
}

// ============================================================
// BULK ACTIONS
// ============================================================

function BulkActions({ selected, busy, onClear, onAction, compact }: {
  selected: number;
  busy: string | null;
  onClear: () => void;
  onAction: (kind: 'research' | 'generate' | 'approve' | 'reject') => void;
  compact?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 12 }}>{selected} selected</span>
      <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClear}>Clear</button>
      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={() => onAction('research')}>
        {busy === 'research' ? '…' : 'Research'}
      </button>
      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={() => onAction('generate')}>
        {busy === 'generate' ? '…' : 'Generate'}
      </button>
      <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={!!busy} onClick={() => onAction('approve')}>
        <IconSend style={{ width: 12, height: 12 }} /> {compact ? 'Send' : 'Approve & send'}
      </button>
      <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} disabled={!!busy} onClick={() => onAction('reject')}>Reject</button>
    </div>
  );
}

// ============================================================
// DETAIL PANE
// ============================================================

interface Hook {
  text: string;
  source?: string;
}

function LeadDetail({ leadId, onClose, onChange }: { leadId: string; onClose: () => void; onChange: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getLead({ id: leadId }).then((r: any) => {
      if (cancelled) return;
      setData(r);
      setSubject(r.lead.generatedSubject || '');
      setBody(r.lead.generatedBody || '');
      setDirty(false);
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      setLoading(false);
      setToast({ msg: e?.message || 'Failed to load lead', error: true });
    });
    return () => { cancelled = true; };
  }, [leadId, refreshTick]);

  const refresh = () => { setRefreshTick((n) => n + 1); onChange(); };

  if (loading) {
    return <div className={styles.card} style={{ minHeight: 400 }}><div className={styles.centerLoader}><div className={styles.spinner} /></div></div>;
  }
  if (!data) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Lead not found</div>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} style={{ marginTop: 12 }}>← Back to list</button>
        </div>
      </div>
    );
  }

  const lead = data.lead;
  const hooks: Hook[] = lead.personalizationHooks || [];

  const oneShot = (key: string, run: () => Promise<any>, label: string) => async () => {
    setBusy(key);
    try {
      const r: any = await run();
      setToast({ msg: typeof r === 'string' ? r : label, error: r?.error === true });
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || `${label} failed`, error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const enrich = oneShot('research', async () => {
    const r: any = await api.enrichLeads({ leadIds: [leadId] });
    return `Enriched: ${r.enriched}, failed: ${r.failed}`;
  }, 'Research');

  const generate = oneShot('generate', async () => {
    const r: any = await api.generateLeadMessages({ leadIds: [leadId] });
    return r.generated ? 'Message generated' : { error: true, message: 'Generation failed' };
  }, 'Generate');

  const saveMessage = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy('save');
    try {
      await api.updateLeadMessage({ id: leadId, subject: subject.trim(), body: body.trim() });
      setToast({ msg: 'Saved' });
      setDirty(false);
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Save failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const send = async () => {
    if (dirty) {
      const willSave = window.confirm('You have unsaved changes — save first?');
      if (willSave) await saveMessage();
    }
    const ok = window.confirm(`Send to ${lead.email}?\n\nSubject: ${subject}\n\nThis can't be undone.`);
    if (!ok) return;
    setBusy('send');
    try {
      const r: any = await api.approveLeads({ leadIds: [leadId] });
      if (r.sent) setToast({ msg: 'Sent ✓' });
      else setToast({ msg: r.issues?.[0]?.reason || 'Not sent', error: true });
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Send failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const reject = async () => {
    const reason = window.prompt('Rejection reason?', 'manual');
    if (!reason) return;
    const dnc = window.confirm('Add to DNC list?');
    setBusy('reject');
    try {
      await api.rejectLeads({ leadIds: [leadId], reason, dnc });
      setToast({ msg: 'Rejected' });
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Reject failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setBusy('note');
    try {
      await api.addLeadNote({ id: leadId, text: noteText.trim() });
      setNoteText('');
      setToast({ msg: 'Note added' });
      refresh();
    } catch (e: any) {
      setToast({ msg: e?.message || 'Note failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  let websiteHost = '';
  if (lead.websiteUrl) {
    try {
      websiteHost = new URL(lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`).hostname;
    } catch {
      websiteHost = lead.websiteUrl;
    }
  }

  const stage = (() => {
    if (['converted'].includes(lead.status)) return 6;
    if (['replied'].includes(lead.status)) return 5;
    if (['engaged'].includes(lead.status)) return 4;
    if (['sent'].includes(lead.status)) return 3;
    if (['queued'].includes(lead.status)) return 2;
    if (['researched'].includes(lead.status)) return 1;
    return 0;
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* HEADER */}
      <div className={styles.card} style={{ padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.businessName}
              </h2>
              <StatusBadge status={lead.status} />
            </div>
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              {lead.trade} · {lead.suburb}{lead.state ? `, ${lead.state}` : ''}
              {lead.googleRating ? ` · ★ ${lead.googleRating} (${lead.googleReviewCount || 0} reviews)` : ''}
            </div>
          </div>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} aria-label="Close">✕</button>
        </div>

        {/* PIPELINE PROGRESS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {['New', 'Researched', 'Queued', 'Sent', 'Engaged', 'Replied', 'Converted'].map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: i <= stage ? STATUS_COLORS[['new', 'researched', 'queued', 'sent', 'engaged', 'replied', 'converted'][i]] || '#94a3b8' : 'var(--color-border, #334155)',
              }}
              title={label}
            />
          ))}
        </div>

        {/* CONTACT GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, fontSize: 13 }}>
          <Fact label="Owner" value={lead.ownerName || '—'} mono={false} />
          <Fact label="Email" value={lead.email || <span style={{ color: 'var(--color-text-tertiary)' }}>not yet researched</span>} mono />
          <Fact label="Mobile" value={lead.mobile || lead.phone || <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>} mono />
          <Fact label="Website" value={lead.websiteUrl ? (
            <a href={lead.websiteUrl} target="_blank" rel="noopener" style={{ color: 'var(--color-accent-light)' }}>{websiteHost}</a>
          ) : '—'} mono />
        </div>
      </div>

      {/* RESEARCH */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Research</div>
            {lead.enrichmentConfidence && (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 2 }}>
                Confidence: <span style={{ color: lead.enrichmentConfidence === 'high' ? '#10b981' : lead.enrichmentConfidence === 'medium' ? '#fcd34d' : '#fca5a5' }}>{lead.enrichmentConfidence}</span>
              </div>
            )}
          </div>
          <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={enrich}>
            {busy === 'research' ? 'Researching…' : (lead.enrichmentSummary ? 'Re-research' : 'Research now')}
          </button>
        </div>
        {lead.enrichmentSummary ? (
          <>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>
              {lead.enrichmentSummary}
            </div>
            {hooks.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                  Personalization hooks ({hooks.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {hooks.map((h, i) => (
                    <div key={i} style={{ padding: '10px 12px', background: 'rgba(96, 165, 250, 0.06)', borderLeft: '3px solid #60a5fa', borderRadius: 6, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {h.text}
                      {h.source && <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 4 }}>{h.source}</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13, padding: '8px 0' }}>
            No research yet. Click <strong>Research now</strong> to scrape the website + extract owner name and personalisation hooks.
            {lead.enrichmentFailureReason && <div style={{ color: '#fcd34d', marginTop: 8, fontSize: 12 }}>Last attempt: {lead.enrichmentFailureReason}</div>}
          </div>
        )}
      </div>

      {/* GOOGLE REVIEWS — the gold mine for personalisation */}
      {Array.isArray(lead.googleReviews) && lead.googleReviews.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Google reviews ({lead.googleReviews.length})</div>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, marginTop: 2 }}>
                Real customer language — Claude pulls hooks from here when the website's thin.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lead.googleReviews.slice(0, 5).map((r: any, i: number) => (
              <div key={i} style={{ padding: '10px 12px', background: 'rgba(252, 211, 77, 0.06)', borderLeft: '3px solid #fcd34d', borderRadius: 6, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                  {'★'.repeat(r.rating || 0)} · {r.author || 'anon'} · {r.when || ''}
                </div>
                {r.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MESSAGE EDITOR */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Email message</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy || !lead.enrichmentSummary} onClick={generate}>
              {busy === 'generate' ? 'Generating…' : (lead.generatedSubject ? 'Re-generate' : 'Generate')}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} disabled={!dirty || !!busy} onClick={saveMessage}>
              {busy === 'save' ? '…' : 'Save'}
            </button>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={!!busy || !lead.email || !subject || !body} onClick={send}>
              <IconSend style={{ width: 12, height: 12 }} /> {busy === 'send' ? 'Sending…' : 'Send'}
            </button>
            <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} disabled={!!busy} onClick={reject}>Reject</button>
          </div>
        </div>
        {!lead.enrichmentSummary && !lead.generatedSubject ? (
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13, padding: '8px 0' }}>
            Research first, then generate a personalised message.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <input
                className={styles.input}
                placeholder="Subject"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setDirty(true); }}
                style={{ fontWeight: 600, flex: 1 }}
              />
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{subject.length}c</span>
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Body — paragraphs separated by <br><br>"
              value={body}
              onChange={(e) => { setBody(e.target.value); setDirty(true); }}
              style={{ minHeight: 180, fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>
                {body.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length} words
                {dirty && <span style={{ color: '#fcd34d', marginLeft: 8 }}>● unsaved</span>}
              </div>
              <button onClick={() => setShowPreview((v) => !v)} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                {showPreview ? 'Hide preview' : 'Show preview'}
              </button>
            </div>
            {showPreview && body && (
              <div
                style={{
                  marginTop: 12,
                  padding: 16,
                  background: '#ffffff',
                  borderRadius: 8,
                  color: '#0f172a',
                  fontSize: 14,
                  lineHeight: 1.6,
                  border: '1px solid var(--color-border, #334155)',
                }}
                dangerouslySetInnerHTML={{ __html: `<div><strong style="font-size:13px;color:#475569;">Subject:</strong> ${subject || '(no subject)'}</div><hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0 12px;"/>${body}` }}
              />
            )}
          </>
        )}
      </div>

      {/* OUTREACH HISTORY */}
      {data.outreach.length > 0 && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Outreach history</div>
          </div>
          {data.outreach.map((o: any) => (
            <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border, #334155)' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>{o.subject}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                Sent {fmtRelative(o.sentAt)}
                {o.openCount > 0 && <span style={{ color: '#10b981', marginLeft: 8 }}>· {o.openCount} open(s)</span>}
                {o.clickCount > 0 && <span style={{ color: '#22d3ee', marginLeft: 8 }}>· {o.clickCount} click(s)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NOTES */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardTitle}>Notes</div>
        </div>
        <textarea
          className={styles.textarea}
          placeholder="Add a note about this lead…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          style={{ minHeight: 60 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
            disabled={!noteText.trim() || !!busy}
            onClick={addNote}
          >
            <IconNote style={{ width: 12, height: 12 }} /> Add note
          </button>
        </div>
        {data.notes.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border, #334155)' }}>
            {data.notes.map((n: any) => (
              <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border, #334155)' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{n.text}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{fmtRelative(n.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: any; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 13, fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : undefined, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  );
}
