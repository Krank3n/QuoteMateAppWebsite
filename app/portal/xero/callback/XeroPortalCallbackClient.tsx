'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from '../../portal.module.css';
import { PortalLoader } from '../../PortalLoader';

const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || '';

function Inner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [tenantName, setTenantName] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage('Xero authorisation was cancelled.');
      return;
    }
    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Invalid callback. Missing authorisation code.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${FUNCTIONS_BASE}/xeroCallbackPortal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setTenantName(data.tenantName || '');
          setTimeout(() => router.replace('/portal/dashboard'), 1500);
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to connect to Xero.');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error. Please try again.');
      }
    })();
  }, [searchParams, router]);

  return (
    <div className={styles.container}>
      <div className={styles.card} style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <h1 className={styles.title}>Connecting to Xero...</h1>
            <p className={styles.subtitle}>Please wait while we set up the connection.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className={styles.title} style={{ color: '#22c55e' }}>Connected!</h1>
            <p className={styles.subtitle}>
              {tenantName
                ? <>Synced with <strong>{tenantName}</strong>. Redirecting to your dashboard...</>
                : 'Redirecting to your dashboard...'}
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className={styles.title} style={{ color: '#ef4444' }}>Connection Failed</h1>
            <p className={styles.subtitle}>{errorMessage}</p>
            <button
              onClick={() => router.replace('/portal/dashboard')}
              className={styles.button}
              style={{ marginTop: 20 }}
            >
              Back to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function XeroPortalCallbackClient() {
  return (
    <Suspense fallback={<PortalLoader message="Connecting to Xero..." />}>
      <Inner />
    </Suspense>
  );
}
