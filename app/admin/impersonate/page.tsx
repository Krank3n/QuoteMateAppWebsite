'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import styles from '../admin.module.css';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

const SECONDARY_APP_NAME = 'impersonation';

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<div className={styles.centerLoader}><div className={styles.spinner} /></div>}>
      <ImpersonateInner />
    </Suspense>
  );
}

function ImpersonateInner() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const uid = searchParams?.get('uid') || '';
  const email = searchParams?.get('email') || '';

  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);

  useEffect(() => {
    if (!token) { setError('Missing impersonation token.'); return; }
    let cancelled = false;
    (async () => {
      try {
        // Tear down any prior impersonation app so a fresh sign-in works on re-visit.
        const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
        if (existing) await deleteApp(existing);
        const app = initializeApp(firebaseConfig, SECONDARY_APP_NAME);
        const auth = getAuth(app);
        await signInWithCustomToken(auth, token);
        if (cancelled) return;
        setSignedIn(true);

        const firestore = getFirestore(app);
        const [biz, sub, quotes, invoices] = await Promise.all([
          getDoc(doc(firestore, `users/${uid}/settings/business`)),
          getDoc(doc(firestore, `users/${uid}/profile/subscription`)),
          getDocs(query(collection(firestore, `users/${uid}/quotes`), orderBy('createdAt', 'desc'), limit(10))).catch(() => null),
          getDocs(query(collection(firestore, `users/${uid}/invoices`), orderBy('createdAt', 'desc'), limit(10))).catch(() => null),
        ]);

        if (cancelled) return;
        setSnapshot({
          business: biz.data() || {},
          subscription: sub.data() || {},
          quotes: quotes?.docs.map((d) => ({ id: d.id, ...d.data() })) || [],
          invoices: invoices?.docs.map((d) => ({ id: d.id, ...d.data() })) || [],
        });
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Impersonation failed');
      }
    })();
    return () => { cancelled = true; };
  }, [token, uid]);

  const endSession = async () => {
    const app = getApps().find((a) => a.name === SECONDARY_APP_NAME);
    if (app) {
      try { await signOut(getAuth(app)); } catch {}
      try { await deleteApp(app); } catch {}
    }
    window.close();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-darkest)', color: 'var(--color-text-primary)', padding: '24px' }}>
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 12,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 18,
          }}>!</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Impersonation session</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
              You're reading Firestore as <code>{email || uid}</code>. This tab holds their auth session — your admin session is untouched in the other tab.
            </div>
          </div>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={endSession}>End session</button>
        </div>

        {error && (
          <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
            <div className={styles.cardTitle}>Couldn't impersonate</div>
            <div className={styles.cardSubtitle}>{error}</div>
          </div>
        )}

        {!signedIn && !error && (
          <div className={styles.centerLoader} style={{ minHeight: 180 }}>
            <div className={styles.spinner} />
            <div>Signing in as user…</div>
          </div>
        )}

        {snapshot && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Business profile</div>
              <pre style={preStyle}>{JSON.stringify(snapshot.business, null, 2)}</pre>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Subscription</div>
              <pre style={preStyle}>{JSON.stringify(snapshot.subscription, null, 2)}</pre>
            </div>
            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.cardTitle}>Recent quotes ({snapshot.quotes.length})</div>
              {snapshot.quotes.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No quotes.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Customer</th><th>Title</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                    </thead>
                    <tbody>
                      {snapshot.quotes.map((q: any) => (
                        <tr key={q.id} style={{ cursor: 'default' }}>
                          <td>{q.customerName || '—'}</td>
                          <td>{q.title || q.id}</td>
                          <td>{q.status || '—'}</td>
                          <td style={{ textAlign: 'right' }}>${(q.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <div className={styles.cardTitle}>Recent invoices ({snapshot.invoices.length})</div>
              {snapshot.invoices.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No invoices.</div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr><th>Customer</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr>
                    </thead>
                    <tbody>
                      {snapshot.invoices.map((i: any) => (
                        <tr key={i.id} style={{ cursor: 'default' }}>
                          <td>{i.customerName || '—'}</td>
                          <td>{i.status || '—'}</td>
                          <td style={{ textAlign: 'right' }}>${(i.total || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
  background: 'rgba(0, 0, 0, 0.3)',
  padding: 12,
  borderRadius: 8,
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  margin: 0,
};
