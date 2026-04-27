'use client';

/**
 * Reece maX consent callback page.
 *
 * Reece's onboarding flow ends by redirecting the user here AFTER they've
 * approved QuoteMate inside their maX account. Unlike OAuth callbacks for
 * Square / Xero, Reece does not append `code`/`state` query params — the
 * redirect itself is the only completion signal.
 *
 * The QuoteMate app holds the `requestToken` in its own state and calls the
 * `reeceExchangeCustomerToken` Firebase Function to swap it for a long-lived
 * customer token AS SOON AS the user closes this tab and the in-app
 * WebBrowser resolves. So this page does no work — it just confirms the
 * approval landed and tells the user to close the tab.
 */

export default function ReeceCallbackPage() {
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>&#9989;</div>
        <h1 style={{ fontSize: 22, color: '#009868', marginBottom: 8 }}>Reece approved</h1>
        <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.5, marginBottom: 24 }}>
          You can close this tab now. QuoteMate is finishing the connection — head back to the app to keep going.
        </p>
        <button
          onClick={() => window.close()}
          style={{
            padding: '12px 32px',
            backgroundColor: '#009868',
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
      </div>
    </div>
  );
}
