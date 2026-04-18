'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '../components/AdminShell';
import styles from '../admin.module.css';
import { api, fmtDate, fmtDateTime, fmtRelative, initials } from '../lib/adminApi';
import {
  IconEmail,
  IconPhone,
  IconNote,
  IconTag,
  IconSend,
  IconClock,
  IconSupplier,
  IconExternal,
} from '../components/icons';

interface UserRow {
  uid: string;
  email: string | null;
  displayName: string | null;
  businessName: string | null;
  phone: string | null;
  lastActivityAt: number | null;
  signupAt: number | null;
  planTier: string;
  quoteCount: number;
  invoiceCount: number;
  supplierBookCount: number;
  tags: string[];
  marketingOptIn: boolean;
}

const AVAILABLE_TAGS = ['hot-lead', 'at-risk', 'vip', 'support-needed', 'champion', 'do-not-contact'];

export default function UsersPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <UsersPageInner />
    </Suspense>
  );
}

function UsersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedUid = searchParams?.get('uid') || null;

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Load list
  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    api.listUsers({ search, limit: 200 }).then((r: any) => {
      if (cancelled) return;
      setUsers(r.users || []);
      setTotal(r.total || 0);
      setLoadingList(false);
    }).catch(() => {
      if (!cancelled) setLoadingList(false);
    });
    return () => { cancelled = true; };
  }, [search]);

  // Load detail
  useEffect(() => {
    if (!selectedUid) { setDetail(null); return; }
    let cancelled = false;
    setLoadingDetail(true);
    api.getUser({ uid: selectedUid }).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setLoadingDetail(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        setToast({ msg: e?.message || 'Failed to load user', error: true });
        setLoadingDetail(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedUid, refreshTick]);

  const selectUser = (uid: string) => {
    const p = new URLSearchParams(searchParams?.toString());
    p.set('uid', uid);
    router.replace(`/admin/users?${p.toString()}`);
  };

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AdminShell
      title="Users"
      breadcrumb={`${total.toLocaleString()} tradies in your base`}
      search={{ value: search, onChange: setSearch, placeholder: 'Search by name, email, business, phone…' }}
    >
      <div className={styles.splitView}>
        <div className={styles.splitList}>
          <div className={styles.splitListHeader}>
            <span>{loadingList ? 'Loading…' : `${users.length} shown`}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Sorted by last active</span>
          </div>
          <div className={styles.splitListScroll}>
            {loadingList ? (
              <UserListSkeleton />
            ) : users.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>No matches</div>
                <div className={styles.emptyText}>Try a different search.</div>
              </div>
            ) : (
              users.map((u) => (
                <button
                  key={u.uid}
                  className={`${styles.listRow} ${selectedUid === u.uid ? styles.listRowActive : ''}`}
                  onClick={() => selectUser(u.uid)}
                  style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div className={styles.listAvatar}>{initials(u.businessName || u.displayName || u.email)}</div>
                  <div className={styles.listBody}>
                    <div className={styles.listTitle}>{u.businessName || u.displayName || u.email || u.uid}</div>
                    <div className={styles.listSubtitle}>
                      {u.email || 'no email'} · {u.quoteCount}q
                    </div>
                  </div>
                  <div className={styles.listMeta}>
                    <PlanTag tier={u.planTier} />
                    <div style={{ marginTop: 4 }}>{fmtRelative(u.lastActivityAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.splitDetail}>
          {!selectedUid && (
            <div className={styles.empty} style={{ padding: '80px 20px' }}>
              <div className={styles.emptyTitle}>Pick a user</div>
              <div className={styles.emptyText}>Select someone from the list to see their full CRM profile.</div>
            </div>
          )}
          {selectedUid && loadingDetail && (
            <div className={styles.centerLoader} style={{ minHeight: 200 }}>
              <div className={styles.spinner} />
            </div>
          )}
          {selectedUid && !loadingDetail && detail && (
            <UserDetail
              detail={detail}
              onChanged={() => setRefreshTick((n) => n + 1)}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>
      )}
    </AdminShell>
  );
}

function PlanTag({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    pro: styles.tagPro,
    trialing: styles.tagTrial,
    free: styles.tagFree,
    canceled: styles.tagCanceled,
  };
  const cls = map[tier] || styles.tag;
  const label = tier === 'trialing' ? 'trial' : tier;
  return <span className={`${styles.tag} ${cls}`}>{label}</span>;
}

function UserListSkeleton() {
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={styles.listRow}>
          <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: 18 }} />
          <div style={{ flex: 1 }}>
            <div className={styles.skeleton} style={{ height: 12, width: '70%', marginBottom: 6 }} />
            <div className={styles.skeleton} style={{ height: 10, width: '45%' }} />
          </div>
        </div>
      ))}
    </>
  );
}

function UserDetail({
  detail,
  onChanged,
  showToast,
}: {
  detail: any;
  onChanged: () => void;
  showToast: (msg: string, error?: boolean) => void;
}) {
  const { uid, profile, business, emailState, emailPreferences, subscription, quotes, invoices, notes, calls, emailLog, feedback, supplierBook } = detail;
  const name = business?.businessName || profile?.displayName || profile?.email || uid;
  const tier = subscription?.status === 'active'
    ? (subscription.tier || 'pro')
    : subscription?.status === 'trialing'
    ? 'trialing'
    : subscription?.status === 'canceled' || subscription?.status === 'cancelled'
    ? 'canceled'
    : 'free';
  const tags: string[] = detail?.userDoc?.crmTags || [];

  return (
    <>
      <div className={styles.detailHead}>
        <div className={styles.detailAvatar}>{initials(name)}</div>
        <div>
          <div className={styles.detailTitle}>{name}</div>
          <div className={styles.detailSubtitle}>
            <PlanTag tier={tier} />
            {profile?.email && (
              <a href={`mailto:${profile.email}`}><IconEmail style={{ width: 13, height: 13 }} /> {profile.email}</a>
            )}
            {(profile?.phoneNumber || business?.phone) && (
              <a href={`tel:${profile?.phoneNumber || business?.phone}`}>
                <IconPhone style={{ width: 13, height: 13 }} /> {profile?.phoneNumber || business?.phone}
              </a>
            )}
            {profile?.creationTime && (
              <span><IconClock style={{ width: 13, height: 13 }} /> joined {fmtDate(new Date(profile.creationTime).getTime())}</span>
            )}
          </div>
          <div className={styles.detailTags}>
            {tags.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No tags</span>
            ) : (
              tags.map((t) => <span key={t} className={`${styles.tag} ${tagClass(t)}`}><IconTag style={{ width: 10, height: 10 }} /> {t}</span>)
            )}
          </div>
        </div>
        <div className={styles.detailActions}>
          <a
            href={`mailto:${profile?.email || ''}`}
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={!profile?.email ? { pointerEvents: 'none', opacity: 0.4 } : undefined}
          >
            <IconEmail style={{ width: 14, height: 14 }} /> Email
          </a>
          <a
            href={`tel:${profile?.phoneNumber || business?.phone || ''}`}
            className={`${styles.btn} ${styles.btnSecondary}`}
            style={!(profile?.phoneNumber || business?.phone) ? { pointerEvents: 'none', opacity: 0.4 } : undefined}
          >
            <IconPhone style={{ width: 14, height: 14 }} /> Call
          </a>
        </div>
      </div>

      <div className={styles.detailBody}>
        <div>
          <div className={styles.detailSection}>
            <h3>At a glance</h3>
            <div className={styles.detailFactGrid}>
              <Fact label="UID" value={<code style={{ fontSize: 11 }}>{uid}</code>} />
              <Fact label="Business" value={business?.businessName || '—'} />
              <Fact label="ABN" value={business?.abn || '—'} />
              <Fact label="Last active" value={fmtRelative(emailState?.lastActivityAt)} />
              <Fact label="Quotes" value={`${quotes?.length || 0}+ (shown)`} />
              <Fact label="Invoices" value={`${invoices?.length || 0}+ (shown)`} />
              <Fact label="Marketing opt-in" value={emailPreferences?.marketing !== false ? 'Yes' : 'No'} />
              <Fact label="Last signed in" value={fmtRelative(profile?.lastSignInTime ? new Date(profile.lastSignInTime).getTime() : null)} />
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3>Supplier book ({supplierBook?.length || 0})</h3>
            {!supplierBook?.length ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                This tradie hasn't subscribed to any suppliers yet — onboarding opportunity.
              </div>
            ) : (
              <div className={styles.chipRow}>
                {supplierBook.map((s: any) => (
                  <Link
                    key={s.supplierId}
                    href={`/admin/suppliers?id=${encodeURIComponent(s.supplierId)}`}
                    className={styles.chip}
                  >
                    <IconSupplier style={{ width: 12, height: 12 }} />
                    {s.name || s.supplierId}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailSection}>
            <h3>Activity timeline</h3>
            <Timeline
              quotes={quotes || []}
              invoices={invoices || []}
              emails={emailLog || []}
              notes={notes || []}
              calls={calls || []}
              feedback={feedback || []}
            />
          </div>
        </div>

        <aside className={styles.rail}>
          <TagsCard uid={uid} tags={tags} onChanged={onChanged} showToast={showToast} />
          <NoteComposer uid={uid} onAdded={onChanged} showToast={showToast} />
          <CallLogger uid={uid} onLogged={onChanged} showToast={showToast} />
          <EmailComposer uid={uid} email={profile?.email} onSent={onChanged} showToast={showToast} />
        </aside>
      </div>
    </>
  );
}

function tagClass(tag: string) {
  if (tag === 'hot-lead') return styles.tagHot;
  if (tag === 'at-risk') return styles.tagAtRisk;
  if (tag === 'vip' || tag === 'champion') return styles.tagVip;
  return '';
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailFact}>
      <div className={styles.detailFactLabel}>{label}</div>
      <div className={styles.detailFactValue}>{value}</div>
    </div>
  );
}

function Timeline({ quotes, invoices, emails, notes, calls, feedback }: any) {
  const items: Array<{ at: number; kind: string; title: string; sub?: string }> = [];

  const ts = (v: any): number | null => {
    if (!v) return null;
    if (typeof v === 'number') return v;
    if (v._seconds) return v._seconds * 1000;
    if (v.toMillis) return v.toMillis();
    return null;
  };

  for (const q of quotes) {
    const t = ts(q.createdAt) || ts(q.updatedAt);
    if (t) items.push({ at: t, kind: 'quote', title: `Quote: ${q.customerName || q.title || q.id}`, sub: q.status ? `status: ${q.status}` : undefined });
  }
  for (const i of invoices) {
    const t = ts(i.createdAt);
    if (t) items.push({ at: t, kind: 'invoice', title: `Invoice: ${i.customerName || i.id}`, sub: i.status ? `status: ${i.status}` : undefined });
  }
  for (const e of emails) {
    const t = ts(e.sentAt);
    if (t) items.push({ at: t, kind: 'email', title: `Email: ${e.subject}`, sub: e.category });
  }
  for (const n of notes) {
    const t = ts(n.createdAt);
    if (t) items.push({ at: t, kind: 'note', title: n.note, sub: `by admin` });
  }
  for (const c of calls) {
    const t = ts(c.at);
    if (t) items.push({ at: t, kind: 'call', title: `Call logged — ${c.outcome}`, sub: c.notes || undefined });
  }
  for (const f of feedback) {
    const t = ts(f.createdAt);
    if (t) items.push({ at: t, kind: 'feedback', title: `Feedback: ${(f.message || '').slice(0, 140)}`, sub: f.rating ? `rating ${f.rating}` : undefined });
  }

  items.sort((a, b) => b.at - a.at);

  if (items.length === 0) {
    return <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No activity yet.</div>;
  }

  return (
    <div className={styles.timeline}>
      {items.slice(0, 40).map((it, idx) => (
        <div key={idx} className={styles.timelineItem} data-kind={it.kind}>
          <div className={styles.timelineItemMeta}>{fmtDateTime(it.at)} · {it.kind}</div>
          <div className={styles.timelineItemTitle}>{it.title}</div>
          {it.sub && <div className={styles.timelineItemSub}>{it.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function TagsCard({ uid, tags, onChanged, showToast }: any) {
  const [local, setLocal] = useState<string[]>(tags);
  const [saving, setSaving] = useState(false);
  useEffect(() => setLocal(tags), [tags, uid]);

  const toggle = (t: string) => {
    setLocal((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.setUserTags({ uid, tags: local });
      showToast('Tags updated');
      onChanged();
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSaving(false);
    }
  };

  const changed = JSON.stringify([...local].sort()) !== JSON.stringify([...tags].sort());

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Tags</div>
      <div className={styles.chipRow}>
        {AVAILABLE_TAGS.map((t) => {
          const on = local.includes(t);
          return (
            <button
              key={t}
              className={styles.chip}
              onClick={() => toggle(t)}
              style={on ? {
                background: 'rgba(249, 115, 22, 0.15)',
                color: 'var(--color-accent-light)',
                borderColor: 'rgba(249, 115, 22, 0.3)',
              } : undefined}
            >
              {t}
            </button>
          );
        })}
      </div>
      {changed && (
        <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={save} disabled={saving} style={{ marginTop: 10 }}>
          {saving ? 'Saving…' : 'Save tags'}
        </button>
      )}
    </div>
  );
}

function NoteComposer({ uid, onAdded, showToast }: any) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.addUserNote({ uid, note: note.trim() });
      setNote('');
      showToast('Note added');
      onAdded();
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Add note</div>
      <textarea
        className={styles.textarea}
        placeholder="Mental model of this user, last touchpoint, anything to remember…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
        onClick={save}
        disabled={saving || !note.trim()}
        style={{ marginTop: 8, width: '100%' }}
      >
        <IconNote style={{ width: 13, height: 13 }} /> {saving ? 'Saving…' : 'Save note'}
      </button>
    </div>
  );
}

function CallLogger({ uid, onLogged, showToast }: any) {
  const [outcome, setOutcome] = useState('connected');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.logCall({ uid, outcome, notes });
      setNotes('');
      setOpen(false);
      showToast('Call logged');
      onLogged();
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Log call</div>
      {!open ? (
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => setOpen(true)} style={{ width: '100%' }}>
          <IconPhone style={{ width: 13, height: 13 }} /> Log a call
        </button>
      ) : (
        <>
          <select className={styles.select} value={outcome} onChange={(e) => setOutcome(e.target.value)} style={{ marginBottom: 8 }}>
            <option value="connected">Connected</option>
            <option value="voicemail">Left voicemail</option>
            <option value="no-answer">No answer</option>
            <option value="bad-number">Bad number</option>
          </select>
          <textarea
            className={styles.textarea}
            placeholder="What did you discuss?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={save} disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving…' : 'Log'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

function EmailComposer({ uid, email, onSent, showToast }: any) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [bypass, setBypass] = useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res: any = await api.sendUserEmail({ uid, subject: subject.trim(), body: body.replace(/\n/g, '<br/>'), bypassPrefs: bypass });
      if (res.ok) {
        showToast('Email sent');
        setSubject('');
        setBody('');
        setOpen(false);
        onSent();
      } else {
        showToast('Email not sent (user may have opted out)', true);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Send email</div>
      {!email && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>No email on file</div>}
      {!open ? (
        <button
          className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`}
          onClick={() => setOpen(true)}
          disabled={!email}
          style={{ width: '100%' }}
        >
          <IconSend style={{ width: 13, height: 13 }} /> Compose
        </button>
      ) : (
        <>
          <input
            className={styles.input}
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <textarea
            className={styles.textarea}
            placeholder="Hey! Hope the app's treating you well…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ minHeight: 120 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            <input type="checkbox" checked={bypass} onChange={(e) => setBypass(e.target.checked)} />
            Send as transactional (bypasses marketing opt-out)
          </label>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`}
              onClick={send}
              disabled={sending || !subject.trim() || !body.trim()}
              style={{ flex: 1 }}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
