'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { api, fmtRelative, fmtDateTime } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconBoard } from '../components/icons';

// ============================================================
// TYPES + CONSTANTS
// ============================================================

interface Ticket {
  id: string;
  title: string;
  spec: string;
  type: 'ops' | 'code';
  status: 'backlog' | 'todo' | 'in_progress' | 'pr' | 'done';
  priority: 'low' | 'medium' | 'high';
  role: string | null;
  autoRun: boolean;
  agentStatus: 'idle' | 'queued' | 'running' | 'succeeded' | 'failed';
  output: string;
  error: string | null;
  logs: { at: number; message: string }[];
  prUrl: string | null;
  linkedJobId: string | null;
  source: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  finishedAt?: number;
  claimedBy?: string;
  prMerged?: boolean;
  shipStatus?: string;
  buildRunUrl?: string;
  releaseNotes?: string;
}

interface Draft {
  title: string;
  spec: string;
  type: 'ops' | 'code';
  priority: string;
  role?: string | null;
}

interface Role {
  id: string;
  label: string;
  blurb: string;
}

const COLUMNS: { id: Ticket['status']; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'pr', label: 'PR / Review' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_COLOR: Record<string, string> = { low: '#94a3b8', medium: '#60a5fa', high: '#fca5a5' };
const AGENT_COLOR: Record<string, string> = {
  idle: '#94a3b8', queued: '#fcd34d', running: '#fb923c', succeeded: '#10b981', failed: '#fca5a5',
};
const TYPE_COLOR: Record<string, string> = { ops: '#a78bfa', code: '#22d3ee' };

// ============================================================
// PAGE
// ============================================================

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropCol, setDropCol] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

  const showToast = useCallback((msg: string, error?: boolean) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async (silent?: boolean) => {
    if (!silent) setLoading(true);
    try {
      const r: any = await api.listTickets({});
      setTickets(r.tickets || []);
    } catch (e: any) {
      if (!silent) showToast(e?.message || 'Failed to load tickets', true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // Team roster (drives the role pickers + card badges). Loaded once.
  useEffect(() => {
    api.listTicketRoles({}).then((r: any) => setRoles(r.roles || [])).catch(() => {});
  }, []);

  // Poll so worker progress (in_progress → done) shows live. Pause while a modal
  // is open to avoid disrupting editing.
  const modalOpen = createOpen || draftOpen || !!detailId;
  useEffect(() => {
    if (modalOpen) return;
    const t = setInterval(() => load(true), 20000);
    return () => clearInterval(t);
  }, [load, modalOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tickets;
    const q = search.toLowerCase();
    return tickets.filter((t) => t.title.toLowerCase().includes(q) || (t.spec || '').toLowerCase().includes(q));
  }, [tickets, search]);

  const byCol = useMemo(() => {
    const m: Record<string, Ticket[]> = { backlog: [], todo: [], in_progress: [], pr: [], done: [] };
    for (const t of filtered) (m[t.status] ||= []).push(t);
    return m;
  }, [filtered]);

  const roleLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of roles) map[r.id] = r.label;
    return (id: string | null | undefined) => (id ? map[id] || id : null);
  }, [roles]);

  useSetPageMeta({
    title: 'Tasks',
    breadcrumb: `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`,
    search: { value: search, onChange: setSearch, placeholder: 'Search tickets…' },
    actions: (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => setDraftOpen(true)}>✨ AI draft</button>
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => setCreateOpen(true)}>+ New ticket</button>
      </div>
    ),
  });

  const moveTicket = async (id: string, status: Ticket['status']) => {
    const t = tickets.find((x) => x.id === id);
    if (!t || t.status === status) return;
    setTickets((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x))); // optimistic
    try {
      await api.updateTicket({ id, patch: { status } });
    } catch (e: any) {
      showToast(e?.message || 'Move failed', true);
      load(true);
    }
  };

  const detailTicket = detailId ? tickets.find((t) => t.id === detailId) || null : null;

  return (
    <div>
      {loading ? (
        <div className={styles.centerLoader} style={{ minHeight: 300 }}><div className={styles.spinner} /></div>
      ) : tickets.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            <IconBoard className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>No tickets yet</div>
            <div className={styles.emptyText}>Create a ticket, or let AI draft a few from a goal.</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14 }}>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => setDraftOpen(true)}>✨ AI draft</button>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => setCreateOpen(true)}>+ New ticket</button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.kanban}>
          {COLUMNS.map((col) => (
            <div
              key={col.id}
              className={`${styles.kanbanCol} ${dropCol === col.id ? styles.kanbanColDrop : ''}`}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); setDropCol(col.id); } }}
              onDragLeave={() => setDropCol((c) => (c === col.id ? null : c))}
              onDrop={(e) => { e.preventDefault(); if (dragId) moveTicket(dragId, col.id); setDragId(null); setDropCol(null); }}
            >
              <div className={styles.kanbanColHead}>
                <span>{col.label}</span>
                <span className={styles.kanbanColCount}>{byCol[col.id]?.length || 0}</span>
              </div>
              <div className={styles.kanbanColBody}>
                {(byCol[col.id] || []).map((t) => (
                  <TicketCard
                    key={t.id}
                    ticket={t}
                    roleLabel={roleLabel(t.role)}
                    onClick={() => setDetailId(t.id)}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => { setDragId(null); setDropCol(null); }}
                  />
                ))}
                {(byCol[col.id] || []).length === 0 && <div className={styles.kanbanEmptyCol}>—</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateModal roles={roles} onClose={() => setCreateOpen(false)} onCreated={(msg) => { setCreateOpen(false); showToast(msg); load(true); }} />
      )}
      {draftOpen && (
        <DraftModal roles={roles} onClose={() => setDraftOpen(false)} onAdded={(msg) => { setDraftOpen(false); showToast(msg); load(true); }} />
      )}
      {detailTicket && (
        <DetailModal ticket={detailTicket} roles={roles} onClose={() => setDetailId(null)} onChange={() => load(true)} onToast={showToast} />
      )}

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

// ============================================================
// CARD + BADGES
// ============================================================

function MiniBadge({ label, color }: { label: string; color: string }) {
  return <span className={styles.miniBadge} style={{ background: `${color}22`, color }}>{label}</span>;
}

function PriorityTag({ priority }: { priority: string }) {
  const c = PRIORITY_COLOR[priority] || '#94a3b8';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: c, textTransform: 'uppercase', letterSpacing: 0.4 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />{priority}
    </span>
  );
}

function TicketCard({ ticket, roleLabel, onClick, onDragStart, onDragEnd }: {
  ticket: Ticket;
  roleLabel: string | null;
  onClick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const t = ticket;
  return (
    <div
      className={styles.ticketCard}
      draggable
      onClick={onClick}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
      onDragEnd={onDragEnd}
    >
      <div className={styles.ticketCardTitle}>{t.title}</div>
      <div className={styles.ticketBadgeRow}>
        <MiniBadge label={t.type} color={TYPE_COLOR[t.type] || '#94a3b8'} />
        {roleLabel && <MiniBadge label={roleLabel} color="#38bdf8" />}
        <PriorityTag priority={t.priority} />
        {t.agentStatus && t.agentStatus !== 'idle' && <MiniBadge label={t.agentStatus} color={AGENT_COLOR[t.agentStatus] || '#94a3b8'} />}
        {t.autoRun && t.type === 'ops' && <MiniBadge label="auto" color="#10b981" />}
      </div>
      <div className={styles.ticketMeta}>
        <span>{fmtRelative(t.updatedAt)}</span>
        {t.prUrl && <span style={{ color: '#22d3ee' }}>· PR</span>}
        {t.error && <span style={{ color: '#fca5a5' }}>· error</span>}
      </div>
    </div>
  );
}

// ============================================================
// SHARED MODAL PRIMITIVES
// ============================================================

function ModalShell({ title, onClose, children, maxWidth = 560 }: {
  title: string; onClose: () => void; children: ReactNode; maxWidth?: number;
}) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 100, padding: '40px 20px', overflowY: 'auto' }}
    >
      <div onClick={(e) => e.stopPropagation()} className={styles.card} style={{ maxWidth, width: '100%', padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>{title}</h3>
          <button onClick={onClose} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return <div style={{ marginTop: 12, padding: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: 8, fontSize: 13 }}>{msg}</div>;
}

// ============================================================
// CREATE MODAL
// ============================================================

function CreateModal({ roles, onClose, onCreated }: { roles: Role[]; onClose: () => void; onCreated: (msg: string) => void }) {
  const [title, setTitle] = useState('');
  const [spec, setSpec] = useState('');
  const [type, setType] = useState<'ops' | 'code'>('ops');
  const [priority, setPriority] = useState('medium');
  const [role, setRole] = useState('');
  const [autoRun, setAutoRun] = useState(false);
  const [status, setStatus] = useState<Ticket['status']>('backlog');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!title.trim()) { setError('Title required'); return; }
    setSaving(true);
    setError(null);
    try {
      await api.createTicket({ title: title.trim(), spec: spec.trim(), type, priority, role: role || undefined, autoRun: autoRun && type === 'ops', status });
      onCreated('Ticket created');
    } catch (e: any) {
      setError(e?.message || 'Create failed');
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New ticket" onClose={onClose}>
      <Field label="Title">
        <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short imperative summary" autoFocus />
      </Field>
      <Field label="Spec / instructions" hint="The full task the agent will act on, with any acceptance criteria.">
        <textarea className={styles.textarea} value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="What needs doing…" style={{ minHeight: 140 }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Type">
          <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as 'ops' | 'code')}>
            <option value="ops">Ops — AI runs it</option>
            <option value="code">Code — agent runs it</option>
          </select>
        </Field>
        <Field label="Priority">
          <select className={styles.select} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>
      <Field label="Assign to" hint="Which specialist persona runs this ticket.">
        <select className={styles.select} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Unassigned (generic operator)</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        <Field label="Start in column">
          <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value as Ticket['status'])}>
            {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', marginTop: 24, background: 'var(--color-surface-2, #0f172a)', borderRadius: 10, cursor: type === 'ops' ? 'pointer' : 'not-allowed', opacity: type === 'ops' ? 1 : 0.5 }}>
          <input type="checkbox" checked={autoRun} disabled={type !== 'ops'} onChange={(e) => setAutoRun(e.target.checked)} />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Auto-run in To Do</span>
        </label>
      </div>
      {error && <ErrBox msg={error} />}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClose} disabled={saving}>Cancel</button>
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={save} disabled={saving}>{saving ? 'Creating…' : 'Create'}</button>
      </div>
    </ModalShell>
  );
}

// ============================================================
// AI DRAFT MODAL
// ============================================================

function DraftModal({ roles, onClose, onAdded }: { roles: Role[]; onClose: () => void; onAdded: (msg: string) => void }) {
  const [goal, setGoal] = useState('');
  const [count, setCount] = useState(4);
  const [type, setType] = useState<'ops' | 'code'>('ops');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);

  const generate = async () => {
    if (!goal.trim()) { setError('Describe a goal'); return; }
    setLoading(true);
    setError(null);
    setDrafts(null);
    try {
      const r: any = await api.draftTickets({ goal: goal.trim(), count, type });
      const ds: Draft[] = r.drafts || [];
      if (!ds.length) { setError('AI returned no tickets — try rephrasing the goal.'); setLoading(false); return; }
      setDrafts(ds);
      setPicked(new Set(ds.map((_, i) => i)));
    } catch (e: any) {
      setError(e?.message || 'AI draft failed');
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    if (!drafts) return;
    const chosen = drafts.filter((_, i) => picked.has(i));
    if (!chosen.length) { setError('Pick at least one'); return; }
    setAdding(true);
    setError(null);
    try {
      for (const d of chosen) {
        await api.createTicket({ title: d.title, spec: d.spec, type: d.type, priority: d.priority, role: d.role || undefined, source: 'ai-draft', status: 'backlog' });
      }
      onAdded(`Added ${chosen.length} ticket${chosen.length === 1 ? '' : 's'} to Backlog`);
    } catch (e: any) {
      setError(e?.message || 'Add failed');
      setAdding(false);
    }
  };

  const togglePick = (i: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(i)) n.delete(i); else n.add(i);
    return n;
  });

  return (
    <ModalShell title="AI — draft tasks from a goal" onClose={onClose} maxWidth={620}>
      {!drafts ? (
        <>
          <Field label="Goal" hint="Describe what you want done; AI breaks it into self-contained tickets.">
            <textarea className={styles.textarea} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Audit my onboarding emails and propose 3 improvements" style={{ minHeight: 120 }} autoFocus />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="How many (max 12)">
              <input type="number" className={styles.input} value={count} min={1} max={12} onChange={(e) => setCount(Math.min(12, Math.max(1, Number(e.target.value) || 1)))} />
            </Field>
            <Field label="Default type">
              <select className={styles.select} value={type} onChange={(e) => setType(e.target.value as 'ops' | 'code')}>
                <option value="ops">Ops</option>
                <option value="code">Code</option>
              </select>
            </Field>
          </div>
          {error && <ErrBox msg={error} />}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClose} disabled={loading}>Cancel</button>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={generate} disabled={loading}>{loading ? 'Drafting…' : '✨ Generate'}</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            {drafts.length} draft{drafts.length === 1 ? '' : 's'} — pick the ones to add to Backlog.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {drafts.map((d, i) => (
              <label key={i} style={{ display: 'flex', gap: 10, padding: 12, background: 'var(--color-surface-2, #0f172a)', border: `1px solid ${picked.has(i) ? 'rgba(249, 115, 22, 0.4)' : 'var(--color-border, #334155)'}`, borderRadius: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={picked.has(i)} onChange={() => togglePick(i)} style={{ marginTop: 3 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{d.title}</span>
                  <MiniBadge label={d.type} color={TYPE_COLOR[d.type] || '#94a3b8'} />
                  {d.role && <MiniBadge label={roles.find((r) => r.id === d.role)?.label || d.role} color="#38bdf8" />}
                  <PriorityTag priority={d.priority} />
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{d.spec}</div>
              </div>
              </label>
            ))}
          </div>
          {error && <ErrBox msg={error} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => { setDrafts(null); setError(null); }} disabled={adding}>← Back</button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClose} disabled={adding}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={add} disabled={adding || picked.size === 0}>{adding ? 'Adding…' : `Add ${picked.size} to board`}</button>
            </div>
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ============================================================
// DETAIL / EDIT MODAL
// ============================================================

function DetailModal({ ticket, roles, onClose, onChange, onToast }: {
  ticket: Ticket;
  roles: Role[];
  onClose: () => void;
  onChange: () => void;
  onToast: (msg: string, error?: boolean) => void;
}) {
  const [title, setTitle] = useState(ticket.title);
  const [spec, setSpec] = useState(ticket.spec);
  const [type, setType] = useState<'ops' | 'code'>(ticket.type);
  const [priority, setPriority] = useState(ticket.priority);
  const [autoRun, setAutoRun] = useState(ticket.autoRun);
  const [role, setRole] = useState(ticket.role || '');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // When the parent refreshes this ticket (e.g. a run finished), pull the new
  // values in — but never clobber unsaved edits.
  useEffect(() => {
    if (dirty) return;
    setTitle(ticket.title);
    setSpec(ticket.spec);
    setType(ticket.type);
    setPriority(ticket.priority);
    setAutoRun(ticket.autoRun);
    setRole(ticket.role || '');
  }, [ticket, dirty]);

  const running = ticket.agentStatus === 'running';

  const save = async () => {
    setBusy('save');
    try {
      await api.updateTicket({ id: ticket.id, patch: { title, spec, type, priority, role: role || null, autoRun: autoRun && type === 'ops' } });
      setDirty(false);
      onToast('Saved');
      onChange();
    } catch (e: any) {
      onToast(e?.message || 'Save failed', true);
    } finally {
      setBusy(null);
    }
  };

  const move = async (status: Ticket['status']) => {
    try {
      await api.updateTicket({ id: ticket.id, patch: { status } });
      onChange();
    } catch (e: any) {
      onToast(e?.message || 'Move failed', true);
    }
  };

  const run = async () => {
    if (ticket.type === 'code' && (ticket.status === 'in_progress' || ticket.status === 'pr')) {
      if (!window.confirm('Re-run the agent on this ticket? It dispatches a fresh run on the same GitHub issue.')) return;
    }
    setBusy('run');
    try {
      const r: any = await api.runTicket({ id: ticket.id });
      if (ticket.type === 'code') onToast(r?.started ? 'Agent dispatched ✓' : 'Queued (agent not started — check the GitHub token)', !r?.started);
      else if (r?.ok) onToast('Ran ✓');
      else onToast(r?.error || 'Run failed', true);
      onChange();
    } catch (e: any) {
      onToast(e?.message || 'Run failed', true);
    } finally {
      setBusy(null);
    }
  };

  const del = async () => {
    if (!window.confirm('Delete this ticket? This cannot be undone.')) return;
    setBusy('delete');
    try {
      await api.deleteTicket({ id: ticket.id });
      onToast('Deleted');
      onClose();
      onChange();
    } catch (e: any) {
      onToast(e?.message || 'Delete failed', true);
      setBusy(null);
    }
  };

  const runLabel = ticket.type === 'code'
    ? (['in_progress', 'pr', 'done'].includes(ticket.status) ? 'Re-run agent ▸' : 'Run agent now ▸')
    : 'Run now';

  // Ship-console actions (PR lane): confirm, call the backend, refresh the card.
  const shipAction = async (key: string, confirmMsg: string, fn: () => Promise<any>, okMsg: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusy(key);
    try {
      const r: any = await fn();
      onToast(r?.runsUrl ? `${okMsg} — see Actions ↗` : okMsg);
      onChange();
    } catch (e: any) {
      onToast(e?.message || `${key} failed`, true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ModalShell title="Ticket" onClose={onClose} maxWidth={680}>
      {/* Title + badges */}
      <input
        className={styles.input}
        value={title}
        onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
        style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16 }}>
        <MiniBadge label={type} color={TYPE_COLOR[type] || '#94a3b8'} />
        {ticket.agentStatus !== 'idle' && <MiniBadge label={ticket.agentStatus} color={AGENT_COLOR[ticket.agentStatus] || '#94a3b8'} />}
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Column</span>
        <select className={styles.select} value={ticket.status} onChange={(e) => move(e.target.value as Ticket['status'])} style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}>
          {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {/* Spec */}
      <Field label="Spec / instructions">
        <textarea
          className={styles.textarea}
          value={spec}
          onChange={(e) => { setSpec(e.target.value); setDirty(true); }}
          style={{ minHeight: 120 }}
        />
      </Field>

      {/* Meta controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Type">
          <select className={styles.select} value={type} onChange={(e) => { setType(e.target.value as 'ops' | 'code'); setDirty(true); }}>
            <option value="ops">Ops — AI runs it</option>
            <option value="code">Code — agent runs it</option>
          </select>
        </Field>
        <Field label="Priority">
          <select className={styles.select} value={priority} onChange={(e) => { setPriority(e.target.value as Ticket['priority']); setDirty(true); }}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>
      <Field label="Assign to">
        <select className={styles.select} value={role} onChange={(e) => { setRole(e.target.value); setDirty(true); }}>
          <option value="">Unassigned (generic operator)</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
      </Field>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--color-surface-2, #0f172a)', borderRadius: 10, cursor: type === 'ops' ? 'pointer' : 'not-allowed', opacity: type === 'ops' ? 1 : 0.5, marginBottom: 16 }}>
        <input type="checkbox" checked={autoRun} disabled={type !== 'ops'} onChange={(e) => { setAutoRun(e.target.checked); setDirty(true); }} />
        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Auto-run by the worker when this ticket is in To Do</span>
      </label>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={run} disabled={!!busy || (running && ticket.type !== 'code')}>
          {busy === 'run' ? 'Working…' : (running && ticket.type !== 'code') ? 'Running…' : runLabel}
        </button>
        {dirty && (
          <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={save} disabled={!!busy}>
            {busy === 'save' ? 'Saving…' : 'Save changes'}
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} onClick={del} disabled={!!busy}>Delete</button>
      </div>

      {/* Error */}
      {ticket.error && (
        <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #fca5a5', borderRadius: 6, fontSize: 12.5, color: '#fca5a5', marginBottom: 14, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
          {ticket.error}
        </div>
      )}

      {/* Ship console (PR / review lane) */}
      {ticket.prUrl && (
        <div style={{ marginBottom: 16, padding: 14, background: 'var(--color-surface-2, #0f172a)', border: '1px solid var(--color-border, #334155)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)' }}>Ship</span>
            {ticket.shipStatus && <MiniBadge label={ticket.shipStatus} color="#38bdf8" />}
            {ticket.prMerged && <MiniBadge label="merged" color="#10b981" />}
            <span style={{ flex: 1 }} />
            <a href={ticket.prUrl} target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>View PR ↗</a>
            {ticket.buildRunUrl && <a href={ticket.buildRunUrl} target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>Actions ↗</a>}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={!!busy || ticket.prMerged}
              onClick={() => shipAction('merge', 'Merge this PR into main (squash)?', () => api.mergeTicketPR({ id: ticket.id }), 'Merged ✓')}>
              {busy === 'merge' ? 'Merging…' : ticket.prMerged ? 'Merged ✓' : 'Merge PR'}
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy}
              onClick={() => shipAction('build', 'Start a full EAS build for Android + iOS? This uses build credits.', () => api.dispatchEas({ id: ticket.id, action: 'build', platform: 'all' }), 'Build dispatched')}>
              {busy === 'build' ? 'Dispatching…' : 'Rebuild (native)'}
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy}
              onClick={() => shipAction('submit', 'Submit the latest build to the App Store + Play Store? iOS goes to Apple review.', () => api.dispatchEas({ id: ticket.id, action: 'submit', platform: 'all' }), 'Submit dispatched')}>
              {busy === 'submit' ? 'Dispatching…' : 'Redeploy (submit)'}
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy}
              onClick={() => shipAction('update', 'Push an OTA update now? JS-only changes ship instantly; native changes need a full rebuild.', () => api.dispatchEas({ id: ticket.id, action: 'update', message: ticket.releaseNotes || ticket.title }), 'OTA update dispatched')}>
              {busy === 'update' ? 'Dispatching…' : 'Push OTA'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)' }}>What&apos;s new (for users)</span>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} disabled={!!busy}
              onClick={() => shipAction('notes', '', () => api.generateReleaseNotes({ id: ticket.id }), 'Release notes written')}>
              {busy === 'notes' ? 'Writing…' : '✨ Generate'}
            </button>
          </div>
          {ticket.releaseNotes ? (
            <div style={{ fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10 }}>{ticket.releaseNotes}</div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>No release notes yet — Generate, then they auto-fill the OTA message.</div>
          )}
        </div>
      )}

      {/* Output */}
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Result</div>
      {ticket.output ? (
        <div style={{ padding: 14, background: 'var(--color-surface-2, #0f172a)', border: '1px solid var(--color-border, #334155)', borderRadius: 10, fontSize: 13, color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: 360, overflowY: 'auto' }}>
          {ticket.output}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
          {ticket.type === 'code'
            ? 'No result yet. Queue this for the code agent, or move it to To Do.'
            : 'No result yet. Hit Run now, or flag it auto-run and move it to To Do.'}
        </div>
      )}

      {/* Logs */}
      {Array.isArray(ticket.logs) && ticket.logs.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Activity</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ticket.logs.map((l, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <span style={{ color: 'var(--color-text-tertiary)', marginRight: 8 }}>{fmtDateTime(l.at)}</span>{l.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer meta */}
      <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid var(--color-border, #334155)', fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>Created {fmtRelative(ticket.createdAt)}</span>
        <span>Updated {fmtRelative(ticket.updatedAt)}</span>
        {ticket.finishedAt ? <span>Finished {fmtRelative(ticket.finishedAt)}</span> : null}
        {ticket.source === 'ai-draft' ? <span>AI-drafted</span> : null}
      </div>
    </ModalShell>
  );
}
