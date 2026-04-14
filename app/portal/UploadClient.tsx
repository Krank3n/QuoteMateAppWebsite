'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { extractPriceList } from '../../lib/supplierService';
import type { ExtractedItem, ExtractionResult } from '../../lib/supplierService';
import styles from './portal.module.css';
import { PortalLoader } from './PortalLoader';

type ImportMethod = 'photo' | 'csv' | 'paste';

function parseUnit(raw: string | undefined): string {
  if (!raw) return 'each';
  const lower = raw.toLowerCase().trim();
  const unitMap: Record<string, string> = {
    each: 'each', ea: 'each', unit: 'each', pce: 'each', pc: 'each', piece: 'each',
    m: 'm', metre: 'm', meter: 'm', lm: 'm',
    'm²': 'm²', m2: 'm²', sqm: 'm²',
    'm³': 'm³', m3: 'm³', cbm: 'm³',
    l: 'L', litre: 'L', liter: 'L',
    kg: 'kg', kilo: 'kg',
    box: 'box', bx: 'box',
    pack: 'pack', pk: 'pack', pkt: 'pack',
  };
  return unitMap[lower] || 'each';
}

function parsePrice(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseTabularData(rows: string[][]): ExtractedItem[] {
  if (rows.length === 0) return [];

  // Try to detect header row and column mapping
  const firstRow = rows[0].map(c => c.toLowerCase().trim());
  let nameCol = -1;
  let priceCol = -1;
  let unitCol = -1;
  let startRow = 0;

  // Check if first row looks like a header
  const headerPatterns = {
    name: ['name', 'product', 'item', 'description', 'desc', 'material'],
    price: ['price', 'cost', 'rate', 'amount', 'unit price', 'each', '$'],
    unit: ['unit', 'uom', 'measure', 'qty unit'],
  };

  for (let i = 0; i < firstRow.length; i++) {
    const cell = firstRow[i];
    if (headerPatterns.name.some(p => cell.includes(p))) nameCol = i;
    if (headerPatterns.price.some(p => cell.includes(p))) priceCol = i;
    if (headerPatterns.unit.some(p => cell.includes(p))) unitCol = i;
  }

  if (nameCol >= 0 || priceCol >= 0) {
    startRow = 1; // Skip header
  }

  // If no header detected, assume: col 0 = name, col 1 = price, col 2 = unit (if exists)
  if (nameCol < 0) nameCol = 0;
  if (priceCol < 0) priceCol = rows[0].length > 1 ? 1 : -1;
  if (unitCol < 0 && rows[0].length > 2) unitCol = 2;

  const items: ExtractedItem[] = [];

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameCol]?.trim();
    if (!name) continue;

    const price = priceCol >= 0 ? parsePrice(row[priceCol]) : null;
    const unit = unitCol >= 0 ? parseUnit(row[unitCol]) : 'each';

    items.push({
      name,
      price,
      unit,
      keywords: name.toLowerCase().split(/\s+/).filter(w => w.length > 2),
      confidence: price != null ? 'high' : 'medium',
      rawLine: row.join(' | '),
    });
  }

  return items;
}

export function UploadClient() {
  const [method, setMethod] = useState<ImportMethod>('photo');
  const [files, setFiles] = useState<File[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
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
    return <PortalLoader />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setCsvFile(e.target.files[0]);
      setError('');
    }
  };

  const navigateToReview = (result: ExtractionResult) => {
    sessionStorage.setItem('extractionData', JSON.stringify(result));
    router.push('/portal/review');
  };

  const handlePhotoSubmit = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await extractPriceList(files, supplierName || undefined);
      navigateToReview(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Extraction failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvSubmit = async () => {
    if (!csvFile) {
      setError('Please select a CSV or Excel file');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const XLSX = await import('xlsx');
      const buffer = await csvFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      const items = parseTabularData(rows);
      if (items.length === 0) {
        setError('No items found in the file. Make sure it has product names and prices.');
        return;
      }

      navigateToReview({
        supplierName: supplierName || '',
        supplierContact: null,
        items,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse file.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSubmit = () => {
    const trimmed = pasteText.trim();
    if (!trimmed) {
      setError('Please paste your price list data');
      return;
    }
    setError('');

    const lines = trimmed.split('\n').filter(l => l.trim());
    const rows = lines.map(line => {
      // Detect tab-separated first, then comma-separated
      if (line.includes('\t')) return line.split('\t');
      return line.split(',').map(c => c.trim());
    });

    const items = parseTabularData(rows);
    if (items.length === 0) {
      setError('No items found. Make sure each line has a product name and optionally a price.');
      return;
    }

    navigateToReview({
      supplierName: supplierName || '',
      supplierContact: null,
      items,
    });
  };

  const tabs: { key: ImportMethod; label: string }[] = [
    { key: 'photo', label: 'Photo / PDF' },
    { key: 'csv', label: 'CSV / Excel' },
    { key: 'paste', label: 'Paste Data' },
  ];

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
        <h2 className={styles.cardTitle}>Import Price List</h2>

        <div className={styles.tabBar}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setMethod(tab.key); setError(''); }}
              className={`${styles.tab} ${method === tab.key ? styles.tabActive : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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

        {method === 'photo' && (
          <>
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

            <button
              onClick={handlePhotoSubmit}
              disabled={loading || files.length === 0}
              className={styles.button}
            >
              {loading ? 'Extracting prices...' : 'Extract Prices'}
            </button>
          </>
        )}

        {method === 'csv' && (
          <>
            <div
              className={`${styles.dropZone} ${csvFile ? styles.dropZoneActive : ''}`}
              onClick={() => csvInputRef.current?.click()}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleCsvChange}
                style={{ display: 'none' }}
              />
              {csvFile ? (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 4 }}>
                    {csvFile.name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {(csvFile.size / 1024).toFixed(0)} KB
                  </div>
                </div>
              ) : (
                <div>
                  <div className={styles.uploadIcon}>+</div>
                  <div style={{ fontSize: 15, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                    Click to upload a CSV or Excel file
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                    .csv, .xlsx, or .xls
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleCsvSubmit}
              disabled={loading || !csvFile}
              className={styles.button}
            >
              {loading ? 'Parsing file...' : 'Import Items'}
            </button>
          </>
        )}

        {method === 'paste' && (
          <>
            <textarea
              value={pasteText}
              onChange={(e) => { setPasteText(e.target.value); setError(''); }}
              placeholder={`Paste your price list here, e.g.\n\nProduct Name\tPrice\tUnit\n90x45 Treated Pine\t8.50\teach\nHardwood Decking 86x19\t6.20\tm\nConcrete Mix 20kg\t9.95\tbag`}
              className={styles.textarea}
              rows={10}
            />
            <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginBottom: 12 }}>
              Tab-separated or comma-separated. First row can be a header.
            </div>

            <button
              onClick={handlePasteSubmit}
              disabled={loading || !pasteText.trim()}
              className={styles.button}
            >
              Import Items
            </button>
          </>
        )}

        {error && <div className={styles.error}>{error}</div>}

        <p className={styles.hint}>
          Already have an account?{' '}
          <a href="/portal/signup" className={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}
