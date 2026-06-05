'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';
import { api } from '../lib/adminApi';
import { useSetPageMeta } from '../lib/pageMeta';
import { Sparkline, pctChange } from '../components/Sparkline';

interface CostsResponse {
  windowDays: number;
  startKey: string;
  endKey: string;
  totals: {
    turns: number;
    chatCalls: number;
    inputTokens: number;
    outputTokens: number;
    thoughtsTokens: number;
    cachedTokens: number;
    voiceInputAudioTokens: number;
    voiceOutputAudioTokens: number;
    voiceSessions: number;
    costMicros: number;
    activeUsers: number;
  };
  series: Array<{ date: string; turns: number; costMicros: number; activeUsers: number }>;
  top: Array<{
    uid: string;
    userEmail: string | null;
    userBusinessName: string | null;
    turns: number;
    chatCalls: number;
    inputTokens: number;
    outputTokens: number;
    thoughtsTokens: number;
    cachedTokens: number;
    voiceInputAudioTokens: number;
    voiceOutputAudioTokens: number;
    voiceSessions: number;
    costMicros: number;
  }>;
  pricing: Record<string, {
    inputPerM: number;
    outputPerM: number;
    cachedInputPerM: number;
    inputAudioPerM?: number;
    outputAudioPerM?: number;
  }>;
}

const WINDOWS = [7, 14, 30, 60, 90];

export default function AiCostsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<CostsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSetPageMeta({ title: 'AI costs', breadcrumb: 'Mate · Token usage' });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .assistantCosts({ days, topLimit: 25 })
      .then((res: any) => {
        if (cancelled) return;
        setData(res as CostsResponse);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || 'Failed to load costs');
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const costSeries = useMemo(() => data?.series.map((d) => d.costMicros) || [], [data]);
  const turnSeries = useMemo(() => data?.series.map((d) => d.turns) || [], [data]);
  const activeSeries = useMemo(() => data?.series.map((d) => d.activeUsers) || [], [data]);

  // Project current month from last 7 days' avg run-rate.
  const monthProjection = useMemo(() => {
    if (!data || data.series.length < 2) return null;
    const tail = data.series.slice(-7);
    if (!tail.length) return null;
    const avg = tail.reduce((a, d) => a + d.costMicros, 0) / tail.length;
    return avg * 30;
  }, [data]);

  return (
    <>
      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Mate token usage & cost</div>
            <div className={styles.cardSubtitle}>
              Real spend recorded from Gemini <code>usageMetadata</code> on every chat turn.
              Voice (Live) usage is reported by the app client when a session ends.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {WINDOWS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`${styles.btn} ${styles.btnSmall} ${d === days ? styles.btnPrimary : styles.btnGhost}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className={styles.statGrid}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={styles.statCard}>
              <div className={styles.skeleton} style={{ height: 14, width: '40%', marginBottom: 12 }} />
              <div className={styles.skeleton} style={{ height: 32, width: '60%' }} />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className={styles.card} style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className={styles.cardTitle}>Couldn't load costs</div>
          <div className={styles.cardSubtitle}>{error}</div>
        </div>
      )}

      {data && (
        <>
          <div className={styles.statGrid}>
            <StatCard
              label={`Total spend (${data.windowDays}d)`}
              value={formatUsd(data.totals.costMicros)}
              sub={`${formatInt(data.totals.turns)} turns · ${formatInt(data.totals.activeUsers)} active users`}
              series={costSeries}
              accent
            />
            <StatCard
              label="Avg cost / turn"
              value={data.totals.turns ? formatUsdPerTurn(data.totals.costMicros, data.totals.turns) : '—'}
              sub={`${formatTokens(data.totals.inputTokens)} in · ${formatTokens(data.totals.outputTokens + data.totals.thoughtsTokens)} out`}
              series={turnSeries}
            />
            <StatCard
              label="Active users"
              value={formatInt(data.totals.activeUsers)}
              sub={`${formatInt(data.totals.chatCalls)} chat calls · ${formatInt(data.totals.voiceSessions)} voice sessions`}
              series={activeSeries}
            />
            <StatCard
              label="30-day projection"
              value={monthProjection !== null ? formatUsd(monthProjection) : '—'}
              sub={monthProjection !== null ? 'Based on last 7-day run-rate' : 'Not enough data yet'}
            />
          </div>

          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Daily breakdown</div>
                <div className={styles.cardSubtitle}>{data.startKey} → {data.endKey} (UTC)</div>
              </div>
              {pctChange(costSeries) && (
                <div style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: (pctChange(costSeries)?.delta || 0) >= 0 ? '#fca5a5' : '#6ee7b7',
                }}>
                  Cost trend {pctChange(costSeries)?.label}
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: 720 }}>
                <thead>
                  <tr>
                    <th>Date (UTC)</th>
                    <th style={{ textAlign: 'right' }}>Active</th>
                    <th style={{ textAlign: 'right' }}>Turns</th>
                    <th style={{ textAlign: 'right' }}>Cost (USD)</th>
                    <th style={{ textAlign: 'right' }}>Cost / turn</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.series].reverse().map((row) => (
                    <tr key={row.date}>
                      <td><code>{prettyDate(row.date)}</code></td>
                      <td style={{ textAlign: 'right' }}>{formatInt(row.activeUsers)}</td>
                      <td style={{ textAlign: 'right' }}>{formatInt(row.turns)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatUsd(row.costMicros)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>
                        {row.turns ? formatUsdPerTurn(row.costMicros, row.turns) : '—'}
                      </td>
                    </tr>
                  ))}
                  {data.series.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
                        No usage yet in this window.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Top spenders</div>
                <div className={styles.cardSubtitle}>Users ranked by total Mate cost in the window</div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: 820 }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th style={{ textAlign: 'right' }}>Turns</th>
                    <th style={{ textAlign: 'right' }}>Input tok</th>
                    <th style={{ textAlign: 'right' }}>Output tok</th>
                    <th style={{ textAlign: 'right' }}>Voice sess.</th>
                    <th style={{ textAlign: 'right' }}>Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top.map((u) => (
                    <tr key={u.uid}>
                      <td>
                        <Link href={`/admin/users?uid=${encodeURIComponent(u.uid)}`} style={{ color: 'inherit' }}>
                          <div style={{ fontWeight: 600 }}>
                            {u.userBusinessName || u.userEmail || u.uid.slice(0, 8)}
                          </div>
                          {u.userBusinessName && u.userEmail && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{u.userEmail}</div>
                          )}
                        </Link>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatInt(u.turns)}</td>
                      <td style={{ textAlign: 'right' }}>{formatTokens(u.inputTokens)}</td>
                      <td style={{ textAlign: 'right' }}>{formatTokens(u.outputTokens + u.thoughtsTokens)}</td>
                      <td style={{ textAlign: 'right' }}>{formatInt(u.voiceSessions)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatUsd(u.costMicros)}</td>
                    </tr>
                  ))}
                  {data.top.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-secondary)' }}>
                        No users with recorded Mate usage yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.card} style={{ marginTop: 20 }}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.cardTitle}>Pricing reference</div>
                <div className={styles.cardSubtitle}>
                  Edit in <code>functions/src/assistantCosts.ts</code> · USD per 1M tokens
                </div>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: 640 }}>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th style={{ textAlign: 'right' }}>Input</th>
                    <th style={{ textAlign: 'right' }}>Output</th>
                    <th style={{ textAlign: 'right' }}>Cached</th>
                    <th style={{ textAlign: 'right' }}>Audio in</th>
                    <th style={{ textAlign: 'right' }}>Audio out</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.pricing).map(([model, p]) => (
                    <tr key={model}>
                      <td><code>{model}</code></td>
                      <td style={{ textAlign: 'right' }}>${p.inputPerM.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${p.outputPerM.toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>${p.cachedInputPerM.toFixed(3)}</td>
                      <td style={{ textAlign: 'right' }}>{p.inputAudioPerM != null ? `$${p.inputAudioPerM.toFixed(2)}` : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{p.outputAudioPerM != null ? `$${p.outputAudioPerM.toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  series,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  series?: number[];
}) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : undefined}>
      <div className={styles.statLabel} style={{ marginBottom: 10 }}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
      {series && series.length >= 2 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline values={series} height={32} />
        </div>
      )}
    </div>
  );
}

function formatUsd(micros: number): string {
  const usd = micros / 1_000_000;
  if (usd >= 100) return `$${usd.toFixed(0)}`;
  if (usd >= 10) return `$${usd.toFixed(2)}`;
  if (usd >= 1) return `$${usd.toFixed(3)}`;
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(6)}`;
}

function formatUsdPerTurn(micros: number, turns: number): string {
  const usd = micros / 1_000_000 / Math.max(1, turns);
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(6)}`;
}

function formatInt(n: number): string {
  return (n || 0).toLocaleString();
}

function formatTokens(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function prettyDate(key: string): string {
  if (!/^\d{8}$/.test(key)) return key;
  return `${key.slice(0, 4)}-${key.slice(4, 6)}-${key.slice(6, 8)}`;
}
