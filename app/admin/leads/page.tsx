'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconUsers, IconSend, IconEmail, IconPhone, IconExternal, IconNote } from '../components/icons';

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

const STATUSES: Array<{ id: string; label: string }> = [
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <LeadsPageInner />
    </Suspense>
  );
}

function LeadsPageInner() {
  const searchParams = useSearchParams();
  const detailId = searchParams?.get('id') || null;
  if (detailId) {
    return <LeadDetail leadId={detailId} />;
  }
  return <LeadsList />;
}

// ============================================================
// LIST VIEW
// ============================================================

function LeadsList() {
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

  const ids = Array.from(selected);

  const runResearch = async () => {
    if (!ids.length) return;
    setBusy('research');
    try {
      const r: any = await api.enrichLeads({ leadIds: ids });
      setToast({ msg: `Enriched ${r.enriched}, failed ${r.failed}, skipped ${r.skipped}` });
      clearSelection();
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Research failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const runGenerate = async () => {
    if (!ids.length) return;
    setBusy('generate');
    try {
      const r: any = await api.generateLeadMessages({ leadIds: ids });
      setToast({ msg: `Generated ${r.generated}, failed ${r.failed}, skipped ${r.skipped}` });
      clearSelection();
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Generation failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const runApprove = async () => {
    if (!ids.length) return;
    const sample = filtered
      .filter((l) => ids.includes(l.id))
      .slice(0, 3)
      .map((l) => `• ${l.businessName} → ${l.generatedSubject || '(no subject)'}`).join('\n');
    const ok = window.confirm(`Send ${ids.length} cold email(s)?\n\nFirst few:\n${sample}\n\nThis can't be undone.`);
    if (!ok) return;
    setBusy('approve');
    try {
      const r: any = await api.approveLeads({ leadIds: ids });
      setToast({ msg: `Sent ${r.sent}, skipped ${r.skipped}, failed ${r.failed}`, error: r.failed > 0 });
      clearSelection();
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Send failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const runReject = async () => {
    if (!ids.length) return;
    const reason = window.prompt('Rejection reason?', 'manual');
    if (!reason) return;
    const dnc = window.confirm('Add to DNC list (suppress this address forever)?');
    setBusy('reject');
    try {
      const r: any = await api.rejectLeads({ leadIds: ids, reason, dnc });
      setToast({ msg: `Rejected ${r.rejected}` });
      clearSelection();
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Reject failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  return (
    <>
      <div className={styles.statGrid} style={{ marginBottom: 20 }}>
        {['new', 'researched', 'queued', 'sent', 'engaged', 'replied', 'converted'].map((s) => (
          <div key={s} className={styles.statCard}>
            <div className={styles.statLabel}>{s}</div>
            <div className={styles.statValue}>{summary[s] || 0}</div>
          </div>
        ))}
      </div>

      <div className={styles.card} style={{ marginBottom: 16 }}>
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
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
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
          {selected.size > 0 ? (
            <>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>{selected.size} selected</span>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={clearSelection}>Clear</button>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={runResearch}>Research</button>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={runGenerate}>Generate</button>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={!!busy} onClick={runApprove}>
                <IconSend style={{ width: 12, height: 12 }} /> Approve & send
              </button>
              <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} disabled={!!busy} onClick={runReject}>Reject</button>
            </>
          ) : (
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={selectAll} disabled={!filtered.length}>Select all</button>
          )}
        </div>
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
        <div className={styles.tableWrap}>
          {filtered.map((l) => {
            const isSel = selected.has(l.id);
            const lastTouchMs = l.engagedAt || l.sentAt || l.queuedAt || l.enrichedAt || l.scrapedAt;
            return (
              <div
                key={l.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr 120px 120px 110px 1fr 100px',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--color-border)',
                  background: isSel ? 'rgba(249, 115, 22, 0.06)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(l.id)}
                  aria-label="select"
                />
                <div>
                  <Link href={`/admin/leads?id=${l.id}`} style={{ color: 'var(--color-text-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    {l.businessName || '(unnamed)'}
                  </Link>
                  <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 2 }}>
                    {l.ownerName ? `${l.ownerName} · ` : ''}
                    {l.suburb || '—'} {l.state ? `, ${l.state}` : ''}
                    {l.googleRating ? ` · ★ ${l.googleRating} (${l.googleReviewCount || 0})` : ''}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{l.trade || '—'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {l.email && <span title={l.email} style={{ display: 'inline-flex' }}><IconEmail style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
                  {(l.mobile || l.phone) && <span title={l.mobile || l.phone || ''} style={{ display: 'inline-flex' }}><IconPhone style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
                  {l.websiteUrl && <span title={l.websiteUrl} style={{ display: 'inline-flex' }}><IconExternal style={{ width: 14, height: 14, opacity: 0.6 }} /></span>}
                </div>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: 12,
                      background: `${STATUS_COLORS[l.status] || '#94a3b8'}22`,
                      color: STATUS_COLORS[l.status] || '#94a3b8',
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {l.status}
                  </span>
                </div>
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={l.generatedSubject || l.enrichmentSummary || ''}
                >
                  {l.generatedSubject || (
                    <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                      {l.enrichmentSummary ? l.enrichmentSummary.slice(0, 80) : '—'}
                    </span>
                  )}
                </div>
                <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, textAlign: 'right' }}>
                  {fmtRelative(lastTouchMs)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </>
  );
}

// ============================================================
// DETAIL VIEW
// ============================================================

interface Hook {
  text: string;
  source?: string;
}

function LeadDetail({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

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

  useSetPageMeta({
    title: data?.lead?.businessName || 'Lead',
    breadcrumb: data?.lead?.suburb ? `${data.lead.trade} · ${data.lead.suburb}` : '',
    actions: (
      <Link href="/admin/leads" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>← All leads</Link>
    ),
  });

  if (loading) {
    return <div className={styles.centerLoader}><div className={styles.spinner} /></div>;
  }
  if (!data) {
    return (
      <div className={styles.card}>
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Lead not found</div>
          <Link href="/admin/leads" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} style={{ marginTop: 12 }}>← Back</Link>
        </div>
      </div>
    );
  }

  const lead = data.lead;
  const hooks: Hook[] = lead.personalizationHooks || [];

  const enrich = async () => {
    setBusy('research');
    try {
      const r: any = await api.enrichLeads({ leadIds: [leadId] });
      setToast({ msg: `Enriched: ${r.enriched}, failed: ${r.failed}` });
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Enrich failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const generate = async () => {
    setBusy('generate');
    try {
      const r: any = await api.generateLeadMessages({ leadIds: [leadId] });
      setToast({ msg: r.generated ? 'Generated' : 'Failed', error: !r.generated });
      setRefreshTick((n) => n + 1);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Generate failed', error: true });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const saveMessage = async () => {
    if (!subject.trim() || !body.trim()) return;
    setBusy('save');
    try {
      await api.updateLeadMessage({ id: leadId, subject: subject.trim(), body: body.trim() });
      setToast({ msg: 'Saved' });
      setDirty(false);
      setRefreshTick((n) => n + 1);
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
      if (r.sent) setToast({ msg: 'Sent' });
      else setToast({ msg: r.issues?.[0]?.reason || 'Not sent', error: true });
      setRefreshTick((n) => n + 1);
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
      setRefreshTick((n) => n + 1);
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
      setRefreshTick((n) => n + 1);
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>{lead.businessName}</div>
              <div className={styles.cardSubtitle}>
                {lead.trade} · {lead.suburb}{lead.state ? `, ${lead.state}` : ''}
                {lead.googleRating ? ` · ★ ${lead.googleRating} (${lead.googleReviewCount || 0})` : ''}
              </div>
            </div>
            <div>
              <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 12,
                background: 'rgba(249, 115, 22, 0.15)',
                color: 'var(--color-accent-light)',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>{lead.status}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
            <Fact label="Owner" value={lead.ownerName || '—'} />
            <Fact label="Email" value={lead.email || '—'} />
            <Fact label="Mobile" value={lead.mobile || lead.phone || '—'} />
            <Fact label="Website" value={lead.websiteUrl ? (
              <a href={lead.websiteUrl} target="_blank" rel="noopener" style={{ color: 'var(--color-accent-light)' }}>{websiteHost}</a>
            ) : '—'} />
            <Fact label="Source" value={lead.source} />
            <Fact label="Confidence" value={lead.enrichmentConfidence || '—'} />
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Research</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy} onClick={enrich}>
                {lead.enrichmentSummary ? 'Re-research' : 'Research'}
              </button>
            </div>
          </div>
          {lead.enrichmentSummary ? (
            <>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 14 }}>{lead.enrichmentSummary}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Hooks</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
                {hooks.map((h, i) => (
                  <li key={i}>
                    {h.text}
                    {h.source && <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 6, fontSize: 11 }}>({h.source})</span>}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No research yet. Click Research to scrape the website and extract hooks.
              {lead.enrichmentFailureReason && <div style={{ color: '#fcd34d', marginTop: 6 }}>Last attempt: {lead.enrichmentFailureReason}</div>}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Message</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} disabled={!!busy || !lead.enrichmentSummary} onClick={generate}>
                {lead.generatedSubject ? 'Re-generate' : 'Generate'}
              </button>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} disabled={!dirty || !!busy} onClick={saveMessage}>Save</button>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} disabled={!!busy || !lead.email || !subject || !body} onClick={send}>
                <IconSend style={{ width: 12, height: 12 }} /> Send
              </button>
              <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSmall}`} disabled={!!busy} onClick={reject}>Reject</button>
            </div>
          </div>
          <input
            className={styles.input}
            placeholder="Subject"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setDirty(true); }}
            style={{ marginBottom: 10, fontWeight: 600 }}
          />
          <textarea
            className={styles.textarea}
            placeholder="Body (HTML — paragraphs separated by <br><br>)"
            value={body}
            onChange={(e) => { setBody(e.target.value); setDirty(true); }}
            style={{ minHeight: 220, fontFamily: 'monospace', fontSize: 13 }}
          />
          {body && (
            <div style={{ marginTop: 12, padding: 16, background: 'var(--color-surface-2, #0f172a)', borderRadius: 8, color: 'var(--color-text-secondary)', fontSize: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: body }} />
          )}
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Outreach history</div>
          </div>
          {data.outreach.length === 0 ? (
            <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Nothing sent yet.</div>
          ) : (
            data.outreach.map((o: any) => (
              <div key={o.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 600 }}>{o.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                  Sent {fmtRelative(o.sentAt)}
                  {o.openCount > 0 && ` · ${o.openCount} open(s)`}
                  {o.clickCount > 0 && ` · ${o.clickCount} click(s)`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitle}>Notes</div>
          </div>
          <textarea
            className={styles.textarea}
            placeholder="Add a note…"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            style={{ minHeight: 80 }}
          />
          <button
            className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
            disabled={!noteText.trim() || !!busy}
            onClick={addNote}
            style={{ marginTop: 8 }}
          >
            <IconNote style={{ width: 12, height: 12 }} /> Add note
          </button>
          <div style={{ marginTop: 16 }}>
            {data.notes.length === 0 ? (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>No notes yet.</div>
            ) : (
              data.notes.map((n: any) => (
                <div key={n.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{fmtRelative(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 14 }}>{value}</div>
    </div>
  );
}
