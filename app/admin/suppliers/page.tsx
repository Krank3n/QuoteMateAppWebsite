'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminShell from '../components/AdminShell';
import styles from '../admin.module.css';
import { api, downloadCsv, fmtDate, fmtRelative, initials } from '../lib/adminApi';
import { IconEmail, IconUsers, IconTag, IconSend, IconSupplier, IconExternal } from '../components/icons';

interface SupplierRow {
  id: string;
  name: string;
  kind: string;
  ownerUid: string | null;
  ownerEmail: string | null;
  subscriberCount: number;
  priceItemCount: number;
  lastPriceUpdate: number | null;
  tags: string[];
}

const SUPPLIER_TAGS = ['partner', 'hot-partner', 'featured', 'outdated-prices', 'do-not-contact'];

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <SuppliersPageInner />
    </Suspense>
  );
}

function SuppliersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams?.get('id') || null;

  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    api.listSuppliers({}).then((r: any) => {
      if (!cancelled) {
        setSuppliers(r.suppliers || []);
        setLoadingList(false);
      }
    }).catch(() => {
      if (!cancelled) setLoadingList(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    setLoadingDetail(true);
    api.getSupplier({ id: selectedId }).then((d) => {
      if (!cancelled) {
        setDetail(d);
        setLoadingDetail(false);
      }
    }).catch((e) => {
      if (!cancelled) {
        showToast(e?.message || 'Failed to load supplier', true);
        setLoadingDetail(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedId, refreshTick]);

  const filtered = suppliers.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.ownerEmail || '').toLowerCase().includes(q) ||
      s.kind.toLowerCase().includes(q)
    );
  });

  const selectSupplier = (id: string) => {
    const p = new URLSearchParams(searchParams?.toString());
    p.set('id', id);
    router.replace(`/admin/suppliers?${p.toString()}`);
  };

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  const [exporting, setExporting] = useState(false);
  const doExport = async () => {
    setExporting(true);
    try { await downloadCsv('suppliers'); showToast('Exported CSV'); }
    catch (e: any) { showToast(e?.message || 'Export failed', true); }
    finally { setExporting(false); }
  };

  return (
    <AdminShell
      title="Suppliers"
      breadcrumb={`${suppliers.length} supplier profiles on QuoteMate`}
      search={{ value: search, onChange: setSearch, placeholder: 'Search suppliers…' }}
      actions={
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={doExport} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      }
    >
      <div className={styles.splitView}>
        <div className={styles.splitList}>
          <div className={styles.splitListHeader}>
            <span>{loadingList ? 'Loading…' : `${filtered.length} shown`}</span>
            <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>By subscriber count</span>
          </div>
          <div className={styles.splitListScroll}>
            {loadingList ? (
              <ListSkel />
            ) : filtered.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyTitle}>No suppliers</div>
                <div className={styles.emptyText}>Nothing matches that search.</div>
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  className={`${styles.listRow} ${selectedId === s.id ? styles.listRowActive : ''}`}
                  onClick={() => selectSupplier(s.id)}
                  style={{ background: 'transparent', border: 'none', textAlign: 'left', width: '100%', cursor: 'pointer' }}
                >
                  <div className={styles.listAvatar} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                    <IconSupplier style={{ width: 16, height: 16 }} />
                  </div>
                  <div className={styles.listBody}>
                    <div className={styles.listTitle}>{s.name}</div>
                    <div className={styles.listSubtitle}>
                      {s.kind} · {s.priceItemCount} items
                    </div>
                  </div>
                  <div className={styles.listMeta}>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontSize: 14 }}>{s.subscriberCount}</div>
                    <div style={{ marginTop: 2 }}>subs</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.splitDetail}>
          {!selectedId && (
            <div className={styles.empty} style={{ padding: '80px 20px' }}>
              <div className={styles.emptyTitle}>Pick a supplier</div>
              <div className={styles.emptyText}>Drill into subscribers, prices, and owner details.</div>
            </div>
          )}
          {selectedId && loadingDetail && (
            <div className={styles.centerLoader} style={{ minHeight: 200 }}>
              <div className={styles.spinner} />
            </div>
          )}
          {selectedId && !loadingDetail && detail && (
            <SupplierDetail
              detail={detail}
              onChanged={() => setRefreshTick((n) => n + 1)}
              showToast={showToast}
            />
          )}
        </div>
      </div>

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </AdminShell>
  );
}

function ListSkel() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className={styles.listRow}>
          <div className={styles.skeleton} style={{ width: 36, height: 36, borderRadius: 18 }} />
          <div style={{ flex: 1 }}>
            <div className={styles.skeleton} style={{ height: 12, width: '60%', marginBottom: 6 }} />
            <div className={styles.skeleton} style={{ height: 10, width: '40%' }} />
          </div>
        </div>
      ))}
    </>
  );
}

function SupplierDetail({ detail, onChanged, showToast }: any) {
  const { id, supplier, owner, subscribers, priceItems, notes } = detail;
  const tags: string[] = supplier?.crmTags || [];

  return (
    <>
      <div className={styles.detailHead}>
        <div className={styles.detailAvatar} style={{ background: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }}>
          {initials(supplier.name)}
        </div>
        <div>
          <div className={styles.detailTitle}>{supplier.name}</div>
          <div className={styles.detailSubtitle}>
            <span className={styles.tag}>{supplier.kind || 'custom'}</span>
            {owner?.email && <a href={`mailto:${owner.email}`}><IconEmail style={{ width: 13, height: 13 }} /> {owner.email}</a>}
            <span><IconUsers style={{ width: 13, height: 13 }} /> {subscribers?.length || 0} subscribers</span>
            <span>{priceItems?.length || 0} price items</span>
          </div>
          <div className={styles.detailTags}>
            {tags.length === 0 ? <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No tags</span> : tags.map((t) => <span key={t} className={styles.tag}><IconTag style={{ width: 10, height: 10 }} /> {t}</span>)}
          </div>
        </div>
        <div className={styles.detailActions}>
          {owner?.email && (
            <a href={`mailto:${owner.email}`} className={`${styles.btn} ${styles.btnSecondary}`}>
              <IconEmail style={{ width: 14, height: 14 }} /> Email owner
            </a>
          )}
        </div>
      </div>

      <div className={styles.detailBody}>
        <div>
          <div className={styles.detailSection}>
            <h3>Profile</h3>
            <div className={styles.detailFactGrid}>
              <Fact label="Supplier ID" value={<code style={{ fontSize: 11 }}>{id}</code>} />
              <Fact label="Kind" value={supplier.kind || 'custom'} />
              <Fact label="Owner" value={owner?.displayName || owner?.email || '—'} />
              <Fact label="Last price update" value={fmtRelative(supplier.lastPriceUpdate)} />
              <Fact label="Subscriber count" value={(subscribers?.length || 0).toLocaleString()} />
              <Fact label="Price items" value={(priceItems?.length || 0).toLocaleString()} />
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3>Subscribers ({subscribers?.length || 0})</h3>
            {!subscribers?.length ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No tradies subscribed yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {subscribers.map((s: any) => (
                  <Link
                    key={s.uid}
                    href={`/admin/users?uid=${encodeURIComponent(s.uid)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
                      borderRadius: 10,
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div className={styles.listAvatar} style={{ width: 30, height: 30, fontSize: 11 }}>
                      {initials(s.businessName || s.email)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.businessName || s.email || s.uid.slice(0, 8)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {fmtRelative(s.subscribedAt)}
                      </div>
                    </div>
                    <IconExternal style={{ width: 12, height: 12, color: 'var(--color-text-secondary)' }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className={styles.detailSection}>
            <h3>Latest price items</h3>
            {!priceItems?.length ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No price items uploaded.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceItems.slice(0, 10).map((p: any) => (
                      <tr key={p.id} style={{ cursor: 'default' }}>
                        <td>{p.name}</td>
                        <td>{p.unit || 'each'}</td>
                        <td style={{ textAlign: 'right' }}>${(p.price || 0).toFixed(2)}</td>
                        <td>{fmtRelative(p.updatedAt?._seconds ? p.updatedAt._seconds * 1000 : p.updatedAt?.toMillis?.())}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className={styles.detailSection}>
            <h3>Admin notes</h3>
            {!notes?.length ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No notes yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map((n: any) => (
                  <div key={n.id} style={{ padding: 12, background: 'rgba(0,0,0,0.15)', borderRadius: 10, fontSize: 13 }}>
                    <div>{n.note}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      {fmtRelative(n.createdAt?._seconds ? n.createdAt._seconds * 1000 : n.createdAt?.toMillis?.())}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className={styles.rail}>
          <SupplierTagsCard id={id} tags={tags} onChanged={onChanged} showToast={showToast} />
          <SupplierNoteCard id={id} onAdded={onChanged} showToast={showToast} />
          <SupplierEmailCard id={id} ownerEmail={owner?.email} onSent={onChanged} showToast={showToast} />
        </aside>
      </div>
    </>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.detailFact}>
      <div className={styles.detailFactLabel}>{label}</div>
      <div className={styles.detailFactValue}>{value}</div>
    </div>
  );
}

function SupplierTagsCard({ id, tags, onChanged, showToast }: any) {
  const [local, setLocal] = useState<string[]>(tags);
  const [saving, setSaving] = useState(false);
  useEffect(() => setLocal(tags), [tags, id]);

  const toggle = (t: string) => setLocal((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  const changed = JSON.stringify([...local].sort()) !== JSON.stringify([...tags].sort());

  const save = async () => {
    setSaving(true);
    try {
      await api.setSupplierTags({ id, tags: local });
      showToast('Tags updated');
      onChanged();
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Tags</div>
      <div className={styles.chipRow}>
        {SUPPLIER_TAGS.map((t) => {
          const on = local.includes(t);
          return (
            <button key={t} className={styles.chip} onClick={() => toggle(t)}
              style={on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}>
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

function SupplierNoteCard({ id, onAdded, showToast }: any) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await api.addSupplierNote({ id, note: note.trim() });
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
      <textarea className={styles.textarea} placeholder="Deal terms, relationship context…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={save} disabled={saving || !note.trim()} style={{ marginTop: 8, width: '100%' }}>
        {saving ? 'Saving…' : 'Save note'}
      </button>
    </div>
  );
}

function SupplierEmailCard({ id, ownerEmail, onSent, showToast }: any) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res: any = await api.sendSupplierEmail({ id, subject: subject.trim(), body: body.replace(/\n/g, '<br/>') });
      if (res.ok) {
        showToast('Email sent');
        setSubject('');
        setBody('');
        setOpen(false);
        onSent();
      } else {
        showToast('Email not sent', true);
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed', true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.railCard}>
      <div className={styles.railTitle}>Email owner</div>
      {!ownerEmail ? (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>No owner email on file</div>
      ) : !open ? (
        <button className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} onClick={() => setOpen(true)} style={{ width: '100%' }}>
          <IconSend style={{ width: 13, height: 13 }} /> Compose
        </button>
      ) : (
        <>
          <input className={styles.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ marginBottom: 8 }} />
          <textarea className={styles.textarea} value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: 120 }} placeholder="Hey — wanted to chat about featuring your pricing on QuoteMate…" />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={send} disabled={sending || !subject.trim() || !body.trim()} style={{ flex: 1 }}>
              {sending ? 'Sending…' : 'Send'}
            </button>
            <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
