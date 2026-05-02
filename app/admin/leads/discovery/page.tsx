'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';
import { api } from '../../lib/adminApi';
import { useSetPageMeta } from '../../lib/pageMeta';

const NSW_SUBURBS = [
  'Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Maitland',
  'Penrith', 'Parramatta', 'Liverpool', 'Blacktown', 'Campbelltown',
  'Bondi', 'Manly', 'Cronulla', 'Hornsby', 'Chatswood',
  'Mosman', 'Northern Beaches', 'Eastern Suburbs', 'Inner West', 'Sutherland Shire',
  'Western Sydney', 'Hills District', 'Macarthur', 'Illawarra',
  'Byron Bay', 'Coffs Harbour', 'Port Macquarie', 'Tamworth', 'Orange', 'Wagga Wagga',
];

type Trade = 'fencer' | 'landscaper' | 'deck-builder';

export default function DiscoveryPage() {
  const router = useRouter();
  const [trade, setTrade] = useState<Trade>('fencer');
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [customSuburb, setCustomSuburb] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [dryRun, setDryRun] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  useSetPageMeta({ title: 'Discover leads', breadcrumb: 'Lead outreach' });

  const toggle = (s: string) => {
    setSuburbs((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  };

  const addCustom = () => {
    const s = customSuburb.trim();
    if (!s) return;
    setSuburbs((cur) => cur.includes(s) ? cur : [...cur, s]);
    setCustomSuburb('');
  };

  const run = async () => {
    if (!suburbs.length) {
      setToast({ msg: 'Pick at least one suburb', error: true });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const r: any = await api.leadDiscovery({ trade, suburbs, maxResults, dryRun });
      setResult(r);
      if (!dryRun) {
        setToast({ msg: `Created ${r.created} new lead(s)` });
      }
    } catch (e: any) {
      setToast({ msg: e?.message || 'Discovery failed', error: true });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20 }}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Find new tradies</div>
            <div className={styles.cardSubtitle}>Pulls from Google Maps. Dedupes existing leads + users.</div>
          </div>
          <Link href="/admin/leads" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}>← All leads</Link>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Trade</label>
          <select className={styles.select} value={trade} onChange={(e) => setTrade(e.target.value as Trade)} style={{ width: '100%' }}>
            <option value="fencer">Fencer</option>
            <option value="landscaper">Landscaper</option>
            <option value="deck-builder">Deck builder</option>
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Suburbs / regions ({suburbs.length} selected)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {NSW_SUBURBS.map((s) => {
              const active = suburbs.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className={styles.chip}
                  style={{
                    background: active ? 'rgba(249, 115, 22, 0.18)' : undefined,
                    color: active ? 'var(--color-accent-light)' : undefined,
                    borderColor: active ? 'rgba(249, 115, 22, 0.4)' : undefined,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className={styles.input}
              placeholder="Custom suburb (e.g. Surry Hills NSW)"
              value={customSuburb}
              onChange={(e) => setCustomSuburb(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addCustom(); }}
              style={{ flex: 1 }}
            />
            <button type="button" className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={addCustom}>Add</button>
          </div>
          {suburbs.length > 0 && (
            <div style={{ marginTop: 10, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              Selected: {suburbs.join(', ')}
              {' '}<button type="button" onClick={() => setSuburbs([])} style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)', cursor: 'pointer', fontSize: 12 }}>Clear</button>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Max results per query</label>
          <input
            type="number"
            className={styles.input}
            value={maxResults}
            min={5}
            max={60}
            onChange={(e) => setMaxResults(Math.max(5, Math.min(60, Number(e.target.value) || 20)))}
            style={{ width: 120 }}
          />
          <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 4 }}>
            Google returns up to 20 per page. Estimated cost: ~$0.05 per lead enriched.
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            <span>Dry run (preview, no DB writes)</span>
          </label>
        </div>

        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy || !suburbs.length}
          onClick={run}
        >
          {busy ? 'Running…' : (dryRun ? 'Preview discovery' : 'Run discovery')}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {result && (
          <div className={styles.card}>
            <div className={styles.cardHeader}><div className={styles.cardTitle}>Result</div></div>
            {result.searchErrors?.length > 0 && (
              <div style={{ marginBottom: 12, padding: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, color: '#fca5a5', fontSize: 12, lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Places API error</div>
                {result.searchErrors.map((err: string, i: number) => (
                  <div key={i} style={{ marginTop: 4, fontFamily: 'monospace', wordBreak: 'break-word' }}>{err}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, fontSize: 13 }}>
              <Stat label={dryRun ? 'Would create' : 'Created'} value={result.created || 0} />
              <Stat label="Existing" value={result.dedupedExisting} />
              <Stat label="Suppressed" value={result.dedupedSuppressed} />
              <Stat label="Existing user" value={result.dedupedExistingUser} />
              <Stat label="Place fetch fails" value={result.placeFetchFailures} />
            </div>
            {!dryRun && result.campaignId && (
              <Link href={`/admin/leads`} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} style={{ marginTop: 12 }}>
                View leads
              </Link>
            )}
            {dryRun && result.sample?.length > 0 && (
              <>
                <div style={{ marginTop: 14, color: 'var(--color-text-tertiary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Preview ({Math.min(10, result.sample.length)})</div>
                <div style={{ marginTop: 6 }}>
                  {result.sample.map((s: any, i: number) => (
                    <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                      <div style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{s.businessName}</div>
                      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                        {s.suburb}{s.googleRating ? ` · ★ ${s.googleRating} (${s.googleReviewCount || 0})` : ''}
                        {s.email ? ` · ${s.email}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.cardHeader}><div className={styles.cardTitle}>Workflow</div></div>
          <ol style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', fontSize: 13, lineHeight: 1.7 }}>
            <li>Discover → leads land as <strong>new</strong></li>
            <li>Research → website scrape + owner/hooks → <strong>researched</strong></li>
            <li>Generate → Claude writes a personal email → <strong>queued</strong></li>
            <li>Review &amp; edit each message</li>
            <li>Approve &amp; send → goes via Brevo with compliance footer</li>
            <li>Engagement (open/click/reply) auto-flips status</li>
          </ol>
        </div>
      </div>

      {toast && <div className={`${styles.toast} ${toast.error ? styles.toastError : ''}`}>{toast.msg}</div>}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--color-text-secondary)',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8,
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ padding: 10, background: 'var(--color-surface-2, #0f172a)', borderRadius: 8 }}>
      <div style={{ color: 'var(--color-text-tertiary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 20, fontWeight: 700, marginTop: 4 }}>{value ?? 0}</div>
    </div>
  );
}
