'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import styles from '../admin.module.css';
import {
  IconDashboard,
  IconUsers,
  IconSupplier,
  IconCampaign,
  IconFeedback,
  IconPipeline,
  IconAffiliate,
  IconSearch,
  IconLogout,
  IconSubscription,
} from './icons';
import { initials } from '../lib/adminApi';

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AdminShellProps {
  children: ReactNode;
  title?: string;
  breadcrumb?: string;
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  actions?: ReactNode;
}

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: IconDashboard },
  { href: '/admin/users', label: 'Users', Icon: IconUsers },
  { href: '/admin/suppliers', label: 'Suppliers', Icon: IconSupplier },
  { href: '/admin/pipeline', label: 'Pipeline', Icon: IconPipeline },
  { href: '/admin/campaigns', label: 'Campaigns', Icon: IconCampaign },
  { href: '/admin/feedback', label: 'Feedback', Icon: IconFeedback },
  { href: '/admin/subscriptions', label: 'Subscriptions', Icon: IconSubscription },
  { href: '/admin/affiliates', label: 'Affiliates', Icon: IconAffiliate },
];

export default function AdminShell({
  children,
  title,
  breadcrumb,
  search,
  actions,
}: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setIsAdmin(false);
        setReady(true);
        router.replace('/admin/login');
        return;
      }
      const token = await u.getIdTokenResult(true);
      const admin = token.claims.admin === true;
      setUser({ uid: u.uid, email: u.email, displayName: u.displayName });
      setIsAdmin(admin);
      setReady(true);
    });
    return () => unsub();
  }, [router]);

  if (!ready) {
    return (
      <div className={styles.centerLoader}>
        <div className={styles.spinner} />
        <div>Loading admin…</div>
      </div>
    );
  }

  if (!user) {
    // router.replace already fired — render nothing while navigating
    return null;
  }

  if (!isAdmin) {
    return (
      <div className={styles.denied}>
        <div className={styles.deniedTitle}>Access denied</div>
        <p className={styles.deniedSub}>
          Your account <code>{user.email}</code> isn't an admin. Sign out and sign in with an admin account.
        </p>
        <button
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={async () => {
            await signOut(auth);
            router.replace('/admin/login');
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogo}>Q</div>
          <div className={styles.brandText}>QuoteMate</div>
          <div className={styles.brandTag}>CRM</div>
        </div>
        <div className={styles.navSection}>Workspace</div>
        {NAV.map(({ href, label, Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname?.startsWith(href);
          return (
            <Link key={href} href={href} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
              <Icon className={styles.navIcon} />
              <span>{label}</span>
            </Link>
          );
        })}
        <div className={styles.sidebarFoot}>
          <div>Signed in as</div>
          <div style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
            {user.email}
          </div>
          <button
            className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
            style={{ marginTop: 6, justifyContent: 'flex-start' }}
            onClick={async () => {
              await signOut(auth);
              router.replace('/admin/login');
            }}
          >
            <IconLogout style={{ width: 14, height: 14 }} />
            Sign out
          </button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div>
            {breadcrumb && <div className={styles.topbarCrumb}>{breadcrumb}</div>}
            <div className={styles.topbarTitle}>{title || 'Admin'}</div>
          </div>
          {search && (
            <div className={styles.search}>
              <IconSearch className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder={search.placeholder || 'Search…'}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
              />
              <span className={styles.kbdHint}>⌘K</span>
            </div>
          )}
          {actions}
          <div className={styles.avatarPill}>
            <div className={styles.avatar}>{initials(user.displayName || user.email)}</div>
            <span>{user.displayName || user.email?.split('@')[0]}</span>
          </div>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
