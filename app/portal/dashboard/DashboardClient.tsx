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
  extractPriceList,
  uploadSupplierLogo,
  type SupplierProfile,
  type ExtractedItem,
} from '../../../lib/supplierService';
import styles from '../portal.module.css';

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
      const [sup, priceItems] = await Promise.all([
        getSupplier(supplierId),
        getPriceItems(supplierId),
      ]);
      setSupplier(sup);
      setItems(priceItems);
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
    return <div className={styles.loading}>Loading dashboard...</div>;
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

      {/* Price List Section */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Price List ({items.length} items)</h2>
          <div>
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
          </div>
        </div>

        {uploadError && <div className={styles.error}>{uploadError}</div>}

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
      </div>
    </div>
  );
}
