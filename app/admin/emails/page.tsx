'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { IconEmail, IconExternal } from '../components/icons';

interface Event {
  id: string;
  userId: string | null;
  to: string | null;
  subject: string | null;
  category: string | null;
  status: string;
  tags: string[];
  queuedAt: number | null;
  sentAt: number | null;
  deliveredAt: number | null;
  bouncedAt: number | null;
  bounceType: string | null;
  bounceReason: string | null;
  openedAt: number | null;
  openCount: number;
  firstClickedAt: number | null;
  clickCount: number;
  clickedUrls: string[];
  spamReportedAt: number | null;
  unsubscribedAt: number | null;
  blockedAt: number | null;
  blockedReason: string | null;
  deliveryError: string | null;
  lastEvent: string | null;
  lastEventAt: number | null;
}

const CATEGORIES = ['all', 'transactional', 'marketing'];
const STATUSES = ['all', 'pending', 'sent', 'delivered', 'bounced', 'spam', 'blocked', 'send_failed', 'deferred'];

export default function EmailsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params: any = { limit: 500 };
    if (category !== 'all') params.category = category;
    if (status !== 'all') params.status = status;
    Promise.all([api.listEmailEvents(params), api.emailHealth({})])
      .then(([r, h]: any) => {
        if (cancelled) return;
        setEvents(r?.events || []);
        setTotals(r?.totals || {});
        setHealth(h || null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [category, status]);

  const filtered = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter((e) =>
      [e.to, e.subject, e.userId, e.tags.join(' ')].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [events, search]);

  useSetPageMeta({
    title: 'Email log',
    breadcrumb: 'Every send + delivery, bounce, open, click',
    search: { value: search, onChange: setSearch, placeholder: 'Search recipient, subject, tag…' },
  });

  return (
    <>
      {health && (
        <div className={styles.statGrid}>
          <StatTile label="Sent (24h)" value={health.last24h.sent} sub={`${health.last7d.sent} in 7d`} />
          <StatTile
            label="Delivered"
            value={health.last24h.delivered}
            sub={`${rate(health.last24h.delivered, health.last24h.sent)}% in 24h · ${rate(health.last7d.delivered, health.last7d.sent)}% in 7d`}
          />
          <StatTile
            label="Opened"
            value={health.last24h.opened}
            sub={`${rate(health.last24h.opened, health.last24h.delivered)}% open rate · ${health.last7d.clicked} clicks (7d)`}
            accent
          />
          <StatTile
            label="Bounced / spam / failed"
            value={health.last7d.bounced + health.last7d.spam + health.last7d.failed}
            sub={`${health.last7d.bounced} bounced · ${health.last7d.spam} spam · ${health.last7d.failed} failed (7d)`}
            warn={health.last7d.bounced + health.last7d.spam + health.last7d.failed > 0}
          />
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Email log</div>
            <div className={styles.cardSubtitle}>{loading ? 'Loading…' : `${filtered.length} of ${events.length} shown`}</div>
          </div>
        </div>

        <div className={styles.chipRow} style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Category</span>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={styles.chip}
              onClick={() => setCategory(c)}
              style={category === c ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={styles.chipRow} style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: 1, alignSelf: 'center', marginRight: 8 }}>Status</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={styles.chip}
              onClick={() => setStatus(s)}
              style={status === s ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
            >
              {s}
              {s !== 'all' && totals[s] ? <span style={{ opacity: 0.6, marginLeft: 4 }}>{totals[s]}</span> : null}
            </button>
          ))}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Recipient · Subject</th>
                <th>Category</th>
                <th>Status</th>
                <th>Opens</th>
                <th>Clicks</th>
                <th>Queued</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className={styles.empty}>
                    <IconEmail className={styles.emptyIcon} />
                    <div className={styles.emptyTitle}>No emails match</div>
                    <div className={styles.emptyText}>Try a different filter or send some email.</div>
                  </div>
                </td></tr>
              ) : filtered.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={styles.listAvatar} style={{ width: 28, height: 28, fontSize: 11 }}>
                        {initials(e.to || '?')}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.rowPrimary} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 380 }}>
                          {e.subject || '(no subject)'}
                        </div>
                        <div className={styles.rowSecondary}>{e.to}</div>
                      </div>
                    </div>
                  </td>
                  <td>{e.category || '—'}</td>
                  <td><StatusBadge event={e} /></td>
                  <td>{e.openCount > 0 ? <span style={{ color: '#6ee7b7' }}>{e.openCount}×</span> : <span style={{ opacity: 0.3 }}>—</span>}</td>
                  <td>{e.clickCount > 0 ? <span style={{ color: '#60a5fa' }}>{e.clickCount}×</span> : <span style={{ opacity: 0.3 }}>—</span>}</td>
                  <td>{fmtRelative(e.queuedAt || e.sentAt)}</td>
                  <td style={{ textAlign: 'right' }}>
                    {e.userId && (
                      <Link href={`/admin/users?uid=${encodeURIComponent(e.userId)}`} className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>
                        <IconExternal style={{ width: 12, height: 12 }} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ event }: { event: Event }) {
  const e = event;
  if (e.spamReportedAt) return <span className={`${styles.tag} ${styles.tagCanceled}`}>spam</span>;
  if (e.bouncedAt) return <span className={`${styles.tag} ${styles.tagCanceled}`} title={e.bounceReason || ''}>{e.bounceType || 'bounced'}</span>;
  if (e.blockedAt) return <span className={`${styles.tag} ${styles.tagCanceled}`} title={e.blockedReason || ''}>blocked</span>;
  if (e.status === 'send_failed' || e.status === 'error') return <span className={`${styles.tag} ${styles.tagCanceled}`} title={e.deliveryError || ''}>failed</span>;
  if (e.firstClickedAt) return <span className={`${styles.tag} ${styles.tagPro}`}>clicked</span>;
  if (e.openedAt) return <span className={`${styles.tag} ${styles.tagPro}`}>opened</span>;
  if (e.deliveredAt) return <span className={`${styles.tag} ${styles.tagTrial}`}>delivered</span>;
  if (e.sentAt) return <span className={`${styles.tag} ${styles.tagTrial}`}>sent</span>;
  if (e.status === 'deferred') return <span className={`${styles.tag} ${styles.tagAtRisk}`}>deferred</span>;
  return <span className={styles.tag}>pending</span>;
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

function rate(num: number, den: number): number {
  if (!den) return 0;
  return Math.round((num / den) * 100);
}
