'use client';

/**
 * Google Calendar OAuth landing page. Google redirects the tradie here
 * after the consent screen (web connect only — the native apps finish
 * OAuth in-app). We POST { code, state } to the googleCalendarCallback
 * function, which exchanges the code server-side and stores the grant,
 * then send the tradie back into the web app. Mirrors app/square/callback.
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const CALLBACK_FN = 'https://us-central1-hansendev.cloudfunctions.net/googleCalendarCallback';
const APP_URL = '/app/';

function GoogleCalendarCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setStatus('error');
      setErrorMessage(
        errorParam === 'access_denied'
          ? 'Google access was cancelled. Nothing was connected — head back to the app and try again whenever you like.'
          : 'Google returned an error. Please head back to the app and try again.',
      );
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Invalid callback. Missing authorisation code.');
      return;
    }

    (async () => {
      try {
        const response = await fetch(CALLBACK_FN, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setStatus('success');
          setEmail(data.email || '');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to connect Google Calendar. Please try again.');
        }
      } catch {
        setStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    })();
  }, [searchParams]);

  const buttonStyle = (bg: string, fg: string, border = 'none') => ({
    marginTop: 12,
    padding: '12px 32px',
    backgroundColor: bg,
    color: fg,
    border,
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    textDecoration: 'none',
    display: 'inline-block',
    boxSizing: 'border-box' as const,
  });

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
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#128197;</div>
            <h1 style={{ fontSize: 22, color: '#E2E8F0', marginBottom: 8 }}>Connecting Google Calendar…</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              Please wait while we set up the connection.
            </p>
            <div style={{
              width: 40,
              height: 40,
              border: '4px solid #334155',
              borderTopColor: '#4285F4',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '20px auto',
            }} />
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
            <h1 style={{ fontSize: 22, color: '#4ADE80', marginBottom: 8 }}>Google Calendar connected</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              {email ? (
                <>
                  <strong style={{ color: '#E2E8F0' }}>{email}</strong> is now linked to QuoteMate.
                </>
              ) : (
                'Your Google Calendar is now linked to QuoteMate.'
              )}
              {' '}Job schedules will show up in your calendar automatically, and reschedules move the event with them.
            </p>
            <a href={APP_URL} style={buttonStyle('#4285F4', 'white')}>
              Back to QuoteMate
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>&#10060;</div>
            <h1 style={{ fontSize: 22, color: '#EF4444', marginBottom: 8 }}>Connection failed</h1>
            <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              {errorMessage}
            </p>
            <a href={APP_URL} style={buttonStyle('#334155', '#E2E8F0', '1px solid #475569')}>
              Back to QuoteMate
            </a>
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

export default function GoogleCalendarCallbackPage() {
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
        Connecting Google Calendar…
      </div>
    }>
      <GoogleCalendarCallbackContent />
    </Suspense>
  );
}
