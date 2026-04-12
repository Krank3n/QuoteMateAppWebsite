'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { extractPriceList } from '../../lib/supplierService';
import styles from './portal.module.css';

export function UploadClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/portal/dashboard');
      }
      setCheckingAuth(false);
    });
  }, [router]);

  if (checkingAuth) {
    return <div className={styles.loading}>Loading...</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await extractPriceList(files, supplierName || undefined);
      // Store result in sessionStorage for the review page
      sessionStorage.setItem('extractionData', JSON.stringify(result));
      router.push('/portal/review');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Extraction failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src="/assets/favicon.png" alt="QuoteMate" className={styles.logo} />
        <h1 className={styles.title}>Supplier Portal</h1>
        <p className={styles.subtitle}>
          Upload your price list and let tradies subscribe to your latest prices
        </p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Upload Price List</h2>

        <div className={styles.field}>
          <label className={styles.label}>Business Name (optional)</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. Smith's Timber & Hardware"
            className={styles.input}
          />
        </div>

        <div
          className={`${styles.dropZone} ${files.length > 0 ? styles.dropZoneActive : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {files.length > 0 ? (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>
                {files.map((f) => f.name).join(', ')}
              </div>
            </div>
          ) : (
            <div>
              <div className={styles.uploadIcon}>+</div>
              <div style={{ fontSize: 15, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                Click to upload photos or a PDF of your price list
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                Max 10 images or 1 PDF (10 MB)
              </div>
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button
          onClick={handleSubmit}
          disabled={loading || files.length === 0}
          className={styles.button}
        >
          {loading ? 'Extracting prices...' : 'Extract Prices'}
        </button>

        <p className={styles.hint}>
          Already have an account?{' '}
          <a href="/portal/signup" className={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
