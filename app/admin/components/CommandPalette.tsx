'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';
import { api, initials } from '../lib/adminApi';
import {
  IconDashboard,
  IconUsers,
  IconSupplier,
  IconCampaign,
  IconFeedback,
  IconPipeline,
  IconAffiliate,
  IconSubscription,
  IconSearch,
} from './icons';

interface Item {
  id: string;
  kind: 'user' | 'supplier' | 'page';
  title: string;
  subtitle?: string;
  href: string;
  Icon?: React.ComponentType<{ style?: React.CSSProperties }>;
  keywords?: string;
}

const PAGES: Item[] = [
  { id: 'p-dash', kind: 'page', title: 'Dashboard', href: '/admin', Icon: IconDashboard, keywords: 'home overview' },
  { id: 'p-users', kind: 'page', title: 'Users', href: '/admin/users', Icon: IconUsers, keywords: 'tradies customers accounts' },
  { id: 'p-suppliers', kind: 'page', title: 'Suppliers', href: '/admin/suppliers', Icon: IconSupplier, keywords: 'stores vendors' },
  { id: 'p-pipeline', kind: 'page', title: 'Pipeline', href: '/admin/pipeline', Icon: IconPipeline, keywords: 'kanban stages' },
  { id: 'p-campaigns', kind: 'page', title: 'Campaigns', href: '/admin/campaigns', Icon: IconCampaign, keywords: 'email broadcast' },
  { id: 'p-feedback', kind: 'page', title: 'Feedback', href: '/admin/feedback', Icon: IconFeedback, keywords: 'reviews inbox' },
  { id: 'p-subscriptions', kind: 'page', title: 'Subscriptions', href: '/admin/subscriptions', Icon: IconSubscription, keywords: 'revenue mrr billing pro' },
  { id: 'p-affiliates', kind: 'page', title: 'Affiliates', href: '/admin/affiliates', Icon: IconAffiliate, keywords: 'referrals earnings' },
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Global hotkey: cmd+k / ctrl+k toggles, esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // "/" focuses when not in an input
      if (e.key === '/' && !isTypingInInput()) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lazy-load users + suppliers the first time the palette opens
  useEffect(() => {
    if (!open) return;
    setCursor(0);
    setQuery('');
    setTimeout(() => inputRef.current?.focus(), 50);
    if (users.length || suppliers.length) return;
    setLoading(true);
    Promise.all([api.listUsers({ limit: 500 }), api.listSuppliers({})])
      .then(([u, s]: any) => {
        setUsers(u?.users || []);
        setSuppliers(s?.suppliers || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, users.length, suppliers.length]);

  const items: Item[] = useMemo(() => {
    const q = query.toLowerCase().trim();
    const userItems: Item[] = users.map((u: any) => ({
      id: `u-${u.uid}`,
      kind: 'user',
      title: u.businessName || u.displayName || u.email || u.uid,
      subtitle: [u.email, u.phone].filter(Boolean).join(' · '),
      href: `/admin/users?uid=${encodeURIComponent(u.uid)}`,
      keywords: [u.businessName, u.displayName, u.email, u.phone, u.uid].filter(Boolean).join(' ').toLowerCase(),
    }));
    const supplierItems: Item[] = suppliers.map((s: any) => ({
      id: `s-${s.id}`,
      kind: 'supplier',
      title: s.name,
      subtitle: `${s.subscriberCount} subscribers · ${s.kind}`,
      href: `/admin/suppliers?id=${encodeURIComponent(s.id)}`,
      Icon: IconSupplier,
      keywords: `${s.name} ${s.kind} ${s.ownerEmail || ''}`.toLowerCase(),
    }));
    const all = [...PAGES, ...userItems, ...supplierItems];
    if (!q) return all.slice(0, 40);
    const scored = all
      .map((it) => {
        const hay = `${it.title} ${it.subtitle || ''} ${it.keywords || ''}`.toLowerCase();
        let score = 0;
        if (it.title.toLowerCase().startsWith(q)) score += 100;
        if (hay.includes(q)) score += 40;
        const tokens = q.split(/\s+/);
        for (const t of tokens) if (hay.includes(t)) score += 10;
        return { it, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60)
      .map((x) => x.it);
    return scored;
  }, [query, users, suppliers]);

  useEffect(() => {
    if (cursor >= items.length) setCursor(Math.max(0, items.length - 1));
  }, [items.length, cursor]);

  useEffect(() => {
    // Scroll cursor into view
    const el = listRef.current?.querySelector<HTMLDivElement>(`[data-idx="${cursor}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[cursor]; if (it) go(it.href); }
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10vh 20px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#0B1220',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <IconSearch style={{ width: 18, height: 18, color: 'var(--color-text-secondary)' }} />
          <input
            ref={inputRef}
            className={styles.input}
            style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 16 }}
            placeholder="Jump to user, supplier, or page…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKey}
          />
          <span className={styles.kbdHint} style={{ position: 'static', transform: 'none' }}>esc</span>
        </div>
        <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
          {loading && (
            <div className={styles.centerLoader} style={{ minHeight: 120 }}>
              <div className={styles.spinner} />
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>No matches</div>
              <div className={styles.emptyText}>Try a different query.</div>
            </div>
          )}
          {!loading && items.map((it, idx) => {
            const isActive = idx === cursor;
            return (
              <div
                key={it.id}
                data-idx={idx}
                onMouseEnter={() => setCursor(idx)}
                onClick={() => go(it.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(249, 115, 22, 0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--color-accent)' : '3px solid transparent',
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: it.kind === 'page'
                    ? 'rgba(249, 115, 22, 0.12)'
                    : it.kind === 'supplier'
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'rgba(168, 85, 247, 0.12)',
                  color: it.kind === 'page'
                    ? 'var(--color-accent-light)'
                    : it.kind === 'supplier'
                    ? '#60a5fa'
                    : '#d8b4fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}>
                  {it.Icon ? <it.Icon style={{ width: 16, height: 16 }} /> : initials(it.title)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text-primary)' }}>
                    {it.title}
                  </div>
                  {it.subtitle && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {it.subtitle}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{it.kind}</span>
              </div>
            );
          })}
        </div>
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: 11,
          color: 'var(--color-text-secondary)',
          display: 'flex',
          gap: 14,
        }}>
          <span><kbd style={kbd}>↑↓</kbd> navigate</span>
          <span><kbd style={kbd}>↵</kbd> open</span>
          <span><kbd style={kbd}>⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = {
  padding: '1px 5px',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 4,
  fontFamily: 'ui-monospace, monospace',
  fontSize: 10,
  marginRight: 4,
};

function isTypingInInput(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}
