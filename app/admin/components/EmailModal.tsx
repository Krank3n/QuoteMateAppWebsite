'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { api } from '../lib/adminApi';
import { IconEmail, IconSend } from './icons';

interface Recipient {
  uid: string;
  email: string | null;
  name: string | null;
}

interface SavedSegment {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function EmailModal({
  recipients,
  onClose,
  onSent,
}: {
  recipients: Recipient[];
  onClose: () => void;
  onSent?: (result: { sent: number; failed: number; total: number }) => void;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bypassPrefs, setBypassPrefs] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSegments, setSavedSegments] = useState<SavedSegment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    api.listSegments({}).then((r: any) => setSavedSegments(r?.segments || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body, sending]);

  const hasEmail = recipients.filter((r) => r.email).length;
  const missingEmail = recipients.length - hasEmail;
  const canSend = subject.trim() && body.trim() && !sending && hasEmail > 0;

  const applyTemplate = (id: string) => {
    setSelectedTemplate(id);
    if (!id) return;
    const tmpl = savedSegments.find((s) => s.id === id);
    if (!tmpl) return;
    if (!subject) setSubject(tmpl.subject);
    if (!body) setBody(tmpl.body.replace(/<br\/>/g, '\n').replace(/<br>/g, '\n'));
  };

  const send = async () => {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      if (recipients.length === 1) {
        const r = recipients[0];
        const res: any = await api.sendUserEmail({
          uid: r.uid,
          subject: subject.trim(),
          body: body.replace(/\n/g, '<br/>'),
          bypassPrefs,
        });
        if (res?.ok) {
          onSent?.({ sent: 1, failed: 0, total: 1 });
          onClose();
        } else {
          setError('Send failed (recipient may have opted out of marketing)');
        }
      } else {
        const res: any = await api.broadcast({
          segment: 'custom_uids',
          segmentParams: { uids: recipients.filter((r) => r.email).map((r) => r.uid) },
          subject: subject.trim(),
          body: body.replace(/\n/g, '<br/>'),
        });
        onSent?.({ sent: res?.sent || 0, failed: res?.failed || 0, total: res?.total || 0 });
        onClose();
      }
    } catch (e: any) {
      setError(e?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
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
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconEmail style={{ width: 18, height: 18 }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {recipients.length === 1
                ? `Email ${recipients[0].name || recipients[0].email || recipients[0].uid}`
                : `Email ${hasEmail} recipients`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {recipients.length === 1
                ? (recipients[0].email || 'No email on file')
                : `${hasEmail} will receive${missingEmail ? ` · ${missingEmail} skipped (no email)` : ''}`}
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onClose}>Close</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, flex: 1, minHeight: 0 }}>
          <div style={{ padding: 20, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            {savedSegments.length > 0 && (
              <div>
                <label className={styles.loginLabel}>Start from template</label>
                <select
                  className={styles.select}
                  value={selectedTemplate}
                  onChange={(e) => applyTemplate(e.target.value)}
                >
                  <option value="">— blank —</option>
                  {savedSegments.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={styles.loginLabel}>Subject</label>
              <input
                className={styles.input}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Keep under 60 chars"
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <label className={styles.loginLabel}>Message</label>
              <textarea
                className={styles.textarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hey ${recipients[0]?.name?.split(' ')[0] || 'mate'},\n\nHope the app's treating you well…`}
                style={{ flex: 1, minHeight: 240, fontFamily: 'inherit', lineHeight: 1.55 }}
              />
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                Plain text · line breaks become &lt;br/&gt; · ⌘↵ to send
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" checked={bypassPrefs} onChange={(e) => setBypassPrefs(e.target.checked)} />
              Send as transactional (bypasses marketing opt-out) — use sparingly
            </label>

            {error && (
              <div className={styles.loginError}>{error}</div>
            )}
          </div>

          <div style={{ padding: 20, overflowY: 'auto', background: 'rgba(0,0,0,0.25)' }}>
            <label className={styles.loginLabel}>Preview</label>
            <div className={styles.previewFrame} style={{ marginTop: 4 }}>
              <div style={{ borderBottom: '3px solid #f97316', paddingBottom: 12, marginBottom: 16, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                QuoteMate
              </div>
              <div style={{ color: '#555', fontSize: 12, marginBottom: 10 }}>
                <strong>Subject:</strong> {subject || <em style={{ color: '#aaa' }}>(enter a subject)</em>}
              </div>
              <div
                style={{ color: '#0F172A', fontSize: 14, lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: (body || '<em style="color:#888">Write your message…</em>').replace(/\n/g, '<br/>') }}
              />
              <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #eee', color: '#888', fontSize: 11 }}>
                Tom at QuoteMate · <a href="mailto:tom@hansendev.com.au" style={{ color: '#fb923c' }}>tom@hansendev.com.au</a>
              </div>
            </div>
          </div>
        </div>

        <footer style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Every send is logged to emailLog + adminAuditLog, and tracked for opens/clicks/bounces.
          </span>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose} style={{ marginLeft: 'auto' }}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={send} disabled={!canSend}>
            <IconSend style={{ width: 14, height: 14 }} />
            {sending
              ? 'Sending…'
              : recipients.length === 1
              ? 'Send email'
              : `Send to ${hasEmail}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
