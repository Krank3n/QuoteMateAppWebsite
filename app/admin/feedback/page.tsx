'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtRelative } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconFeedback, IconSend } from '../components/icons';

interface FeedbackItem {
  id: string;
  userId: string | null;
  email: string | null;
  category: string | null;
  feedback: string | null;
  rating: string | null;
  details: string | null;
  source: string | null;
  replied: boolean;
  repliedAt: number | null;
  repliedBy: string | null;
  replyBody: string | null;
  detailsAddedAt: number | null;
  createdAt: number | null;
}

interface Totals {
  all: number;
  unreplied: number;
  replied: number;
  last7d: number;
  ratings: { great: number; okay: number; bad: number };
}

const RATINGS = ['all', 'great', 'okay', 'bad'] as const;
const REPLIED_FILTERS = ['unreplied', 'all', 'replied'] as const;
type RepliedFilter = (typeof REPLIED_FILTERS)[number];

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [rating, setRating] = useState<string>('all');
  const [repliedFilter, setRepliedFilter] = useState<RepliedFilter>('unreplied');

  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 200 };
    if (category !== 'all') params.category = category;
    if (rating !== 'all') params.rating = rating;
    api.listFeedback(params).then((r: any) => {
      if (cancelled) return;
      setItems(r?.items || []);
      setTotals(r?.totals || null);
      setCategoryCounts(r?.categoryCounts || {});
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [category, rating, refreshTick]);

  const filtered = useMemo(() => {
    const base = repliedFilter === 'all'
      ? items
      : items.filter((i) => (repliedFilter === 'replied' ? i.replied : !i.replied));
    // Unreplied first when showing all, then date desc
    return [...base].sort((a, b) => {
      if (repliedFilter === 'all' && a.replied !== b.replied) return a.replied ? 1 : -1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [items, repliedFilter]);

  const categoryOptions = useMemo(() => {
    const cats = Object.keys(categoryCounts).sort((a, b) => (categoryCounts[b] || 0) - (categoryCounts[a] || 0));
    return ['all', ...cats];
  }, [categoryCounts]);

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

  useSetPageMeta({
    title: 'Feedback',
    breadcrumb: totals ? `${totals.unreplied} unread · ${totals.all} total` : '',
  });

  const activeChipStyle = { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' };

  return (
    <>
      {totals && (
        <div className={styles.statGrid}>
          <StatTile label="Unreplied" value={totals.unreplied} sub={`${totals.all} total`} warn={totals.unreplied > 0} />
          <StatTile label="Last 7 days" value={totals.last7d} sub={`${totals.replied} replied all-time`} />
          <StatTile label="Great" value={totals.ratings.great} sub="positive ratings" />
          <StatTile
            label="Okay / Bad"
            value={totals.ratings.okay + totals.ratings.bad}
            sub={`${totals.ratings.okay} okay · ${totals.ratings.bad} bad`}
            warn={totals.ratings.bad > 0}
          />
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Inbox</div>
            <div className={styles.cardSubtitle}>{loading ? 'Loading…' : `${filtered.length} shown`}</div>
          </div>
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Status</span>
          {REPLIED_FILTERS.map((s) => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => setRepliedFilter(s)}
              style={repliedFilter === s ? activeChipStyle : undefined}
            >
              {s}
              {totals && s === 'unreplied' && totals.unreplied ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals.unreplied}</span> : null}
              {totals && s === 'replied' && totals.replied ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals.replied}</span> : null}
            </button>
          ))}
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Rating</span>
          {RATINGS.map((r) => (
            <button
              key={r}
              className={styles.chip}
              onClick={() => setRating(r)}
              style={rating === r ? activeChipStyle : undefined}
            >
              {r}
              {totals && r !== 'all' && totals.ratings[r as 'great' | 'okay' | 'bad']
                ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals.ratings[r as 'great' | 'okay' | 'bad']}</span>
                : null}
            </button>
          ))}
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Category</span>
          {categoryOptions.map((c) => (
            <button
              key={c}
              className={styles.chip}
              onClick={() => setCategory(c)}
              style={category === c ? activeChipStyle : undefined}
            >
              {c}
              {c !== 'all' && categoryCounts[c] ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{categoryCounts[c]}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.centerLoader} style={{ minHeight: 200 }}><div className={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <IconFeedback className={styles.emptyIcon} />
            <div className={styles.emptyTitle}>{repliedFilter === 'unreplied' ? 'Inbox zero' : 'Nothing here'}</div>
            <div className={styles.emptyText}>{repliedFilter === 'unreplied' ? 'Every message has been replied to. Nice.' : 'No feedback matches these filters.'}</div>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            {filtered.map((f) => <FeedbackRow
              key={f.id}
              item={f}
              isReplying={replyFor === f.id}
              replyBody={replyBody}
              sending={sending}
              onStartReply={() => { setReplyFor(f.id); setReplyBody(''); }}
              onCancelReply={() => { setReplyFor(null); setReplyBody(''); }}
              onChangeReply={setReplyBody}
              onSendReply={() => sendReply(f.id)}
            />)}
          </div>
        )}
      </div>
      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </>
  );
}

function FeedbackRow({
  item: f,
  isReplying,
  replyBody,
  sending,
  onStartReply,
  onCancelReply,
  onChangeReply,
  onSendReply,
}: {
  item: FeedbackItem;
  isReplying: boolean;
  replyBody: string;
  sending: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  onChangeReply: (s: string) => void;
  onSendReply: () => void;
}) {
  // Quick-rating entries store "Quick rating: X" as the body — show as just a rating pill instead.
  const isQuickRatingOnly = !!f.rating && f.feedback?.startsWith('Quick rating:') && !f.details;
  const bodyText = isQuickRatingOnly ? null : (f.feedback || null);

  return (
    <div className={styles.feedbackItem}>
      <div className={styles.feedbackIcon}>
        <IconFeedback style={{ width: 16, height: 16 }} />
      </div>
      <div style={{ minWidth: 0 }}>
        {bodyText ? (
          <div className={styles.feedbackBody} style={{ whiteSpace: 'pre-wrap' }}>{bodyText}</div>
        ) : (
          <div className={styles.feedbackEmpty}>
            {f.rating ? `One-tap rating from email — no message left.` : 'No message body.'}
          </div>
        )}

        {f.details && (
          <div className={styles.feedbackDetails}>
            <div className={styles.feedbackDetailsLabel}>Follow-up</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{f.details}</div>
          </div>
        )}

        <div className={styles.feedbackMeta}>
          {f.rating && <RatingPill rating={f.rating} />}
          {f.userId ? (
            <Link href={`/admin/users/${f.userId}`} className={styles.feedbackMetaLink}>
              {f.email || f.userId}
            </Link>
          ) : (
            <span>{f.email || 'anonymous'}</span>
          )}
          {f.category && <span>{f.category}</span>}
          {f.source && <span style={{ opacity: 0.7 }}>via {f.source}</span>}
          <span>{fmtRelative(f.createdAt)}</span>
          {f.replied && <span style={{ color: '#10b981' }}>✓ replied {fmtRelative(f.repliedAt)}</span>}
        </div>

        {f.replied && f.replyBody && (
          <div className={styles.feedbackReplied}>
            <div className={styles.feedbackDetailsLabel} style={{ color: '#34d399' }}>Your reply</div>
            <div dangerouslySetInnerHTML={{ __html: f.replyBody }} />
          </div>
        )}

        {isReplying && (
          <div style={{ marginTop: 12 }}>
            <textarea
              className={styles.textarea}
              value={replyBody}
              onChange={(e) => onChangeReply(e.target.value)}
              placeholder="Thanks for the feedback! …"
              style={{ minHeight: 110 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={onSendReply} disabled={sending || !replyBody.trim()}>
                {sending ? 'Sending…' : 'Send reply'}
              </button>
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={onCancelReply}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      <div>
        {!isReplying && !f.replied && (
          <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={onStartReply}>
            <IconSend style={{ width: 12, height: 12 }} /> Reply
          </button>
        )}
      </div>
    </div>
  );
}

function RatingPill({ rating }: { rating: string }) {
  const cls = rating === 'great' ? styles.ratingGreat : rating === 'okay' ? styles.ratingOkay : rating === 'bad' ? styles.ratingBad : '';
  const emoji = rating === 'great' ? '😍' : rating === 'okay' ? '😐' : rating === 'bad' ? '💩' : '';
  return <span className={`${styles.ratingPill} ${cls}`}>{emoji} {rating}</span>;
}

function StatTile({ label, value, sub, warn }: { label: string; value: number | string; sub?: string; warn?: boolean }) {
  return (
    <div className={styles.statCard} style={warn ? { borderColor: 'rgba(239, 68, 68, 0.3)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={warn ? { color: '#fca5a5' } : undefined}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}
