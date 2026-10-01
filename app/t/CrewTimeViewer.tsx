'use client';

import { useEffect, useState } from 'react';

const FUNCTION_URL = 'https://us-central1-hansendev.cloudfunctions.net/crewTimePage';

/**
 * Reads ?token=... and frames the Cloud Function page. The token is checked
 * for shape first, so this page can never frame an arbitrary URL.
 */
export default function CrewTimeViewer() {
  const [src, setSrc] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') || '';
    if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) {
      setInvalid(true);
      return;
    }
    setSrc(`${FUNCTION_URL}?token=${token}`);
  }, []);

  if (invalid) {
    return (
      <main style={styles.center}>
        <h1 style={styles.heading}>This link isn&apos;t working</h1>
        <p style={styles.text}>Ask your boss to send you a new one.</p>
      </main>
    );
  }

  if (!src) {
    return (
      <main style={styles.center}>
        <p style={styles.text}>Loading…</p>
      </main>
    );
  }

  return (
    <iframe
      src={src}
      title="Put your hours in"
      style={styles.frame}
      referrerPolicy="no-referrer"
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
    background: '#0f172a',
    color: '#f1f5f9',
    padding: 24,
    textAlign: 'center',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  heading: { fontSize: 24, marginBottom: 12 },
  text: { color: '#94a3b8', fontSize: 16 },
  frame: {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#0f172a',
  },
};
