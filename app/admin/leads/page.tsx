'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
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

// Tri-state master checkbox: empty → indeterminate (some selected) → checked (all).
// Click cycles through select-all / clear.
function MasterCheckbox({ totalCount, selectedCount, onToggle }: {
  totalCount: number;
  selectedCount: number;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const allSelected = totalCount > 0 && selectedCount === totalCount;
  const indeterminate = selectedCount > 0 && selectedCount < totalCount;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allSelected}
      disabled={totalCount === 0}
      onChange={onToggle}
      aria-label={allSelected ? 'Deselect all' : 'Select all'}
      title={allSelected ? 'Deselect all' : `Select all ${totalCount} visible`}
      style={{ cursor: totalCount === 0 ? 'default' : 'pointer' }}
    />
  );
}

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
  const [configState, setConfigState] = useState<any>(null);
  const [configOpen, setConfigOpen] = useState(false);

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

  // Load outreach config (kill switch + caps + today's count)
  useEffect(() => {
    let cancelled = false;
    api.getLeadConfig({}).then((r: any) => {
      if (!cancelled) setConfigState(r);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [refreshTick]);

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

  // Master checkbox toggle: select all visible filtered, or clear.
  const toggleAllVisible = () => {
    const visibleIds = filtered.map((l) => l.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
    if (allSelected) {
      // Clear only the visible ones (preserve any selections that got hidden by filter changes).
      setSelected((s) => {
        const next = new Set(s);
        for (const id of visibleIds) next.delete(id);
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        for (const id of visibleIds) next.add(id);
        return next;
      });
    }
  };
  // Count of selected leads that are currently visible after filtering.
  const visibleSelectedCount = filtered.reduce((n, l) => n + (selected.has(l.id) ? 1 : 0), 0);

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
          <>
            {/* CONFIG STATUS STRIP */}
            <ConfigStrip configState={configState} onEdit={() => setConfigOpen(true)} />
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
          </>
        )}

        <div className={styles.card} style={{ marginBottom: 12, padding: splitView ? 12 : undefined }}>
          {!splitView ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
                <MasterCheckbox totalCount={filtered.length} selectedCount={visibleSelectedCount} onToggle={toggleAllVisible} />
                <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 600, minWidth: 64 }}>
                  {selected.size > 0 ? `${selected.size}/${filtered.length}` : `${filtered.length} leads`}
                </span>
              </div>
              <input
                type="text"
                className={styles.input}
                placeholder="Search business / suburb / owner / email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: '1 1 240px', maxWidth: 320 }}
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
              {selected.size > 0 && <BulkActions selected={selected.size} busy={busy} onClear={clearSelection} onAction={runBulk} />}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MasterCheckbox totalCount={filtered.length} selectedCount={visibleSelectedCount} onToggle={toggleAllVisible} />
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Search…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
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

      {configOpen && (
        <ConfigModal
          initial={configState?.config}
          schedule={configState?.schedule || []}
          onClose={() => setConfigOpen(false)}
          onSaved={(msg) => {
            setConfigOpen(false);
            setToast({ msg });
            refresh();
            setTimeout(() => setToast(null), 3000);
          }}
        />
      )}

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

// ============================================================
// CONFIG STRIP + MODAL
// ============================================================

function ConfigStrip({ configState, onEdit }: { configState: any; onEdit: () => void }) {
  if (!configState) {
    return (
      <div className={styles.card} style={{ marginBottom: 12, padding: 12, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
        Loading outreach config…
      </div>
    );
  }
  const cfg = configState.config || {};
  const eff = configState.effective || {};
  const enabled = cfg.enabled === true;
  const dailyMax = eff.dailyMaxSends ?? cfg.dailyMaxSends ?? 0;
  const sentToday = configState.sentLast24h ?? 0;
  const remaining = configState.remainingToday ?? 0;
  const pct = dailyMax > 0 ? Math.min(100, (sentToday / dailyMax) * 100) : 0;
  const danger = !enabled;
  const isAuto = eff.source === 'auto';
  const history: Array<{ date: string; count: number }> = configState.history || [];
  const maxInHistory = Math.max(1, ...history.map((h) => h.count));

  return (
    <div
      className={styles.card}
      style={{
        marginBottom: 12,
        padding: 14,
        borderLeft: `4px solid ${danger ? '#fca5a5' : '#10b981'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: danger ? '#fca5a5' : '#10b981' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {enabled ? 'Outreach enabled' : 'Outreach disabled'}
          </div>
          {isAuto && eff.currentStage && (
            <span style={{
              padding: '2px 8px',
              background: 'rgba(96, 165, 250, 0.15)',
              color: '#60a5fa',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              Auto-ramp · day {eff.currentDay}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
            <span>Today: <strong style={{ color: 'var(--color-text-primary)' }}>{sentToday}</strong> / {dailyMax}</span>
            <span>{remaining} remaining</span>
          </div>
          <div style={{ height: 6, background: 'var(--color-border, #334155)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: pct > 90 ? '#fcd34d' : '#10b981', transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'right' }}>
          <div>Hourly cap: {eff.hourlyMaxSends ?? cfg.hourlyMaxSends ?? '—'}</div>
          <div>{configState.sentLastHour ?? 0} sent in last hour</div>
        </div>
        <button onClick={onEdit} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}>Edit caps</button>
      </div>

      {isAuto && eff.currentStage && (
        <div style={{ marginTop: 12, padding: 10, background: 'rgba(96, 165, 250, 0.06)', borderRadius: 6, fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span><strong style={{ color: 'var(--color-text-primary)' }}>{eff.currentStage.label}</strong> — {eff.currentStage.daily}/day, {eff.currentStage.hourly}/hour</span>
          {eff.nextStage && eff.daysUntilNext != null && (
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              Next: {eff.nextStage.label} ({eff.nextStage.daily}/day) in {eff.daysUntilNext} day{eff.daysUntilNext === 1 ? '' : 's'}
            </span>
          )}
        </div>
      )}

      {enabled && (
        <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 6, fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          <span><strong style={{ color: 'var(--color-text-primary)' }}>Auto-send active</strong> — runs every 30 min, Mon-Fri 9am-5pm AEST. Close your browser; queued leads still go out at the cap.</span>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, fontWeight: 600 }}>
            Last 14 days · sends per day
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
            {history.map((h) => {
              const heightPct = (h.count / maxInHistory) * 100;
              return (
                <div
                  key={h.date}
                  title={`${h.date}: ${h.count} sent`}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
                >
                  <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        minHeight: h.count > 0 ? 2 : 0,
                        background: h.count > 0 ? '#10b981' : 'var(--color-border, #334155)',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                    {h.count > 0 ? h.count : ''}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
            <span>{history[0]?.date.slice(5)}</span>
            <span>today</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ConfigModal({ initial, schedule, onClose, onSaved }: {
  initial: any;
  schedule: Array<{ dayFrom: number; dayTo: number; label: string; daily: number; hourly: number }>;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [enabled, setEnabled] = useState<boolean>(initial?.enabled === true);
  const [warmupAuto, setWarmupAuto] = useState<boolean>(initial?.warmupAuto === true);
  const [warmupStartedAt, setWarmupStartedAt] = useState<number | null>(initial?.warmupStartedAt ?? null);
  const [dailyMaxSends, setDailyMaxSends] = useState<number>(initial?.dailyMaxSends ?? 5);
  const [hourlyMaxSends, setHourlyMaxSends] = useState<number>(initial?.hourlyMaxSends ?? 3);
  const [perDomainMax, setPerDomainMax] = useState<number>(initial?.perDomainMax ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.updateLeadConfig({
        enabled,
        warmupAuto,
        warmupStartedAt,
        dailyMaxSends,
        hourlyMaxSends,
        perDomainMax,
      });
      onSaved('Outreach config saved');
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const startedDateStr = warmupStartedAt ? new Date(warmupStartedAt).toISOString().slice(0, 10) : '';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20, overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.card}
        style={{ maxWidth: 540, width: '100%', padding: 24, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>Outreach send caps</h3>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>✕</button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--color-surface-2, #0f172a)', borderRadius: 8, marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Enable outreach sending</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Master kill switch. Off = nothing sends.</div>
          </div>
        </label>

        {/* AUTO RAMP */}
        <div style={{ padding: 12, background: warmupAuto ? 'rgba(96, 165, 250, 0.06)' : 'var(--color-surface-2, #0f172a)', border: warmupAuto ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid var(--color-border, #334155)', borderRadius: 8, marginBottom: 14 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={warmupAuto}
              onChange={(e) => {
                setWarmupAuto(e.target.checked);
                if (e.target.checked && !warmupStartedAt) setWarmupStartedAt(Date.now());
              }}
              style={{ marginTop: 2 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Auto-ramp warmup schedule</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                Caps follow a deliverability-safe ramp. Override the manual caps below.
              </div>
            </div>
          </label>

          {warmupAuto && (
            <div style={{ marginTop: 12, marginLeft: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                Warmup start date
              </label>
              <input
                type="date"
                className={styles.input}
                value={startedDateStr}
                onChange={(e) => {
                  const v = e.target.value;
                  setWarmupStartedAt(v ? new Date(v + 'T00:00:00').getTime() : null);
                }}
                style={{ width: 200 }}
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                Day count starts here. Set to today for a fresh subdomain. Set earlier if you've already been sending from this domain (lying about the start date burns reputation, not us).
              </div>

              <div style={{ marginTop: 14, marginBottom: 6, fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                Schedule
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
                {schedule.map((s) => (
                  <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px', gap: 8, padding: '6px 10px', background: 'var(--color-surface-2, #0f172a)', borderRadius: 4, color: 'var(--color-text-secondary)' }}>
                    <span>{s.label}</span>
                    <span style={{ textAlign: 'right' }}>{s.daily}/day</span>
                    <span style={{ textAlign: 'right', color: 'var(--color-text-tertiary)' }}>{s.hourly}/hr</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MANUAL CAPS */}
        <div style={{ marginBottom: 6, fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
          Manual caps {warmupAuto && <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(ignored while auto-ramp is on)</span>}
        </div>
        <div style={{ opacity: warmupAuto ? 0.5 : 1, pointerEvents: warmupAuto ? 'none' : 'auto' }}>
          <NumberField label="Daily max sends" value={dailyMaxSends} onChange={setDailyMaxSends} hint="Hard cap per rolling 24h." />
          <NumberField label="Hourly max sends" value={hourlyMaxSends} onChange={setHourlyMaxSends} hint="Throttle within the day. Spreads sends naturally." />
        </div>
        <NumberField label="Per-domain max" value={perDomainMax} onChange={setPerDomainMax} hint="Max sends to any one email domain per batch. Keep at 1 — applies regardless of auto-ramp." />

        {error && <div style={{ marginTop: 14, padding: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: 6, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} disabled={saving}>Cancel</button>
          <button onClick={save} className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, hint }: { label: string; value: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</label>
      <input
        type="number"
        className={styles.input}
        value={value}
        min={0}
        max={10000}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        style={{ width: 140 }}
      />
      {hint && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{hint}</div>}
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
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy || !subject || !body} onClick={async () => {
              const defaultTo = (window as any).__lastTestEmail || '';
              const to = window.prompt('Test send the message to:', defaultTo);
              if (!to) return;
              if (dirty) {
                const willSave = window.confirm('You have unsaved changes — save first?');
                if (willSave) await saveMessage();
              }
              (window as any).__lastTestEmail = to;
              setBusy('test-send');
              try {
                await api.testSendLead({ leadId, to });
                setToast({ msg: `Test sent to ${to} (subject prefixed [TEST])` });
              } catch (e: any) {
                setToast({ msg: e?.message || 'Test send failed', error: true });
              } finally {
                setBusy(null);
                setTimeout(() => setToast(null), 5000);
              }
            }}>
              {busy === 'test-send' ? 'Sending…' : 'Test send'}
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

      {/* REPLY TRACKING — show only after the lead's been sent */}
      {['sent', 'engaged', 'replied'].includes(lead.status) && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Reply tracking</div>
              {lead.repliedAt ? (
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Marked replied {fmtRelative(lead.repliedAt)} · intent: <strong style={{ color: lead.replyIntent === 'positive' ? '#10b981' : lead.replyIntent === 'stop' ? '#ef4444' : 'var(--color-text-secondary)' }}>{lead.replyIntent || 'neutral'}</strong>
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Replies hit your Gmail (forwarded by ImprovMX). Mark them here so the weekly report counts them.
                </div>
              )}
            </div>
            {!lead.repliedAt && (
              <button
                className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
                disabled={!!busy}
                onClick={async () => {
                  const intentRaw = window.prompt(
                    'Reply intent? Type:\n  p = positive (interested)\n  n = neutral (asking questions)\n  x = negative (not interested)\n  s = stop (unsubscribe me)\n',
                    'p'
                  );
                  if (!intentRaw) return;
                  const map: Record<string, 'positive' | 'neutral' | 'negative' | 'stop'> = { p: 'positive', n: 'neutral', x: 'negative', s: 'stop' };
                  const intent = map[intentRaw.trim().toLowerCase()[0]] || 'neutral';
                  const replyText = window.prompt('Paste a snippet of their reply (optional, helps with audit):', '') || '';
                  setBusy('mark-reply');
                  try {
                    await api.markLeadReplied({ id: leadId, intent, replyText });
                    setToast({ msg: intent === 'stop' ? 'Marked as DNC + suppressed' : `Marked as replied (${intent})` });
                    refresh();
                  } catch (e: any) {
                    setToast({ msg: e?.message || 'Failed', error: true });
                  } finally {
                    setBusy(null);
                    setTimeout(() => setToast(null), 3000);
                  }
                }}
              >
                {busy === 'mark-reply' ? 'Saving…' : 'Mark replied'}
              </button>
            )}
          </div>
          {lead.replyText && (
            <div style={{ padding: '10px 12px', background: 'rgba(34, 211, 238, 0.06)', borderLeft: '3px solid #22d3ee', borderRadius: 6, fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {lead.replyText}
            </div>
          )}
        </div>
      )}

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
