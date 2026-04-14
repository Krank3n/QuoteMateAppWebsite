'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../../../lib/firebase';
import {
  getSupplier,
  getPriceItems,
  createOrUpdateSupplier,
  savePriceItems,
  deletePriceItem,
  bulkUpdatePriceItems,
  extractPriceList,
  uploadSupplierLogo,
  startXeroConnect,
  getXeroStatus,
  disconnectXero,
  importXeroItems,
  type SupplierProfile,
  type ExtractedItem,
  type XeroConnectionStatus,
} from '../../../lib/supplierService';
import styles from '../portal.module.css';
import { PortalLoader } from '../PortalLoader';

export function DashboardClient() {
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null);
  const [items, setItems] = useState<(ExtractedItem & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [supplierId, setSupplierId] = useState('');
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  // Bulk edit state
  const [bulkEditing, setBulkEditing] = useState(false);
  const [bulkDrafts, setBulkDrafts] = useState<Record<string, Partial<ExtractedItem>>>({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Xero state
  const [xeroStatus, setXeroStatus] = useState<XeroConnectionStatus>({ connected: false });
  const [xeroBusy, setXeroBusy] = useState(false);
  const [xeroError, setXeroError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/portal');
      } else {
        setSupplierId(user.uid);
      }
      setCheckingAuth(false);
    });
  }, [router]);

  useEffect(() => {
    if (supplierId) loadData();
  }, [supplierId]);

  const joinUrl = `https://quotemateapp.au/join?supplier=${supplierId}`;

  const loadData = async () => {
    if (!supplierId) return;
    setLoading(true);
    try {
      const [sup, priceItems, xero] = await Promise.all([
        getSupplier(supplierId),
        getPriceItems(supplierId),
        getXeroStatus(supplierId).catch(() => ({ connected: false } as XeroConnectionStatus)),
      ]);
      setSupplier(sup);
      setItems(priceItems);
      setXeroStatus(xero);
      if (sup) {
        setEditName(sup.name);
        setEditPhone(sup.phone || '');
        setEditEmail(sup.email || '');
        setEditAddress(sup.address || '');
        setEditWebsite(sup.website || '');
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  // --- Bulk edit handlers ---
  const startBulkEdit = () => {
    setBulkEditing(true);
    setBulkDrafts({});
    setBulkError('');
  };

  const cancelBulkEdit = () => {
    setBulkEditing(false);
    setBulkDrafts({});
    setBulkError('');
  };

  const updateDraft = (id: string, field: keyof ExtractedItem, value: unknown) => {
    setBulkDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getDraftValue = <K extends keyof ExtractedItem>(
    item: ExtractedItem & { id: string },
    field: K
  ): ExtractedItem[K] => {
    const draft = bulkDrafts[item.id];
    if (draft && field in draft) return draft[field] as ExtractedItem[K];
    return item[field];
  };

  const saveBulkEdits = async () => {
    const changeEntries = Object.entries(bulkDrafts).filter(
      ([, changes]) => Object.keys(changes).length > 0
    );
    if (changeEntries.length === 0) {
      setBulkEditing(false);
      return;
    }
    setBulkSaving(true);
    setBulkError('');
    try {
      await bulkUpdatePriceItems(
        supplierId,
        changeEntries.map(([id, changes]) => ({ id, changes }))
      );
      // Reflect changes locally without a full reload.
      setItems((prev) =>
        prev.map((item) => {
          const draft = bulkDrafts[item.id];
          if (!draft) return item;
          return { ...item, ...draft };
        })
      );
      setBulkDrafts({});
      setBulkEditing(false);
    } catch (err: unknown) {
      setBulkError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setBulkSaving(false);
    }
  };

  // --- Xero handlers ---
  const handleConnectXero = async () => {
    setXeroBusy(true);
    setXeroError('');
    try {
      const authUrl = await startXeroConnect(supplierId);
      window.location.href = authUrl;
    } catch (err: unknown) {
      setXeroError(err instanceof Error ? err.message : 'Failed to connect to Xero');
      setXeroBusy(false);
    }
  };

  const handleDisconnectXero = async () => {
    if (!confirm('Disconnect your Xero account? Your imported items will remain, but future syncs will stop.')) return;
    setXeroBusy(true);
    setXeroError('');
    try {
      await disconnectXero(supplierId);
      setXeroStatus({ connected: false });
    } catch (err: unknown) {
      setXeroError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setXeroBusy(false);
    }
  };

  const handleImportFromXero = async () => {
    setXeroBusy(true);
    setXeroError('');
    try {
      const result = await importXeroItems(supplierId);
      sessionStorage.setItem('extractionData', JSON.stringify({
        ...result,
        supplierName: supplier?.name || result.supplierName,
      }));
      router.push('/portal/review');
    } catch (err: unknown) {
      setXeroError(err instanceof Error ? err.message : 'Failed to import items from Xero');
      setXeroBusy(false);
    }
  };

  const pendingBulkChanges = Object.values(bulkDrafts).filter(
    (d) => Object.keys(d).length > 0
  ).length;

  const handleSaveProfile = async () => {
    await createOrUpdateSupplier(supplierId, {
      name: editName,
      phone: editPhone || undefined,
      email: editEmail || undefined,
      address: editAddress || undefined,
      website: editWebsite || undefined,
      ownerUid: supplierId,
    });
    setEditing(false);
    loadData();
  };

  const handleDeleteItem = async (itemId: string) => {
    await deletePriceItem(supplierId, itemId);
    setItems(items.filter((i) => i.id !== itemId));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const url = await uploadSupplierLogo(supplierId, file);
      setSupplier((prev) => (prev ? { ...prev, logoUrl: url } : prev));
    } catch (err: unknown) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleUploadMore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(true);
    setUploadError('');

    try {
      const files = Array.from(e.target.files);
      const result = await extractPriceList(files, supplier?.name);
      if (result.items.length > 0) {
        await savePriceItems(supplierId, result.items);
        loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/portal');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement('a');
      a.download = 'quotemate-qr-code.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (checkingAuth || loading) {
    return <PortalLoader message="Loading dashboard..." />;
  }

  return (
    <div className={styles.containerWide}>
      {/* Hidden QR for the "download plain QR" fallback */}
      <div style={{ position: 'absolute', left: -9999, top: -9999 }} aria-hidden="true">
        <QRCodeSVG
          id="qr-code"
          value={joinUrl}
          size={200}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>

      <div className={styles.topBar}>
        <h1 className={styles.title}>Supplier Dashboard</h1>
        <button onClick={handleSignOut} className={styles.signOutBtn}>Sign Out</button>
      </div>

      {/* Profile Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Business Profile</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className={styles.editBtn}>Edit</button>
          )}
        </div>

        {/* Logo upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => !logoUploading && logoInputRef.current?.click()}
            style={{
              width: 84,
              height: 84,
              borderRadius: 12,
              border: `2px dashed ${supplier?.logoUrl ? 'transparent' : 'var(--color-border)'}`,
              background: supplier?.logoUrl ? '#fff' : 'var(--color-bg-darkest)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: logoUploading ? 'wait' : 'pointer',
              overflow: 'hidden',
              flexShrink: 0,
              transition: 'border-color 0.2s',
            }}
          >
            {logoUploading ? (
              <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Uploading...</span>
            ) : supplier?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={supplier.logoUrl}
                alt="Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: 'var(--color-accent)', lineHeight: 1 }}>+</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Logo</div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              Business Logo
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              {supplier?.logoUrl
                ? 'Click the logo to replace it. Shows on your shop poster.'
                : 'Upload your logo — it will appear on your A4 shop poster.'}
            </div>
            {logoError && (
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{logoError}</div>
            )}
          </div>
        </div>

        {editing ? (
          <div className={styles.formFields}>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Business name" className={styles.input} />
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className={styles.input} />
            <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email" className={styles.input} />
            <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Address" className={styles.input} />
            <input type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website" className={styles.input} />
            <div className={styles.editActions}>
              <button onClick={handleSaveProfile} className={styles.button} style={{ width: 'auto' }}>Save</button>
              <button onClick={() => setEditing(false)} className={styles.buttonSecondary} style={{ width: 'auto' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{supplier?.name || 'Not set'}</div>
            {supplier?.phone && <div className={styles.profileDetail}>{supplier.phone}</div>}
            {supplier?.email && <div className={styles.profileDetail}>{supplier.email}</div>}
            {supplier?.address && <div className={styles.profileDetail}>{supplier.address}</div>}
            {supplier?.website && <div className={styles.profileDetail}>{supplier.website}</div>}
          </div>
        )}

        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.statValue}>{items.length}</div>
            <div className={styles.statLabel}>Price Items</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue}>{supplier?.subscriberCount ?? 0}</div>
            <div className={styles.statLabel}>Subscribers</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.statValue} style={{ color: supplier?.status === 'active' ? '#22c55e' : '#f59e0b' }}>
              {supplier?.status || 'pending'}
            </div>
            <div className={styles.statLabel}>Status</div>
          </div>
        </div>
      </div>

      {/* Poster CTA — the main call to action */}
      <div
        className={styles.card}
        style={{
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 146, 60, 0.08))',
          border: '1px solid rgba(249, 115, 22, 0.35)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div
            style={{
              fontSize: 34,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            📋
          </div>
          <div style={{ flex: 1 }}>
            <h2 className={styles.cardTitle} style={{ marginBottom: 4 }}>
              Print your shop poster
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
              A ready-to-print A4 poster with your QR code, designed to get tradies
              subscribed to your live prices. Display it at your counter.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/portal/poster')}
          className={styles.button}
          style={{ fontSize: 16, padding: '14px 24px' }}
        >
          Open A4 Poster →
        </button>
        <button
          onClick={handleDownloadQR}
          className={styles.link}
          style={{
            display: 'block',
            width: '100%',
            marginTop: 12,
            fontSize: 13,
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
          }}
        >
          or just download the plain QR code
        </button>
      </div>

      {/* Xero Integration */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Xero Integration</h2>
          {xeroStatus.connected && (
            <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>● Connected</span>
          )}
        </div>

        {xeroStatus.connected ? (
          <>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Synced with <strong style={{ color: 'var(--color-text-primary)' }}>{xeroStatus.tenantName || 'your Xero organisation'}</strong>.
              Import your inventory items as priced items — they&apos;ll flow through the review page so you can tidy them up before saving.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={handleImportFromXero}
                disabled={xeroBusy}
                className={styles.button}
                style={{ width: 'auto' }}
              >
                {xeroBusy ? 'Importing...' : 'Import Items from Xero'}
              </button>
              <button
                onClick={handleDisconnectXero}
                disabled={xeroBusy}
                className={styles.buttonSecondary}
                style={{ width: 'auto' }}
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Connect your Xero account to sync your inventory items automatically. No more manual data entry.
            </p>
            <button
              onClick={handleConnectXero}
              disabled={xeroBusy}
              className={styles.button}
              style={{ width: 'auto', background: '#13B5EA' }}
            >
              {xeroBusy ? 'Connecting...' : 'Connect to Xero'}
            </button>
          </>
        )}

        {xeroError && <div className={styles.error} style={{ marginTop: 12 }}>{xeroError}</div>}
      </div>

      {/* Price List Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Price List ({items.length} items)</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {!bulkEditing && items.length > 0 && (
              <button onClick={startBulkEdit} className={styles.editBtn}>
                Bulk Edit
              </button>
            )}
            {!bulkEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleUploadMore}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={styles.uploadBtn}
                >
                  {uploading ? 'Uploading...' : '+ Upload More'}
                </button>
              </>
            )}
          </div>
        </div>

        {uploadError && <div className={styles.error}>{uploadError}</div>}
        {bulkError && <div className={styles.error}>{bulkError}</div>}

        {bulkEditing ? (
          <>
            <div className={styles.bulkGrid}>
              <div className={styles.bulkHeaderRow}>
                <div className={styles.bulkColName}>Product Name</div>
                <div className={styles.bulkColPrice}>Price ($)</div>
                <div className={styles.bulkColUnit}>Unit</div>
                <div className={styles.bulkColActions} />
              </div>
              {items.map((item) => (
                <div key={item.id} className={styles.bulkRow}>
                  <input
                    type="text"
                    value={getDraftValue(item, 'name') as string}
                    onChange={(e) => updateDraft(item.id, 'name', e.target.value)}
                    className={styles.bulkInput}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={(getDraftValue(item, 'price') as number | null) ?? ''}
                    onChange={(e) =>
                      updateDraft(item.id, 'price', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    className={styles.bulkInput}
                  />
                  <select
                    value={getDraftValue(item, 'unit') as string}
                    onChange={(e) => updateDraft(item.id, 'unit', e.target.value)}
                    className={styles.bulkInput}
                  >
                    {['each', 'm', 'm²', 'm³', 'L', 'kg', 'box', 'pack'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className={styles.deleteBtn}
                    title="Delete item"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
            <div className={styles.bulkActionBar}>
              <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                {pendingBulkChanges > 0
                  ? `${pendingBulkChanges} item${pendingBulkChanges === 1 ? '' : 's'} changed`
                  : 'No changes yet'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cancelBulkEdit} className={styles.buttonSecondary} style={{ width: 'auto' }}>
                  Cancel
                </button>
                <button
                  onClick={saveBulkEdits}
                  disabled={bulkSaving || pendingBulkChanges === 0}
                  className={styles.button}
                  style={{ width: 'auto' }}
                >
                  {bulkSaving ? 'Saving...' : `Save Changes`}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div>
            {items.map((item) => (
              <div key={item.id} className={styles.itemRow}>
                <div className={styles.itemName}>{item.name}</div>
                <div className={styles.itemPrice}>
                  {item.price != null ? `$${item.price.toFixed(2)}` : '—'}
                  <span className={styles.itemUnit}>/{item.unit}</span>
                </div>
                <button onClick={() => handleDeleteItem(item.id)} className={styles.deleteBtn}>
                  &times;
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className={styles.emptyItems}>
                No items yet. Upload a price list to get started.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
