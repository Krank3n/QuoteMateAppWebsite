'use client';

import { useState } from 'react';
import AdminShell from '../components/AdminShell';
import styles from '../admin.module.css';
import { api } from '../lib/adminApi';
import { IconSend, IconCampaign } from '../components/icons';

const SEGMENTS: Array<{ id: string; label: string; hint: string; needsSupplier?: boolean }> = [
  { id: 'all', label: 'All users', hint: 'Every account in the system' },
  { id: 'pro', label: 'Pro + trial', hint: 'Users on an active or trialing subscription' },
  { id: 'free', label: 'Free users', hint: 'No active subscription' },
  { id: 'inactive_7d', label: 'Inactive 7+ days', hint: 'Activity gap — re-engagement prime' },
  { id: 'inactive_30d', label: 'Inactive 30+ days', hint: 'Likely churned — last-shot campaign' },
  { id: 'signed_up_this_week', label: 'New this week', hint: 'Signed up in the last 7 days' },
  { id: 'supplier_subscribers', label: 'Supplier subscribers', hint: 'Users subscribed to a specific supplier', needsSupplier: true },
];

export default function CampaignsPage() {
  const [segment, setSegment] = useState('inactive_7d');
  const [supplierId, setSupplierId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [dryRunCount, setDryRunCount] = useState<number | null>(null);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const chosen = SEGMENTS.find((s) => s.id === segment)!;
  const canSend = subject.trim() && body.trim() && (!chosen.needsSupplier || supplierId.trim());

  const dryRun = async () => {
    setWorking(true);
    try {
      const r: any = await api.broadcast({
        segment,
        segmentParams: chosen.needsSupplier ? { supplierId: supplierId.trim() } : {},
        subject: subject.trim() || '(preview)',
        body: body || '(preview)',
        dryRun: true,
      });
      setDryRunCount(r.count ?? 0);
    } catch (e: any) {
      setToast({ msg: e?.message || 'Dry-run failed', error: true });
    } finally {
      setWorking(false);
    }
  };

  const send = async () => {
    if (!canSend) return;
    if (!confirm(`Send "${subject}" to the "${chosen.label}" segment? This cannot be undone.`)) return;
    setWorking(true);
    setResult(null);
    try {
      const r: any = await api.broadcast({
        segment,
        segmentParams: chosen.needsSupplier ? { supplierId: supplierId.trim() } : {},
        subject: subject.trim(),
        body: body.replace(/\n/g, '<br/>'),
        dryRun: false,
      });
      setResult({ sent: r.sent, failed: r.failed, total: r.total });
      setToast({ msg: `Sent ${r.sent} of ${r.total}` });
    } catch (e: any) {
      setToast({ msg: e?.message || 'Broadcast failed', error: true });
    } finally {
      setWorking(false);
    }
  };

  return (
    <AdminShell title="Campaigns" breadcrumb="Broadcast email to a segment">
      <div className={styles.composerGrid}>
        <div>
          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Segment</div>
                <div className={styles.cardSubtitle}>Who receives this broadcast</div>
              </div>
            </div>
            <div className={styles.chipRow}>
              {SEGMENTS.map((s) => {
                const on = s.id === segment;
                return (
                  <button
                    key={s.id}
                    className={styles.chip}
                    onClick={() => { setSegment(s.id); setDryRunCount(null); setResult(null); }}
                    style={on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 10 }}>{chosen.hint}</div>
            {chosen.needsSupplier && (
              <div style={{ marginTop: 12 }}>
                <label className={styles.loginLabel}>Supplier ID</label>
                <input className={styles.input} value={supplierId} onChange={(e) => setSupplierId(e.target.value)} placeholder="e.g. bunnings" />
              </div>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Compose</div>
                <div className={styles.cardSubtitle}>Plain text — line breaks become &lt;br/&gt;</div>
              </div>
            </div>
            <input
              className={styles.input}
              placeholder="Subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ marginBottom: 10 }}
            />
            <textarea
              className={styles.textarea}
              placeholder="Hey {firstName},&#10;&#10;Wanted to share…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{ minHeight: 260 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={dryRun} disabled={working}>
                Count recipients
              </button>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={send}
                disabled={!canSend || working}
                style={{ marginLeft: 'auto' }}
              >
                <IconSend style={{ width: 14, height: 14 }} /> {working ? 'Sending…' : 'Send broadcast'}
              </button>
            </div>
            {dryRunCount !== null && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10, color: '#93c5fd', fontSize: 13 }}>
                Would reach <strong>{dryRunCount.toLocaleString()}</strong> users.
              </div>
            )}
            {result && (
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, color: '#6ee7b7', fontSize: 13 }}>
                Sent <strong>{result.sent}</strong> · Failed <strong>{result.failed}</strong> · Total <strong>{result.total}</strong>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Preview</div>
                <div className={styles.cardSubtitle}>How it lands in the inbox</div>
              </div>
            </div>
            <div className={styles.previewFrame}>
              <div style={{ borderBottom: '3px solid #f97316', paddingBottom: 12, marginBottom: 16, fontSize: 18, fontWeight: 700 }}>
                QuoteMate
              </div>
              <div style={{ color: '#555', fontSize: 12, marginBottom: 10 }}>
                <strong>Subject:</strong> {subject || '(enter a subject)'}
              </div>
              <div dangerouslySetInnerHTML={{ __html: (body || '<em style="color:#888">Write your message…</em>').replace(/\n/g, '<br/>') }} />
              <div style={{ marginTop: 18, paddingTop: 12, borderTop: '1px solid #eee', color: '#888', fontSize: 11 }}>
                Tom at QuoteMate · tom@hansendev.com.au
              </div>
            </div>
          </div>
          <div className={styles.card} style={{ marginTop: 16 }}>
            <div className={styles.railTitle}>Tips</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
              <li>Always count recipients before sending.</li>
              <li>Keep subject under 60 chars for better preview.</li>
              <li>Respects per-user marketing opt-out.</li>
              <li>Every send is logged to adminAuditLog.</li>
            </ul>
          </div>
        </div>
      </div>

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </AdminShell>
  );
}
