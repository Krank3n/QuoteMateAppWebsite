'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SquareCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [merchantName, setMerchantName] = useState('');
  const [env, setEnv] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage('Square authorisation was denied or cancelled. Please try again from the app.');
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Invalid callback. Missing authorisation code.');
      return;
    }

    (async () => {
      try {
        const response = await fetch('https://us-central1-hansendev.cloudfunctions.net/squareCallback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMerchantName(data.merchantName || 'your Square account');
          setEnv(data.env || '');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to connect to Square. Please try again.');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    })();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0F172A',
      padding: 20,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        background: '#1E293B',
        borderRadius: 16,
        padding: 40,
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#128179;</div>
            <h1 style={{ fontSize: 22, color: '#E2E8F0', marginBottom: 8 }}>Connecting to Square...</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              Please wait while we set up the connection.
            </p>
            <div style={{
              width: 40,
              height: 40,
              border: '4px solid #334155',
              borderTopColor: '#006AFF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '20px auto',
            }} />
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
            <h1 style={{ fontSize: 22, color: '#006AFF', marginBottom: 8 }}>Connected!</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              Your Square account <strong style={{ color: '#E2E8F0' }}>{merchantName}</strong>
              {env && env !== 'production' && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#92400E',
                  background: '#FEF3C7',
                  borderRadius: 999,
                  marginLeft: 6,
                }}>
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </span>
              )}
              {' '}is now linked to QuoteMate. Online payments on your invoices will flow straight to Square.
            </p>
            <button
              onClick={() => window.close()}
              style={{
                marginTop: 12,
                padding: '12px 32px',
                backgroundColor: '#006AFF',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Return to App
            </button>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 12 }}>
              If the button doesn&apos;t work, just close this tab.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10060;</div>
            <h1 style={{ fontSize: 22, color: '#EF4444', marginBottom: 8 }}>Connection Failed</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              {errorMessage}
            </p>
            <button
              onClick={() => window.close()}
              style={{
                marginTop: 12,
                padding: '12px 32px',
                backgroundColor: '#334155',
                color: '#E2E8F0',
                border: '1px solid #475569',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                width: '100%',
              }}
            >
              Close and Try Again
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function SquareCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        color: '#94A3B8',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        Connecting to Square...
      </div>
    }>
      <SquareCallbackContent />
    </Suspense>
  );
}
