'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../admin.module.css';
import { api } from '../../lib/adminApi';
import { useSetPageMeta } from '../../lib/pageMeta';

// Mirrors AU_REGIONS in functions/src/leadOutreach.ts. Locations carry their
// state code so Places queries are unambiguous — "Richmond" straddles four
// states. Keep the two lists in sync when adding regions.
const AU_REGIONS: Record<string, string[]> = {
  NSW: [
    'Sydney NSW', 'Parramatta NSW', 'Penrith NSW', 'Liverpool NSW', 'Campbelltown NSW',
    'Blacktown NSW', 'Hornsby NSW', 'Sutherland NSW', 'Cronulla NSW', 'Manly NSW',
    'Bondi NSW', 'Chatswood NSW', 'Newcastle NSW', 'Central Coast NSW', 'Wollongong NSW',
    'Gosford NSW', 'Maitland NSW', 'Byron Bay NSW', 'Coffs Harbour NSW', 'Port Macquarie NSW',
    'Wagga Wagga NSW', 'Orange NSW', 'Tamworth NSW', 'Dubbo NSW', 'Albury NSW',
  ],
  VIC: [
    'Melbourne VIC', 'Geelong VIC', 'Ballarat VIC', 'Bendigo VIC', 'Frankston VIC',
    'Dandenong VIC', 'Werribee VIC', 'Ringwood VIC', 'Box Hill VIC', 'Preston VIC',
    'Sunshine VIC', 'Cranbourne VIC', 'Pakenham VIC', 'Shepparton VIC', 'Traralgon VIC',
    'Mornington VIC', 'Sunbury VIC', 'Melton VIC',
  ],
  QLD: [
    'Brisbane QLD', 'Gold Coast QLD', 'Sunshine Coast QLD', 'Ipswich QLD', 'Logan QLD',
    'Toowoomba QLD', 'Cairns QLD', 'Townsville QLD', 'Mackay QLD', 'Rockhampton QLD',
    'Bundaberg QLD', 'Hervey Bay QLD', 'Caboolture QLD', 'Redcliffe QLD', 'Gladstone QLD',
  ],
  WA: [
    'Perth WA', 'Fremantle WA', 'Joondalup WA', 'Rockingham WA', 'Mandurah WA',
    'Bunbury WA', 'Geraldton WA', 'Albany WA', 'Midland WA', 'Armadale WA',
    'Busselton WA', 'Kalgoorlie WA',
  ],
  SA: [
    'Adelaide SA', 'Port Adelaide SA', 'Elizabeth SA', 'Noarlunga SA', 'Mount Barker SA',
    'Mount Gambier SA', 'Whyalla SA', 'Gawler SA', 'Murray Bridge SA',
  ],
  TAS: ['Hobart TAS', 'Launceston TAS', 'Devonport TAS', 'Burnie TAS'],
  ACT: ['Canberra ACT', 'Belconnen ACT', 'Tuggeranong ACT', 'Gungahlin ACT'],
  NT: ['Darwin NT', 'Palmerston NT', 'Alice Springs NT'],
};
const AU_STATES = Object.keys(AU_REGIONS);
const ALL_REGIONS = AU_STATES.flatMap((s) => AU_REGIONS[s]);

const TRADES = [
  { id: 'fencer', label: 'Fencer' },
  { id: 'landscaper', label: 'Landscaper' },
  { id: 'deck-builder', label: 'Deck builder' },
  { id: 'plumber', label: 'Plumber' },
  { id: 'electrician', label: 'Electrician' },
  { id: 'hvac', label: 'HVAC / air-con' },
  { id: 'carpenter', label: 'Carpenter' },
  { id: 'cabinet-maker', label: 'Cabinet maker' },
  { id: 'painter', label: 'Painter' },
  { id: 'roofer', label: 'Roofer' },
  { id: 'flooring', label: 'Flooring' },
  { id: 'cleaner', label: 'Cleaner' },
  { id: 'pest-control', label: 'Pest control' },
  { id: 'handyman', label: 'Handyman' },
] as const;
type Trade = typeof TRADES[number]['id'];

export default function DiscoveryPage() {
  const router = useRouter();
  const [trade, setTrade] = useState<Trade>('fencer');
  const [suburbs, setSuburbs] = useState<string[]>([]);
  const [customSuburb, setCustomSuburb] = useState('');
  const [maxResults, setMaxResults] = useState(20);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  // Auto-discovery config state
  const [autoCfg, setAutoCfg] = useState<any>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    api.getDiscoveryConfig({}).then((r: any) => setAutoCfg(r.config)).catch(() => {});
  }, []);

  const saveAutoCfg = async (next: any) => {
    setAutoSaving(true);
    try {
      await api.updateDiscoveryConfig(next);
      setAutoCfg({ ...autoCfg, ...next });
      setToast({ msg: 'Auto-discovery saved' });
    } catch (e: any) {
      setToast({ msg: e?.message || 'Save failed', error: true });
    } finally {
      setAutoSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

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
      const r: any = await api.leadDiscovery({ trade, suburbs, maxResults });
      setResult(r);
      setToast({ msg: `Created ${r.created} new lead(s)` });
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
            {TRADES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Suburbs / regions ({suburbs.length} selected)</label>
          {AU_STATES.map((state) => {
            const regions = AU_REGIONS[state];
            const allOn = regions.every((s) => suburbs.includes(s));
            return (
              <div key={state} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', minWidth: 34 }}>{state}</span>
                  <button
                    type="button"
                    onClick={() => setSuburbs((prev) => allOn
                      ? prev.filter((s) => !regions.includes(s))
                      : Array.from(new Set([...prev, ...regions])))}
                    style={{ background: 'none', border: 'none', color: 'var(--color-accent-light)', cursor: 'pointer', fontSize: 11 }}
                  >
                    {allOn ? 'clear' : 'select all'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {regions.map((s) => {
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
                        {s.replace(new RegExp(`\\s${state}$`), '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div style={{ marginBottom: 10 }}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
              onClick={() => setSuburbs(suburbs.length === ALL_REGIONS.length ? [] : [...ALL_REGIONS])}
            >
              {suburbs.length === ALL_REGIONS.length ? 'Clear all' : `Select all Australia (${ALL_REGIONS.length})`}
            </button>
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

        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={busy || !suburbs.length}
          onClick={run}
        >
          {busy ? 'Running…' : 'Run discovery'}
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
              <Stat label="Created" value={result.created || 0} />
              <Stat label="Existing" value={result.dedupedExisting} />
              <Stat label="Suppressed" value={result.dedupedSuppressed} />
              <Stat label="Existing user" value={result.dedupedExistingUser} />
              <Stat label="Place fetch fails" value={result.placeFetchFailures} />
              <Stat label="Non-AU skipped" value={result.skippedNonAu} />
            </div>
            {result.campaignId && (
              <Link href={`/admin/leads`} className={`${styles.btn} ${styles.btnSecondary} ${styles.btnSmall}`} style={{ marginTop: 12 }}>
                View leads
              </Link>
            )}
          </div>
        )}

        {/* AUTO-DISCOVERY */}
        <div className={styles.card} style={{ borderLeft: `4px solid ${autoCfg?.enabled ? '#10b981' : '#94a3b8'}` }}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Auto-discovery</div>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: 12, marginTop: 2 }}>
                Runs Mon 8am AEST · refills queue, optionally auto-researches + generates
              </div>
            </div>
          </div>
          {autoCfg && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, background: 'var(--color-surface-2, #0f172a)', borderRadius: 6, marginBottom: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCfg.enabled === true}
                  onChange={(e) => saveAutoCfg({ enabled: e.target.checked })}
                  disabled={autoSaving}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Enable daily auto-discovery</span>
              </label>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Trades</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TRADES.map((t) => {
                    const active = (autoCfg.trades || []).includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={styles.chip}
                        onClick={() => {
                          const next = active ? autoCfg.trades.filter((x: string) => x !== t.id) : [...(autoCfg.trades || []), t.id];
                          saveAutoCfg({ trades: next });
                        }}
                        style={{ background: active ? 'rgba(16, 185, 129, 0.18)' : undefined, color: active ? '#10b981' : undefined, borderColor: active ? 'rgba(16, 185, 129, 0.4)' : undefined }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Suburbs</label>
                <textarea
                  className={styles.textarea}
                  value={(autoCfg.suburbs || []).join(', ')}
                  onChange={(e) => setAutoCfg({ ...autoCfg, suburbs: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                  onBlur={() => saveAutoCfg({ suburbs: autoCfg.suburbs })}
                  style={{ minHeight: 50, fontSize: 12 }}
                  placeholder="Sydney, Newcastle, Wollongong, …"
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 4 }}>Target per week</label>
                <input
                  type="number"
                  className={styles.input}
                  value={autoCfg.targetPerWeek ?? 50}
                  min={1}
                  max={2000}
                  onChange={(e) => setAutoCfg({ ...autoCfg, targetPerWeek: Number(e.target.value) || 0 })}
                  onBlur={() => saveAutoCfg({ targetPerWeek: autoCfg.targetPerWeek })}
                  style={{ width: 100 }}
                />
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 8 }}>
                  Split across 7 daily runs. Only ~48% of leads yield an email, so
                  aim for ~2× the emails you want to send per week.
                </span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCfg.autoResearch === true}
                  onChange={(e) => saveAutoCfg({ autoResearch: e.target.checked })}
                />
                <span>Also auto-research (scrape + Claude extract hooks)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCfg.autoGenerate === true}
                  onChange={(e) => saveAutoCfg({ autoGenerate: e.target.checked })}
                />
                <span>Also auto-generate messages (only for medium/high confidence)</span>
              </label>
            </>
          )}
        </div>

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
