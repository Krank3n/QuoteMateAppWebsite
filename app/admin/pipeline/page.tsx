'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '../components/AdminShell';
import styles from '../admin.module.css';
import { api, fmtRelative, initials } from '../lib/adminApi';
import { IconUsers, IconEmail, IconPhone } from '../components/icons';

interface UserRow {
  uid: string;
  email: string | null;
  businessName: string | null;
  displayName: string | null;
  phone: string | null;
  lastActivityAt: number | null;
  signupAt: number | null;
  planTier: string;
  quoteCount: number;
  supplierBookCount: number;
  tags: string[];
}

interface Stage {
  id: string;
  label: string;
  hint: string;
  accent: string;
}

const STAGES: Stage[] = [
  { id: 'lead', label: 'Lead', hint: 'Signed up, no spend yet', accent: '#94a3b8' },
  { id: 'trial', label: 'Trial', hint: 'Trialing a paid plan', accent: '#60a5fa' },
  { id: 'active', label: 'Active', hint: 'Paying Pro customer', accent: '#f97316' },
  { id: 'champion', label: 'Champion', hint: 'Power user / advocate', accent: '#a78bfa' },
  { id: 'at-risk', label: 'At risk', hint: 'Activity has dropped', accent: '#fcd34d' },
  { id: 'churned', label: 'Churned', hint: 'Canceled or ghosted', accent: '#ef4444' },
];

const PIPELINE_PREFIX = 'pipeline:';
const DAY = 24 * 60 * 60 * 1000;

function classify(u: UserRow): string {
  const pipe = u.tags?.find((t) => t.startsWith(PIPELINE_PREFIX))?.slice(PIPELINE_PREFIX.length);
  if (pipe && STAGES.some((s) => s.id === pipe)) return pipe;

  // Auto-classification fallback
  if (u.planTier === 'canceled') return 'churned';
  if (u.tags?.includes('at-risk')) return 'at-risk';
  if (u.tags?.includes('champion') || u.tags?.includes('vip')) return 'champion';
  if (u.planTier === 'trialing') return 'trial';
  if (u.planTier === 'pro') {
    const days = u.lastActivityAt ? (Date.now() - u.lastActivityAt) / DAY : Infinity;
    if (days > 21) return 'at-risk';
    return 'active';
  }
  return 'lead';
}

export default function PipelinePage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.listUsers({ limit: 500 }).then((r: any) => {
      if (!cancelled) {
        setUsers(r.users || []);
        setLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const byStage = useMemo(() => {
    const bucket: Record<string, UserRow[]> = {};
    for (const s of STAGES) bucket[s.id] = [];
    const q = search.toLowerCase().trim();
    for (const u of users) {
      if (q) {
        const hay = `${u.businessName || ''} ${u.email || ''} ${u.displayName || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      bucket[classify(u)].push(u);
    }
    for (const s of STAGES) {
      bucket[s.id].sort((a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0));
    }
    return bucket;
  }, [users, search]);

  const showToast = (msg: string, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 2500);
  };

  const handleDrop = async (stage: string) => {
    const uid = dragging;
    setDragging(null);
    setDragOverStage(null);
    if (!uid) return;
    const u = users.find((x) => x.uid === uid);
    if (!u) return;
    const existing = classify(u);
    if (existing === stage) return;

    const newTags = [
      ...(u.tags || []).filter((t) => !t.startsWith(PIPELINE_PREFIX)),
      `${PIPELINE_PREFIX}${stage}`,
    ];
    // Optimistic
    setUsers((prev) => prev.map((x) => (x.uid === uid ? { ...x, tags: newTags } : x)));
    try {
      await api.setUserTags({ uid, tags: newTags });
      showToast(`Moved to ${STAGES.find((s) => s.id === stage)!.label}`);
    } catch (e: any) {
      setUsers((prev) => prev.map((x) => (x.uid === uid ? u : x)));
      showToast(e?.message || 'Move failed', true);
    }
  };

  return (
    <AdminShell
      title="Pipeline"
      breadcrumb="Drag users between stages to retag them"
      search={{ value: search, onChange: setSearch, placeholder: 'Filter users…' }}
    >
      {loading ? (
        <div className={styles.centerLoader} style={{ minHeight: 200 }}>
          <div className={styles.spinner} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(240px, 1fr))`, gap: 12, overflowX: 'auto' }}>
          {STAGES.map((s) => (
            <div
              key={s.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverStage(s.id); }}
              onDragLeave={() => setDragOverStage((cur) => (cur === s.id ? null : cur))}
              onDrop={() => handleDrop(s.id)}
              style={{
                background: dragOverStage === s.id ? 'rgba(249, 115, 22, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                border: `1px solid ${dragOverStage === s.id ? 'rgba(249, 115, 22, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: 14,
                minHeight: 'calc(100vh - 180px)',
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'all 0.12s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: s.accent }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{s.hint}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {byStage[s.id].length}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 40 }}>
                {byStage[s.id].length === 0 ? (
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', opacity: 0.5, padding: 16, textAlign: 'center' }}>
                    Drop here
                  </div>
                ) : (
                  byStage[s.id].map((u) => (
                    <PipelineCard
                      key={u.uid}
                      user={u}
                      dragging={dragging === u.uid}
                      onDragStart={() => setDragging(u.uid)}
                      onDragEnd={() => setDragging(null)}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </AdminShell>
  );
}

function PipelineCard({
  user,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  user: UserRow;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const name = user.businessName || user.displayName || user.email || user.uid.slice(0, 8);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: 'rgba(0, 0, 0, 0.22)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 10,
        padding: 12,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        transition: 'opacity 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div className={styles.listAvatar} style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
          {initials(name)}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
        <span>{user.quoteCount || 0}q</span>
        <span>{user.supplierBookCount || 0} suppliers</span>
        <span style={{ marginLeft: 'auto' }}>{fmtRelative(user.lastActivityAt)}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Link
          href={`/admin/users?uid=${encodeURIComponent(user.uid)}`}
          className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
          style={{ flex: 1, justifyContent: 'center' }}
          draggable={false}
        >
          <IconUsers style={{ width: 12, height: 12 }} /> Open
        </Link>
        {user.email && (
          <a
            href={`mailto:${user.email}`}
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
            draggable={false}
          >
            <IconEmail style={{ width: 12, height: 12 }} />
          </a>
        )}
        {user.phone && (
          <a
            href={`tel:${user.phone}`}
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
            draggable={false}
          >
            <IconPhone style={{ width: 12, height: 12 }} />
          </a>
        )}
      </div>
    </div>
  );
}
