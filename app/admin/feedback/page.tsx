'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconFeedback, IconSend } from '../components/icons';

interface FeedbackItem {
  id: string;
  message?: string;
  email?: string;
  userId?: string;
  category?: string;
  rating?: number;
  replied?: boolean;
  repliedAt?: any;
  createdAt?: any;
}

export default function FeedbackPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api.dashboardStats({}).then((s: any) => {
      if (!cancelled) {
        setStats(s);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refreshTick]);

  const feedback: FeedbackItem[] = stats?.feedback || [];

  const sendReply = async (id: string) => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      const r: any = await api.replyToFeedback({ feedbackId: id, body: replyBody.replace(/\n/g, '<br/>') });
      if (r.ok) {
        setToast({ msg: 'Reply sent' });
        setReplyFor(null);
        setReplyBody('');
        setRefreshTick((n) => n + 1);
      } else {
        setToast({ msg: 'Email failed — no address?', error: true });
      }
    } catch (e: any) {
      setToast({ msg: e?.message || 'Failed', error: true });
    } finally {
      setSending(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  useSetPageMeta({ title: 'Feedback', breadcrumb: `${feedback.length} recent` });

  return (
    <>
      {loading ? (
        <div className={styles.centerLoader} style={{ minHeight: 200 }}><div className={styles.spinner} /></div>
      ) : feedback.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.empty}>
            <IconFeedback className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>Inbox zero</div>
            <div className={styles.emptyText}>No feedback submitted yet.</div>
          </div>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          {feedback.map((f) => {
            const ts = f.createdAt?._seconds ? f.createdAt._seconds * 1000 : f.createdAt?.toMillis?.() || null;
            return (
              <div key={f.id} className={styles.feedbackItem}>
                <div className={styles.feedbackIcon}>
                  <IconFeedback style={{ width: 16, height: 16 }} />
                </div>
                <div>
                  <div className={styles.feedbackBody}>{f.message}</div>
                  <div className={styles.feedbackMeta}>
                    <span>{f.email || 'anonymous'}</span>
                    {f.category && <span>category: {f.category}</span>}
                    {typeof f.rating === 'number' && <span>rating: {f.rating}</span>}
                    <span>{fmtRelative(ts)}</span>
                    {f.replied && <span style={{ color: '#10b981' }}>✓ replied</span>}
                  </div>
                  {replyFor === f.id && (
                    <div style={{ marginTop: 12 }}>
                      <textarea
                        className={styles.textarea}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Thanks for the feedback! …"
                        style={{ minHeight: 110 }}
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={() => sendReply(f.id)} disabled={sending || !replyBody.trim()}>
                          {sending ? 'Sending…' : 'Send reply'}
                        </button>
                        <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => { setReplyFor(null); setReplyBody(''); }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  {replyFor !== f.id && (
                    <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => { setReplyFor(f.id); setReplyBody(''); }}>
                      <IconSend style={{ width: 12, height: 12 }} /> Reply
                    </button>
                  )}
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
