'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { api, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconChat, IconExternal } from '../components/icons';

interface ConversationRow {
  id: string;
  uid: string;
  userEmail: string | null;
  userBusinessName: string | null;
  platform: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  syncedAt: number | null;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  proposalCount: number;
  appliedCount: number;
  dismissedCount: number;
  failedCount: number;
  errorCount: number;
  proposalTypes: string[];
  preview: string | null;
  lastText: string | null;
}

interface ListTotals {
  all: number;
  messages: number;
  proposals: number;
  applied: number;
  failed: number;
  withProposals: number;
  withErrors: number;
}

type ChipId = '' | 'proposals' | 'applied' | 'errored';
const FILTER_CHIPS: Array<{ id: ChipId; label: string; totalsKey?: keyof ListTotals }> = [
  { id: '', label: 'All', totalsKey: 'all' },
  { id: 'proposals', label: 'With proposals', totalsKey: 'withProposals' },
  { id: 'applied', label: 'Applied', totalsKey: 'applied' },
  { id: 'errored', label: '⚠ Errored', totalsKey: 'withErrors' },
];

const PROPOSAL_LABELS: Record<string, string> = {
  propose_draft_quote: 'Draft quote',
  propose_add_line_item: 'Add item',
  propose_delete_line_item: 'Remove item',
  propose_create_contact: 'New contact',
  propose_send_quote: 'Send quote',
  propose_convert_to_invoice: 'Convert to invoice',
  propose_reprice: 'Re-price',
};

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <ConversationsPageInner />
    </Suspense>
  );
}

function ConversationsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uidParam = searchParams?.get('uid') || '';
  const filterParam = (searchParams?.get('filter') || '') as ChipId;

  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [totals, setTotals] = useState<Partial<ListTotals>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ConversationRow | null>(null);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 1000 };
    if (uidParam) params.userId = uidParam;
    api.listAssistantConversations(params)
      .then((r: any) => {
        if (cancelled) return;
        setRows(r?.conversations || []);
        setTotals(r?.totals || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error('[admin/conversations] list failed', err);
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [uidParam]);

  const updateParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams?.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`/admin/conversations${p.toString() ? `?${p.toString()}` : ''}`, { scroll: false });
  };

  const filtered = useMemo(() => {
    let list = rows;
    if (filterParam === 'proposals') list = list.filter((r) => r.proposalCount > 0);
    if (filterParam === 'applied') list = list.filter((r) => r.appliedCount > 0);
    if (filterParam === 'errored') list = list.filter((r) => r.errorCount > 0 || r.failedCount > 0);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      [r.preview, r.lastText, r.userBusinessName, r.userEmail, r.proposalTypes.join(' ')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search, filterParam]);

  const breadcrumb = uidParam
    ? `${rows.length} conversation${rows.length === 1 ? '' : 's'} for ${rows[0]?.userBusinessName || rows[0]?.userEmail || uidParam}`
    : `${rows.length} recent · ${totals.proposals || 0} proposals · ${totals.applied || 0} applied · ${totals.withErrors || 0} with errors`;

  useSetPageMeta({
    title: uidParam ? 'Conversations · single tradie' : 'Conversations',
    breadcrumb,
    search: { value: search, onChange: setSearch, placeholder: 'Message text, tradie, proposal type…' },
    actions: uidParam ? (
      <Link href="/admin/conversations" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
        Clear tradie filter
      </Link>
    ) : undefined,
  });

  const openRow = async (r: ConversationRow) => {
    setSelected(r);
    setDetail(null);
    try {
      const res: any = await api.getAssistantConversation({ uid: r.uid, id: r.id });
      setDetail(res);
    } catch {
      setDetail({ error: true });
    }
  };

  return (
    <>
      <div className={styles.statGrid}>
        <StatTile label="Conversations" value={(totals.all || 0).toLocaleString()} sub={`${totals.messages || 0} messages`} />
        <StatTile label="Proposals" value={(totals.proposals || 0).toLocaleString()} sub={`${totals.withProposals || 0} chats proposed something`} accent />
        <StatTile label="Applied" value={(totals.applied || 0).toLocaleString()} sub={`${applyRate(totals)}% of proposals`} />
        <StatTile label="With errors" value={(totals.withErrors || 0).toLocaleString()} sub={`${totals.failed || 0} failed applies`} warn={!!totals.withErrors} />
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Mate conversations</div>
            <div className={styles.cardSubtitle}>
              {loading ? 'Loading…' : `${filtered.length} of ${rows.length} shown`}
            </div>
          </div>
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          {FILTER_CHIPS.map((c) => {
            const on = filterParam === c.id;
            const count = c.totalsKey ? (totals as any)[c.totalsKey] : undefined;
            const isWarn = c.id === 'errored';
            return (
              <button
                key={c.id || 'all'}
                className={styles.chip}
                onClick={() => updateParam('filter', c.id || null)}
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
                <th>Conversation</th>
                <th>Tradie</th>
                <th style={{ textAlign: 'center' }}>Messages</th>
                <th>Proposals</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className={styles.empty}>
                    <IconChat className={styles.emptyIcon} />
                    <div className={styles.emptyTitle}>No conversations match</div>
                    <div className={styles.emptyText}>Try a different filter, or check back once tradies chat with Mate.</div>
                  </div>
                </td></tr>
              ) : filtered.map((r) => (
                <tr key={`${r.uid}-${r.id}`} onClick={() => openRow(r)}>
                  <td>
                    <div className={styles.rowPrimary} style={truncStyle}>
                      {r.preview || <span style={{ opacity: 0.5 }}>no text yet</span>}
                    </div>
                    <div className={styles.rowSecondary} style={truncStyle}>
                      {r.lastText && r.lastText !== r.preview ? `↳ ${r.lastText}` : ''}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/users?uid=${encodeURIComponent(r.uid)}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'inherit', textDecoration: 'none' }}
                    >
                      <div className={styles.listAvatar} style={{ width: 24, height: 24, fontSize: 10 }}>
                        {initials(r.userBusinessName || r.userEmail)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, ...truncStyle, maxWidth: 160 }}>
                          {r.userBusinessName || r.userEmail?.split('@')[0] || r.uid.slice(0, 8)}
                        </div>
                        {r.platform && <div style={{ fontSize: 10, opacity: 0.5 }}>{r.platform}</div>}
                      </div>
                    </Link>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span title={`${r.userMessages} from tradie · ${r.assistantMessages} from Mate`}>
                      {r.messageCount}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {r.proposalCount === 0 ? (
                        <span style={{ opacity: 0.4 }}>—</span>
                      ) : (
                        <>
                          <span className={styles.tag} style={{ fontSize: 11 }}>{r.proposalCount} proposed</span>
                          {r.appliedCount > 0 && <CountPill label={`${r.appliedCount} applied`} color="#6ee7b7" rgb="16, 185, 129" />}
                          {r.failedCount > 0 && <CountPill label={`${r.failedCount} failed`} color="#fca5a5" rgb="239, 68, 68" />}
                        </>
                      )}
                      {r.errorCount > 0 && <CountPill label={`${r.errorCount} error${r.errorCount === 1 ? '' : 's'}`} color="#fcd34d" rgb="245, 158, 11" />}
                    </div>
                  </td>
                  <td>{fmtRelative(r.updatedAt || r.createdAt)}</td>
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
        <ConversationModal
          row={selected}
          detail={detail}
          onClose={() => { setSelected(null); setDetail(null); }}
        />
      )}
    </>
  );
}

const truncStyle = { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, maxWidth: 380 };
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

function applyRate(totals: Partial<ListTotals>): number {
  if (!totals.proposals) return 0;
  return Math.round(((totals.applied || 0) / totals.proposals) * 100);
}

function CountPill({ label, color, rgb }: { label: string; color: string; rgb: string }) {
  return (
    <span style={{
      fontSize: 10,
      color,
      background: `rgba(${rgb}, 0.12)`,
      border: `1px solid rgba(${rgb}, 0.3)`,
      borderRadius: 999,
      padding: '1px 6px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
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

function ConversationModal({
  row,
  detail,
  onClose,
}: {
  row: ConversationRow;
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
  const convo = detail?.conversation;
  const messages: any[] = convo?.messages || [];

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
          width: '100%', maxWidth: 760, maxHeight: '90vh',
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
            <IconChat style={{ width: 22, height: 22 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {detail?.userBusinessName || detail?.userEmail || row.userBusinessName || row.userEmail || 'Conversation'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>{row.messageCount} messages</span>
              {row.proposalCount > 0 && <span>{row.proposalCount} proposed · {row.appliedCount} applied{row.failedCount > 0 ? ` · ${row.failedCount} failed` : ''}</span>}
              {row.platform && <span>{row.platform}</span>}
              <span>Updated {fmtRelative(row.updatedAt)}</span>
              <Link
                href={`/admin/users?uid=${encodeURIComponent(row.uid)}`}
                style={{ color: 'var(--color-accent-light)' }}
              >
                Open tradie →
              </Link>
              <Link
                href={`/admin/documents?uid=${encodeURIComponent(row.uid)}`}
                style={{ color: 'var(--color-accent-light)' }}
              >
                Their docs →
              </Link>
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
              <div className={styles.cardTitle}>Couldn't load conversation</div>
              <div className={styles.cardSubtitle}>Deleted or permissions changed.</div>
            </div>
          )}
          {convo && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.length === 0 && (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>No messages in this conversation.</div>
              )}
              {messages.map((m, i) => (
                <MessageBubble key={m.id || i} m={m} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: any }) {
  const isUser = m.role === 'user';
  const proposals: any[] = Array.isArray(m.proposals) ? m.proposals : [];
  const status: Record<string, string> = m.proposalStatus || {};
  const hasText = typeof m.text === 'string' && m.text.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
          color: isUser ? '#93c5fd' : 'var(--color-accent-light)',
        }}>
          {isUser ? 'Tradie' : 'Mate'}
        </span>
        {m.createdAt && <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', opacity: 0.7 }}>{fmtDateTime(m.createdAt)}</span>}
      </div>

      {hasText && (
        <div style={{
          maxWidth: '85%',
          background: isUser ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isUser ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12,
          padding: '8px 12px',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--color-text-primary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {m.text}
        </div>
      )}

      {m.working && !hasText && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
          ⏳ {m.working.status || 'working…'}{m.working.summary ? ` — ${m.working.summary}` : ''}
        </div>
      )}

      {m.errorMessage && (
        <div style={{
          maxWidth: '85%', marginTop: hasText ? 6 : 0,
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 12, padding: '8px 12px', fontSize: 12.5, color: '#fca5a5',
        }}>
          ⚠ {m.errorMessage}
        </div>
      )}

      {proposals.map((p) => (
        <ProposalCard key={p.id} p={p} status={status[p.id]} />
      ))}

      {m.inlineQuoteId && (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          📄 inline quote <code>{m.inlineQuoteId}</code>
        </div>
      )}
    </div>
  );
}

function ProposalCard({ p, status }: { p: any; status?: string }) {
  const label = PROPOSAL_LABELS[p?.type] || p?.type || 'Proposal';
  const s = statusStyle(status);
  return (
    <div style={{
      maxWidth: '85%', marginTop: 6,
      background: 'rgba(249, 115, 22, 0.06)', border: '1px solid rgba(249, 115, 22, 0.22)',
      borderRadius: 12, padding: '8px 12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent-light)' }}>{label}</span>
        <span style={{
          fontSize: 10, fontWeight: 600, color: s.color,
          background: `rgba(${s.rgb}, 0.14)`, border: `1px solid rgba(${s.rgb}, 0.3)`,
          borderRadius: 999, padding: '0 6px',
        }}>
          {status || 'pending'}
        </span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--color-text-tertiary)' }}>{proposalSummary(p)}</div>
    </div>
  );
}

function statusStyle(status?: string): { color: string; rgb: string } {
  switch (status) {
    case 'applied': return { color: '#6ee7b7', rgb: '16, 185, 129' };
    case 'failed': return { color: '#fca5a5', rgb: '239, 68, 68' };
    case 'dismissed': return { color: '#94a3b8', rgb: '100, 116, 139' };
    default: return { color: '#fcd34d', rgb: '245, 158, 11' };
  }
}

function proposalSummary(p: any): string {
  switch (p?.type) {
    case 'propose_draft_quote': {
      const who = p.customerDraft?.name ? ` for ${p.customerDraft.name}` : '';
      return `${p.jobName || 'New quote'}${who}`;
    }
    case 'propose_add_line_item':
      return [p.qty, p.unit, '×', p.searchTerm].filter((x) => x !== undefined && x !== null && x !== '').join(' ');
    case 'propose_delete_line_item':
      return `Remove ${p.displayName || p.materialId || 'line item'}`;
    case 'propose_create_contact':
      return [p.name, p.phone, p.email].filter(Boolean).join(' · ') || 'contact';
    case 'propose_send_quote':
      return `Send quote ${p.quoteId || ''}${p.recipientEmail ? ` → ${p.recipientEmail}` : ''}`;
    case 'propose_convert_to_invoice':
      return `Convert quote ${p.quoteId || ''} → invoice`;
    case 'propose_reprice':
      return `Re-price ${p.displayName || p.quoteId || 'quote'}`;
    default:
      try { return JSON.stringify(p); } catch { return p?.type || 'proposal'; }
  }
}
