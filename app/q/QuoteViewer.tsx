'use client';

import { useEffect, useState } from 'react';

const FUNCTION_URL = 'https://us-central1-hansendev.cloudfunctions.net/quoteAcceptancePage';

/**
 * Reads ?token=... (& optional action) from the URL and frames the Cloud
 * Function acceptance page. Token is validated before use so this page can
 * never become an open iframe-embedder for arbitrary sites.
 */
export default function QuoteViewer() {
  const [src, setSrc] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const action = params.get('action') || '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setInvalid(true);
      return;
    }
    const safeAction = action === 'accept' || action === 'decline' ? `&action=${action}` : '';
    setSrc(`${FUNCTION_URL}?token=${token}${safeAction}`);
  }, []);

  if (invalid) {
    return (
      <main style={styles.center}>
        <h1 style={styles.heading}>Invalid quote link</h1>
        <p style={styles.text}>This quote link is missing or invalid. Please contact the business that sent it.</p>
      </main>
    );
  }

  if (!src) {
    return (
      <main style={styles.center}>
        <p style={styles.text}>Loading your quote…</p>
      </main>
    );
  }

  return (
    <iframe
      src={src}
      title="Your quote"
      style={styles.frame}
      // The framed page only reads its own form + posts to its own origin.
      sandbox="allow-scripts allow-forms allow-same-origin"
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eef2f7',
    color: '#0f172a',
    padding: 24,
    textAlign: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  heading: { fontSize: 24, marginBottom: 12 },
  text: { color: '#64748b', fontSize: 16 },
  frame: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#eef2f7',
  },
};
