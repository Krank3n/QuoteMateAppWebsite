'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { getSupplier, type SupplierProfile } from '../../../lib/supplierService';
import styles from './poster.module.css';
import { PortalLoader } from '../PortalLoader';

export function PosterClient() {
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const downloadPdf = useCallback(async () => {
    if (!posterRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(posterRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      pdf.save(`${supplier?.name ?? 'QuoteMate'}-poster.pdf`);
    } catch {
      alert('PDF generation failed — please try again.');
    } finally {
      setSaving(false);
    }
  }, [saving, supplier?.name]);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/portal');
        return;
      }
      try {
        const sup = await getSupplier(user.uid);
        if (!sup) {
          setSupplier({
            id: user.uid,
            name: user.displayName || 'Your Business',
            ownerUid: user.uid,
            status: 'pending',
            itemCount: 0,
            subscriberCount: 0,
            createdAt: null as unknown as import('firebase/firestore').Timestamp,
            updatedAt: null as unknown as import('firebase/firestore').Timestamp,
          });
        } else {
          setSupplier(sup);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return <PortalLoader message="Loading poster..." />;
  }

  if (error || !supplier) {
    return (
      <div className={styles.loadingState}>
        <div style={{ textAlign: 'center' }}>
          <div>Could not load supplier profile</div>
          {error && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>{error}</div>}
          <button
            onClick={() => router.push('/portal/dashboard')}
            style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = `https://quotemateapp.au/join?supplier=${supplier.id}`;

  return (
    <>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button onClick={() => router.push('/portal/dashboard')} className={styles.backBtn}>
          &larr; Back to dashboard
        </button>
        <div className={styles.toolbarInfo}>
          <strong>A4 Shop Poster</strong>
          <span>Download PDF for perfect results, or Print with Margins → None</span>
        </div>
        <button onClick={() => window.print()} className={styles.secondaryBtn}>
          Print
        </button>
        <button onClick={downloadPdf} className={styles.printBtn} disabled={saving}>
          {saving ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: auto; margin: 0; }
        @media print {
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}} />

      {/* The poster itself */}
      <div className={styles.posterWrapper}>
        <div ref={posterRef} className={styles.poster}>
          {/* Top bar */}
          <div className={styles.topBar}>
            <div className={styles.topBarLeft}>
              {supplier.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={supplier.logoUrl}
                  alt={`${supplier.name} logo`}
                  className={styles.brandLogo}
                />
              ) : (
                <div className={styles.brandMark}>
                  {supplier.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={styles.supplierName}>{supplier.name}</div>
            </div>
            <div className={styles.topBarRight}>LIVE PRICING</div>
          </div>

          {/* Headline */}
          <div className={styles.headlineBlock}>
            <h1 className={styles.headline}>
              GET OUR PRICES<br />
              <span className={styles.headlineAccent}>LIVE IN YOUR POCKET</span>
            </h1>
            <p className={styles.tagline}>
              Scan to instantly sync our exact store prices into your quotes.
            </p>
          </div>

          {/* QR Section with callouts */}
          <div className={styles.qrSection}>
            <div className={styles.calloutLeft}>
              <div className={styles.calloutLabel}>SCAN TO GET</div>
              <div className={styles.calloutBig}>OUR BOOK</div>
              <div className={styles.calloutArrow}>→</div>
            </div>

            <div className={styles.qrContainer}>
              <div className={styles.qrInner}>
                <QRCodeSVG
                  value={joinUrl}
                  size={720}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  marginSize={2}
                />
              </div>
            </div>

            <div className={styles.calloutRight}>
              <div className={styles.calloutArrow}>←</div>
              <div className={styles.calloutLabel}>OUR LIVE</div>
              <div className={styles.calloutBig}>PRICE BOOK</div>
            </div>
          </div>

          {/* How it works */}
          <div className={styles.howItWorks}>
            <div className={styles.howTitle}>HOW IT WORKS — 3 SIMPLE STEPS</div>
            <div className={styles.stepsRow}>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                </div>
                <div className={styles.stepNumber}>1. SCAN</div>
                <div className={styles.stepDesc}>the QR code</div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className={styles.stepNumber}>2. GET</div>
                <div className={styles.stepDesc}>the QuoteMate app</div>
              </div>
              <div className={styles.step}>
                <div className={styles.stepIcon}>
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div className={styles.stepNumber}>3. QUOTE</div>
                <div className={styles.stepDesc}>with our prices in seconds</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.footerLeft}>
              <div className={styles.footerPowered}>Powered by</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo.png" alt="QuoteMate" className={styles.footerLogo} />
            </div>
            <div className={styles.footerTagline}>
              Quoting made easy for Australian tradies
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
