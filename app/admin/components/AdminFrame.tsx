'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import styles from '../admin.module.css';
import CommandPalette from './CommandPalette';
import { PageMetaProvider, usePageMeta } from '../lib/pageMeta';
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
  IconEmail,
} from './icons';
import { initials } from '../lib/adminApi';

const NAV = [
  { href: '/admin', label: 'Dashboard', Icon: IconDashboard },
  { href: '/admin/users', label: 'Users', Icon: IconUsers },
  { href: '/admin/suppliers', label: 'Suppliers', Icon: IconSupplier },
  { href: '/admin/pipeline', label: 'Pipeline', Icon: IconPipeline },
  { href: '/admin/campaigns', label: 'Campaigns', Icon: IconCampaign },
  { href: '/admin/emails', label: 'Email log', Icon: IconEmail },
  { href: '/admin/feedback', label: 'Feedback', Icon: IconFeedback },
  { href: '/admin/subscriptions', label: 'Subscriptions', Icon: IconSubscription },
  { href: '/admin/affiliates', label: 'Affiliates', Icon: IconAffiliate },
];

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Paths that should NOT be wrapped in the shell (login screen, impersonation view).
function shouldBypassShell(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) return true;
  if (pathname === '/admin/impersonate' || pathname.startsWith('/admin/impersonate/')) return true;
  return false;
}

export default function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (shouldBypassShell(pathname)) {
    return <>{children}</>;
  }
  return (
    <PageMetaProvider>
      <AuthGatedShell>{children}</AuthGatedShell>
    </PageMetaProvider>
  );
}

function AuthGatedShell({ children }: { children: ReactNode }) {
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

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className={styles.denied}>
        <div className={styles.deniedTitle}>Access denied</div>
        <p className={styles.deniedSub}>
          Your account <code>{user.email}</code> isn't an admin.
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
            <Link key={href} href={href} prefetch className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
              <Icon className={styles.navIcon} />
              <span>{label}</span>
            </Link>
          );
        })}
        <div className={styles.sidebarFoot}>
          <div>Signed in as</div>
          <div style={{ color: 'var(--color-text-tertiary)', fontWeight: 500 }}>{user.email}</div>
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
        <PersistentTopbar user={user} />
        <main className={styles.main}>{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}

function PersistentTopbar({ user }: { user: AdminUser }) {
  const meta = usePageMeta();
  return (
    <header className={styles.topbar}>
      <div>
        {meta.breadcrumb && <div className={styles.topbarCrumb}>{meta.breadcrumb}</div>}
        <div className={styles.topbarTitle}>{meta.title || 'Admin'}</div>
      </div>
      {meta.search && (
        <div className={styles.search}>
          <IconSearch className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={meta.search.placeholder || 'Search…'}
            value={meta.search.value}
            onChange={(e) => meta.search!.onChange(e.target.value)}
          />
          <span className={styles.kbdHint}>⌘K</span>
        </div>
      )}
      {meta.actions}
      <div className={styles.avatarPill}>
        <div className={styles.avatar}>{initials(user.displayName || user.email)}</div>
        <span>{user.displayName || user.email?.split('@')[0]}</span>
      </div>
    </header>
  );
}
