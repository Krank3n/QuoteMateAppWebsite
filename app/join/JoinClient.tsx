'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const FUNCTIONS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function JoinClient() {
  const searchParams = useSearchParams();
  const supplierId = searchParams.get('supplier');
  const [supplierName, setSupplierName] = useState('Your local supplier');

  useEffect(() => {
    if (!supplierId) return;

    // Try to open the app via custom scheme
    window.location.href = `quotemate://join?supplier=${encodeURIComponent(supplierId)}`;

    fetch(`${FUNCTIONS_BASE}/createPendingLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId }),
    }).catch(() => {
      // Best-effort — link will be created on app install if this fails
    });

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'hansendev';
    fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/suppliers/${supplierId}`
    )
      .then((r) => r.json())
      .then((doc) => {
        if (doc.fields?.name?.stringValue) {
          setSupplierName(doc.fields.name.stringValue);
        }
      })
      .catch(() => {
        // Non-critical — falls back to default supplier name
      });
  }, [supplierId]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <img
          src="/assets/favicon.png"
          alt="QuoteMate"
          width={80}
          height={80}
          style={styles.logo}
        />
        <h1 style={styles.title}>Get Live Prices</h1>
        <p style={styles.supplierName}>{supplierName}</p>
        <p style={styles.description}>
          Download QuoteMate to subscribe and get this supplier&apos;s latest prices
          synced straight into your quotes.
        </p>
        <div style={styles.buttons}>
          <a
            href="https://apps.apple.com/au/app/quotemate/id6738030590"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.button, ...styles.iosButton }}
          >
            <AppleIcon />
            App Store
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.quotemate.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...styles.button, ...styles.androidButton }}
          >
            <PlayIcon />
            Google Play
          </a>
        </div>
        <p style={styles.tagline}>Quoting made easy for Australian tradies</p>
      </div>
    </div>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.18 23.77L14.27 12.68 3.18.23C2.58.68 2.18 1.4 2.18 2.23v19.54c0 .83.4 1.55 1 2zM18.85 10.39l-3.18-1.84-3.69 3.69 3.69 3.69 3.18-1.84c.95-.55.95-1.96 0-2.5v-.02l-.01-.01.01-.01v-.16zM5.41 1.26L15.58 7.2l-2.84 2.84L5.41 1.26zM5.41 22.74l7.33-8.78 2.84 2.84-10.17 5.94z" />
    </svg>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    maxWidth: 400,
    padding: '32px 24px',
    textAlign: 'center',
  },
  logo: {
    borderRadius: 18,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  supplierName: {
    color: '#f97316',
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 16,
  },
  description: {
    color: '#94a3b8',
    fontSize: 16,
    lineHeight: 1.6,
    marginBottom: 32,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '14px 24px',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'opacity 0.2s',
  },
  iosButton: {
    background: '#fff',
    color: '#000',
  },
  androidButton: {
    background: '#34a853',
    color: '#fff',
  },
  tagline: {
    color: '#64748b',
    fontSize: 13,
  },
};
