'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from '../admin.module.css';
import { api } from '../lib/adminApi';
import { getCached, setCached } from '../lib/cache';
import { useSetPageMeta } from '../lib/pageMeta';

// A forward model, not a report: every number below is a month-by-month
// simulation seeded from live data (adminListSubscriptions + adminFunnelStats)
// and then bent by whatever assumptions are typed in. Nothing here is stored
// server-side except the goals list — the what-if scenario lives in this browser.

interface Rollup {
  payers: number;
  mrrGross: number;
  mrrNet: number;
}

interface FunnelLite {
  funnel: { signups: number; startedTrial: number };
  cohorts?: Record<string, { signups: number; startedTrial: number }>;
  weekCohorts?: { signups: number }[];
  conversion: { trialToPaid: number };
}

// Percentages are stored as the number typed (3 = 3%), money in AUD.
interface Assumptions {
  startPayers: number;
  arpu: number;
  netRatio: number;
  signupsPerMonth: number;
  signupGrowth: number;
  trialStartRate: number;
  trialToPaid: number;
  // Where trial → paid climbs to, linearly over trialToPaidRampMonths, then holds.
  trialToPaidTarget: number;
  trialToPaidRampMonths: number;
  churn: number;
  monthlyCosts: number;
  horizon: number;
}

interface MonthRow {
  month: number;
  signups: number;
  trialToPaid: number;
  newPayers: number;
  churned: number;
  payers: number;
  mrr: number;
  net: number;
  profit: number;
  cumulativeNet: number;
}

interface Goal {
  id: string;
  metric: 'mrr' | 'payers';
  target: number;
  // 'YYYY-MM' — the goal counts as hit if the projection reaches it by that month.
  by: string;
}

// v2: earlier scenarios were seeded from a 30-day cohort that never existed.
// v3: added the trial → paid ramp fields.
const SCENARIO_KEY = 'projections-scenario-v3';
const GOALS_KEY = 'projections-goals';
const HORIZONS = [12, 24, 36];
// Annual is A$328 → A$27.33/mo; monthly is A$49. Used only when nobody is paying yet.
const FALLBACK_ARPU = 328 / 12;
// GST out, then the 15% store cut — the same net the Revenue page uses.
const FALLBACK_NET_RATIO = (1 / 1.1) * 0.85;
const DEFAULT_CHURN = 3;
// Not measured — a planning assumption that onboarding/paywall work lifts
// conversion over time. Today's rate is the start; it never ramps down by default.
const DEFAULT_TRIAL_TO_PAID_TARGET = 5;
const DEFAULT_RAMP_MONTHS = 12;

const money0 = (n: number) => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

function project(a: Assumptions): MonthRow[] {
  const rows: MonthRow[] = [];
  // Fractional payers on purpose: at ~1% conversion, rounding each month
  // would flatten the whole curve to zero.
  let payers = a.startPayers;
  let cumulativeNet = 0;
  for (let m = 1; m <= a.horizon; m++) {
    const signups = a.signupsPerMonth * Math.pow(1 + a.signupGrowth / 100, m - 1);
    const trialToPaid = trialToPaidAt(a, m);
    const newPayers = signups * (a.trialStartRate / 100) * (trialToPaid / 100);
    const churned = payers * (a.churn / 100);
    payers = payers - churned + newPayers;
    const mrr = payers * a.arpu;
    const net = mrr * a.netRatio;
    cumulativeNet += net;
    rows.push({ month: m, signups, trialToPaid, newPayers, churned, payers, mrr, net, profit: net - a.monthlyCosts, cumulativeNet });
  }
  return rows;
}

// Month 1 converts at today's rate; month 1 + ramp months reaches the target.
function trialToPaidAt(a: Assumptions, m: number): number {
  if (a.trialToPaidRampMonths <= 0) return a.trialToPaidTarget;
  const t = Math.min((m - 1) / a.trialToPaidRampMonths, 1);
  return a.trialToPaid + (a.trialToPaidTarget - a.trialToPaid) * t;
}

function monthsUntil(by: string): number {
  const [y, m] = by.split('-').map(Number);
  const now = new Date();
  return (y * 12 + (m - 1)) - (now.getFullYear() * 12 + now.getMonth());
}

function defaultGoalMonth(monthsAhead: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + monthsAhead);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function goalValue(r: MonthRow | undefined, metric: Goal['metric']): number {
  if (!r) return 0;
  return metric === 'mrr' ? r.mrr : r.payers;
}

function fmtGoal(metric: Goal['metric'], v: number): string {
  return metric === 'mrr' ? `${money0(v)}/mo MRR` : `${Math.round(v).toLocaleString()} payers`;
}

// Smallest value of one assumption that hits the goal, everything else held.
// Both levers we solve for only ever push the curve up, so bisection is safe.
// trial → paid is solved as a flat rate from now (start = target), since a
// ramp that lands after the goal date can't be what gets there.
function solveFor(a: Assumptions, goal: Goal, field: 'trialToPaid' | 'signupsPerMonth', hi: number): number | null {
  const months = monthsUntil(goal.by);
  if (months < 1) return null;
  const hits = (v: number) => {
    const patch = field === 'trialToPaid' ? { trialToPaid: v, trialToPaidTarget: v } : { [field]: v };
    const r = project({ ...a, ...patch, horizon: months });
    return goalValue(r[r.length - 1], goal.metric) >= goal.target;
  };
  if (!hits(hi)) return null;
  let lo = 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (hits(mid)) hi = mid; else lo = mid;
  }
  return hi;
}

function monthLabel(offset: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
}

export default function ProjectionsPage() {
  const [rollup, setRollup] = useState<Rollup | null>(() => getCached<Rollup>('projections-rollup'));
  const [funnel, setFunnel] = useState<FunnelLite | null>(() => getCached<FunnelLite>('analytics-funnel'));
  const [error, setError] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Assumptions | null>(() => getCached<Assumptions>(SCENARIO_KEY));
  // Log by default; only an explicit pick of Linear sticks. Key bumped when
  // the default flipped so earlier clicks don't hold anyone on linear.
  const [logScale, setLogScale] = useState<boolean>(() => getCached<boolean>('projections-log-scale-v2') !== false);
  const toggleLogScale = (on: boolean) => {
    setLogScale(on);
    setCached('projections-log-scale-v2', on);
  };
  const [goals, setGoals] = useState<Goal[]>(() => getCached<Goal[]>(GOALS_KEY) || []);
  const [draft, setDraft] = useState<{ metric: Goal['metric']; target: string; by: string }>({ metric: 'mrr', target: '', by: defaultGoalMonth(12) });

  const [goalsError, setGoalsError] = useState<string | null>(null);

  // Goals are shared across devices via adminSaveProjectionGoals; the local
  // copy only paints instantly while the server read is in flight.
  const saveGoals = (next: Goal[]) => {
    setGoals(next);
    setCached(GOALS_KEY, next);
    setGoalsError(null);
    api.saveProjectionGoals({ goals: next }).catch((e) => {
      setGoalsError(e?.message || 'Couldn’t save goals — they’re only on this device until it works.');
    });
  };
  const addGoal = () => {
    const target = parseFloat(draft.target);
    if (!Number.isFinite(target) || target <= 0 || monthsUntil(draft.by) < 1) return;
    saveGoals([...goals, { id: `${Date.now()}`, metric: draft.metric, target, by: draft.by }]
      .sort((a, b) => a.by.localeCompare(b.by)));
    setDraft({ ...draft, target: '' });
  };

  useEffect(() => {
    let cancelled = false;
    api.listSubscriptions({}).then((r: any) => {
      if (cancelled || !r?.revenue) return;
      setRollup(r.revenue);
      setCached('projections-rollup', r.revenue);
    }).catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load subscriptions'); });
    api.funnelStats({}).then((f: any) => {
      if (cancelled) return;
      setFunnel(f);
      setCached('analytics-funnel', f);
    }).catch((e) => { if (!cancelled) setError(e?.message || 'Failed to load funnel'); });
    api.getProjectionGoals({}).then((r: any) => {
      if (cancelled) return;
      const server: Goal[] = r?.goals || [];
      const local = getCached<Goal[]>(GOALS_KEY) || [];
      // First load after goals moved server-side: carry this browser's goals up.
      if (server.length === 0 && !r?.updatedAt && local.length > 0) {
        api.saveProjectionGoals({ goals: local }).catch(() => {});
        return;
      }
      setGoals(server);
      setCached(GOALS_KEY, server);
    }).catch((e) => { if (!cancelled) setGoalsError(e?.message || 'Couldn’t load shared goals'); });
    return () => { cancelled = true; };
  }, []);

  // What today's data says, untouched. The "Live" line is always this.
  const live = useMemo<Assumptions | null>(() => {
    if (!rollup || !funnel) return null;
    // The backend's windows are 7/28/90 days (adminFunnel COHORT_WINDOW_DAYS).
    const c28 = funnel.cohorts?.['28'];
    const c90 = funnel.cohorts?.['90'];
    const DAYS_PER_MONTH = 365 / 12;
    // weekCohorts is newest-first and [0] is the partial current week — skip it.
    const weeks = (funnel.weekCohorts || []).slice(1, 5);
    const signupsPerMonth = c28
      ? (c28.signups / 28) * DAYS_PER_MONTH
      : weeks.length > 0
        ? (weeks.reduce((s, w) => s + w.signups, 0) / weeks.length) * (52 / 12)
        : 0;
    // Measured signup growth: the last 28 days' daily rate against the 62 days
    // before it. Window midpoints sit 45 days apart, so compound to a monthly
    // rate. Clamped — a single viral week shouldn't project to the moon.
    let signupGrowth = 0;
    if (c28 && c90 && c90.signups > c28.signups && c28.signups > 0) {
      const recentDaily = c28.signups / 28;
      const priorDaily = (c90.signups - c28.signups) / 62;
      const monthly = Math.pow(recentDaily / priorDaily, DAYS_PER_MONTH / 45) - 1;
      signupGrowth = Math.max(-15, Math.min(15, round1(monthly * 100)));
    }
    const startBase = c28 && c28.signups > 0 ? c28 : funnel.funnel;
    const trialStartRate = startBase.signups > 0 ? (startBase.startedTrial / startBase.signups) * 100 : 100;
    const trialToPaid = round1((funnel.conversion?.trialToPaid || 0) * 100);
    return {
      startPayers: rollup.payers,
      arpu: rollup.payers > 0 ? round1(rollup.mrrGross / rollup.payers) : round1(FALLBACK_ARPU),
      netRatio: rollup.mrrGross > 0 ? rollup.mrrNet / rollup.mrrGross : FALLBACK_NET_RATIO,
      signupsPerMonth: Math.round(signupsPerMonth),
      signupGrowth,
      trialStartRate: round1(Math.min(trialStartRate, 100)),
      trialToPaid,
      trialToPaidTarget: Math.max(trialToPaid, DEFAULT_TRIAL_TO_PAID_TARGET),
      trialToPaidRampMonths: DEFAULT_RAMP_MONTHS,
      churn: DEFAULT_CHURN,
      monthlyCosts: 0,
      horizon: 24,
    };
  }, [rollup, funnel]);

  const current = scenario ?? live;

  const update = (patch: Partial<Assumptions>) => {
    if (!current) return;
    const next = { ...current, ...patch };
    setScenario(next);
    setCached(SCENARIO_KEY, next);
  };
  const resetToLive = () => {
    setScenario(null);
    setCached(SCENARIO_KEY, null);
  };

  const liveRows = useMemo(() => (live && current ? project({ ...live, horizon: current.horizon }) : []), [live, current]);
  const rows = useMemo(() => (current ? project(current) : []), [current]);
  const end = rows[rows.length - 1];
  const liveEnd = liveRows[liveRows.length - 1];
  const edited = !!scenario && !!live && JSON.stringify(scenario) !== JSON.stringify({ ...live, horizon: scenario.horizon });

  useSetPageMeta({
    title: 'Goals & projections',
    breadcrumb: end && current
      ? `${money0(end.mrr)}/mo MRR in ${current.horizon} months${edited ? ' · your scenario' : ' · on current trend'}`
      : 'Where MRR goes from here',
  });

  if (!current || !live) {
    return (
      <div className={styles.card}>
        <div style={{ fontSize: 13, color: error ? '#fca5a5' : 'var(--color-text-secondary)' }}>
          {error || 'Loading live subscription and funnel numbers…'}
        </div>
      </div>
    );
  }

  const milestones = [1000, 2500, 5000, 10000].map((target) => {
    const hit = rows.find((r) => r.mrr >= target);
    return { target, hit };
  });
  const breakEven = current.monthlyCosts > 0 ? rows.find((r) => r.profit >= 0) : undefined;
  // Steady state: where payers settle when inflow equals churn.
  const steadyPayers = current.churn > 0 && current.signupGrowth === 0
    ? (current.signupsPerMonth * (current.trialStartRate / 100) * (current.trialToPaidTarget / 100)) / (current.churn / 100)
    : null;

  const levers: { label: string; patch: Partial<Assumptions> }[] = [
    { label: `Trial → paid +2 pts (${current.trialToPaid}→${current.trialToPaidTarget}% becomes ${round1(current.trialToPaid + 2)}→${round1(current.trialToPaidTarget + 2)}%)`, patch: { trialToPaid: current.trialToPaid + 2, trialToPaidTarget: current.trialToPaidTarget + 2 } },
    { label: `Signups ×2 (${current.signupsPerMonth} → ${current.signupsPerMonth * 2}/mo)`, patch: { signupsPerMonth: current.signupsPerMonth * 2 } },
    { label: `Signups grow +10%/mo`, patch: { signupGrowth: current.signupGrowth + 10 } },
    { label: `Churn ${current.churn}% → ${Math.max(0, round1(current.churn - 1))}%/mo`, patch: { churn: Math.max(0, current.churn - 1) } },
    { label: `ARPU +$10 (more monthly, fewer annual)`, patch: { arpu: current.arpu + 10 } },
  ];
  const baseEnd = end?.mrr || 0;
  const leverResults = levers
    .map((l) => {
      const r = project({ ...current, ...l.patch });
      const mrr = r[r.length - 1]?.mrr || 0;
      return { ...l, mrr, gain: mrr - baseEnd };
    })
    .sort((a, b) => b.gain - a.gain);
  const maxGain = Math.max(...leverResults.map((l) => l.gain), 1);

  const goalRows = goals.map((g) => {
    const months = monthsUntil(g.by);
    const r = months >= 1 ? project({ ...current, horizon: months }) : [];
    const projected = goalValue(r[r.length - 1], g.metric);
    const today = g.metric === 'mrr' ? rollup!.mrrGross : rollup!.payers;
    const hitRow = r.find((row) => goalValue(row, g.metric) >= g.target);
    return {
      goal: g,
      months,
      projected,
      progress: g.target > 0 ? Math.min(today / g.target, 1) : 0,
      onTrack: !!hitRow,
      hitMonth: hitRow?.month,
      needTrialToPaid: hitRow ? null : solveFor(current, g, 'trialToPaid', 100),
      needSignups: hitRow ? null : solveFor(current, g, 'signupsPerMonth', 1_000_000),
    };
  });
  const goalsOnTrack = goalRows.filter((g) => g.onTrack).length;

  // Doubling time at the pace the projection settles into: compound monthly
  // growth over its last 6 months. Early months run faster (each new payer is
  // a big share of a small base), so the tail rate is the honest steady one.
  const tailSpan = Math.min(6, rows.length - 1);
  const tailFrom = rows[rows.length - 1 - tailSpan]?.mrr || 0;
  const tailGrowth = tailSpan > 0 && tailFrom > 0 ? Math.pow(end.mrr / tailFrom, 1 / tailSpan) - 1 : 0;
  const doublingMonths = tailGrowth > 0.0005 ? Math.log(2) / Math.log(1 + tailGrowth) : null;
  const firstDouble = rollup!.mrrGross > 0 ? rows.find((r) => r.mrr >= rollup!.mrrGross * 2) : undefined;

  return (
    <>
      <div className={styles.statGrid}>
        <StatTile label="MRR today" value={money0(rollup!.mrrGross)} sub={`${rollup!.payers} paying · ${money0(rollup!.mrrNet)}/mo net`} />
        <StatTile
          label={`MRR in ${current.horizon} months`}
          value={money0(end.mrr)}
          sub={`${Math.round(end.payers)} payers · ARR ≈ ${money0(end.mrr * 12)}`}
          accent
        />
        <StatTile
          label="Net banked over the period"
          value={money0(end.cumulativeNet)}
          sub={current.monthlyCosts > 0
            ? `${money0(end.cumulativeNet - current.monthlyCosts * current.horizon)} after ${money0(current.monthlyCosts)}/mo costs`
            : 'After GST + store cut'}
        />
        <StatTile
          label="Goals on track"
          value={goals.length ? `${goalsOnTrack} / ${goals.length}` : '—'}
          sub={goals.length ? (goalsOnTrack === goals.length ? 'Every goal hit on this scenario' : 'See what each one would take below') : 'Add a goal below'}
        />
        <StatTile
          label="Ceiling at this pace"
          value={steadyPayers !== null ? `${Math.round(steadyPayers)} payers` : '—'}
          sub={steadyPayers !== null
            ? `${money0(steadyPayers * current.arpu)}/mo — where new payers just replace churn`
            : 'No ceiling while signups keep growing'}
        />
      </div>


      <div className={styles.card} style={{ marginBottom: 16 }}>
        <div className={styles.cardHeader}>
          <div>
            <div className={styles.cardTitle}>Goals</div>
            <div className={styles.cardSubtitle}>
              Checked against the {edited ? 'scenario below' : 'live trend'} · synced across devices
            </div>
          </div>
        </div>

        {goalsError && (
          <div style={{ fontSize: 12, color: '#fca5a5', marginBottom: 10 }}>{goalsError}</div>
        )}
        {goalRows.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            No goals yet. Set a target MRR or payer count and a month — you'll see whether the projection gets there, and what it would take if not.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {goalRows.map(({ goal, months, projected, progress, onTrack, hitMonth, needTrialToPaid, needSignups }) => (
              <div key={goal.id} style={{ padding: 12, borderRadius: 10, background: 'rgba(0,0,0,0.18)', border: `1px solid ${months < 1 ? 'rgba(255,255,255,0.04)' : onTrack ? 'rgba(110, 231, 183, 0.25)' : 'rgba(252, 165, 165, 0.2)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {fmtGoal(goal.metric, goal.target)} <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>by {monthLabel(months)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: months < 1 ? 'var(--color-text-secondary)' : onTrack ? '#6ee7b7' : '#fca5a5' }}>
                      {months < 1 ? 'Deadline passed' : onTrack ? `On track · hit ${monthLabel(hitMonth!)}` : `Off track · ${fmtGoal(goal.metric, projected)} projected`}
                    </span>
                    <button
                      className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`}
                      onClick={() => saveGoals(goals.filter((g) => g.id !== goal.id))}
                      title="Remove goal"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', margin: '8px 0 6px' }}>
                  <div style={{ width: `${progress * 100}%`, height: '100%', background: onTrack ? '#6ee7b7' : 'var(--color-accent)', borderRadius: 3 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {Math.round(progress * 100)}% of the way today · {months >= 1 ? `${months} month${months === 1 ? '' : 's'} left` : 'past due'}
                  {months >= 1 && !onTrack && (
                    <>
                      {' · '}To get there, holding everything else:{' '}
                      {needTrialToPaid !== null ? (
                        <button style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-light)', fontWeight: 600 }} onClick={() => update({ trialToPaid: round1(needTrialToPaid + 0.05), trialToPaidTarget: round1(needTrialToPaid + 0.05) })} title="Apply to scenario">
                          trial → paid {round1(needTrialToPaid + 0.05)}% from now
                        </button>
                      ) : <span>no trial → paid rate gets there alone</span>}
                      {' or '}
                      {needSignups !== null ? (
                        <button style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-light)', fontWeight: 600 }} onClick={() => update({ signupsPerMonth: Math.ceil(needSignups) })} title="Apply to scenario">
                          {Math.ceil(needSignups).toLocaleString()} signups/mo
                        </button>
                      ) : <span>no signup volume gets there alone</span>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className={styles.select}
            value={draft.metric}
            onChange={(e) => setDraft({ ...draft, metric: e.target.value as Goal['metric'] })}
            style={{ width: 'auto', padding: '7px 10px' }}
          >
            <option value="mrr">MRR ($/mo)</option>
            <option value="payers">Paying subscribers</option>
          </select>
          <input
            className={styles.input}
            type="number"
            min={1}
            placeholder={draft.metric === 'mrr' ? 'e.g. 5000' : 'e.g. 100'}
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') addGoal(); }}
            style={{ width: 140, padding: '7px 10px' }}
          />
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>by</span>
          <input
            className={styles.input}
            type="month"
            min={defaultGoalMonth(1)}
            value={draft.by}
            onChange={(e) => setDraft({ ...draft, by: e.target.value })}
            style={{ width: 170, padding: '7px 10px' }}
          />
          <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSmall}`} onClick={addGoal}>
            Add goal
          </button>
        </div>
      </div>

      <div className={styles.dashGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>MRR trajectory</div>
              <div className={styles.cardSubtitle}>
                {edited ? 'Your scenario against the live trend' : 'On today’s numbers — edit the assumptions to test a scenario'}
              </div>
            </div>
            <div className={styles.chipRow}>
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  className={styles.chip}
                  onClick={() => update({ horizon: h })}
                  style={current.horizon === h ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
                >
                  {h} mo
                </button>
              ))}
              <span style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
              {[{ on: false, label: 'Linear' }, { on: true, label: 'Log' }].map((o) => (
                <button
                  key={o.label}
                  className={styles.chip}
                  onClick={() => toggleLogScale(o.on)}
                  title={o.on ? 'Log scale — steady % growth shows as a straight line' : 'Linear scale'}
                  style={logScale === o.on ? { background: 'rgba(249, 115, 22, 0.15)', color: 'var(--color-accent-light)', borderColor: 'rgba(249, 115, 22, 0.3)' } : undefined}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', margin: '-4px 0 10px' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-secondary)' }}>Doubling time</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: doublingMonths ? 'var(--color-accent-light)' : 'var(--color-text-secondary)' }}>
              {doublingMonths
                ? doublingMonths > 120 ? '10+ yrs' : `${doublingMonths < 10 ? doublingMonths.toFixed(1) : Math.round(doublingMonths)} mo`
                : 'Not doubling'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
              {doublingMonths
                ? `at ${round1(tailGrowth * 100)}%/mo, the pace by ${monthLabel(current.horizon)}`
                : 'MRR is flat or shrinking by the end of the projection'}
              {rollup!.mrrGross > 0 && (firstDouble
                ? ` · today’s ${money0(rollup!.mrrGross)} first doubles by ${monthLabel(firstDouble.month)}`
                : ` · today’s ${money0(rollup!.mrrGross)} doesn’t double within ${current.horizon} mo`)}
            </span>
          </div>
          <ProjectionChart
            rows={rows}
            liveRows={edited ? liveRows : []}
            startMrr={rollup!.mrrGross}
            logScale={logScale}
            goals={goals.filter((g) => g.metric === 'mrr' && monthsUntil(g.by) >= 1 && monthsUntil(g.by) <= current.horizon)
              .map((g) => ({ month: monthsUntil(g.by), target: g.target }))}
          />
          {edited && liveEnd && (
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 8 }}>
              Live trend ends at {money0(liveEnd.mrr)}/mo — your scenario is{' '}
              <span style={{ color: end.mrr >= liveEnd.mrr ? '#6ee7b7' : '#fca5a5', fontWeight: 600 }}>
                {end.mrr >= liveEnd.mrr ? '+' : ''}{money0(end.mrr - liveEnd.mrr)}/mo
              </span>{' '}
              by {monthLabel(current.horizon)}.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 16 }}>
            {milestones.map(({ target, hit }) => (
              <div key={target} style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{money0(target)}/mo MRR</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: hit ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                  {hit ? monthLabel(hit.month) : `Not in ${current.horizon} mo`}
                </div>
              </div>
            ))}
            {current.monthlyCosts > 0 && (
              <div style={{ padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Break-even (net ≥ costs)</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, color: breakEven ? '#6ee7b7' : 'var(--color-text-secondary)' }}>
                  {breakEven ? monthLabel(breakEven.month) : `Not in ${current.horizon} mo`}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Assumptions</div>
              <div className={styles.cardSubtitle}>Seeded from live data · what-if edits stay in this browser</div>
            </div>
            {scenario && (
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSmall}`} onClick={resetToLive}>
                Reset to live
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Paying subscribers today" value={current.startPayers} live={live.startPayers} onChange={(v) => update({ startPayers: v })} />
            <Field label="Signups per month" value={current.signupsPerMonth} live={live.signupsPerMonth} hint="Last 28 days" onChange={(v) => update({ signupsPerMonth: v })} />
            <Field label="Signup growth" suffix="%/mo" value={current.signupGrowth} live={live.signupGrowth} hint="Measured, last 90 days" onChange={(v) => update({ signupGrowth: v })} />
            <Field label="Signups who start a trial" suffix="%" value={current.trialStartRate} live={live.trialStartRate} onChange={(v) => update({ trialStartRate: v })} />
            <Field label="Trial → paid today" suffix="%" value={current.trialToPaid} live={live.trialToPaid} hint="Finished trials" onChange={(v) => update({ trialToPaid: v })} />
            <Field label="Trial → paid climbs to" suffix="%" value={current.trialToPaidTarget} live={live.trialToPaidTarget} hint="Assumed — conversion work" onChange={(v) => update({ trialToPaidTarget: v })} />
            <Field label="…over" suffix="months" value={current.trialToPaidRampMonths} live={live.trialToPaidRampMonths} hint="Then holds" onChange={(v) => update({ trialToPaidRampMonths: Math.round(v) })} />
            <Field label="Monthly churn" suffix="%" value={current.churn} live={live.churn} hint="Assumed — not measured yet" onChange={(v) => update({ churn: v })} />
            <Field label="Revenue per payer" prefix="$" suffix="/mo" value={current.arpu} live={live.arpu} hint="Gross, store price" onChange={(v) => update({ arpu: v })} />
            <Field label="Monthly running costs" prefix="$" value={current.monthlyCosts} live={live.monthlyCosts} hint="Optional — adds break-even" onChange={(v) => update({ monthlyCosts: v })} />
          </div>
        </div>
      </div>

      <div className={styles.dashGrid} style={{ marginTop: 16 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>Month by month</div>
              <div className={styles.cardSubtitle}>New payers land the month they sign up (trial is 14 days)</div>
            </div>
          </div>
          <div className={styles.tableWrap} style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: 'right' }}>Signups</th>
                  <th style={{ textAlign: 'right' }}>Trial → paid</th>
                  <th style={{ textAlign: 'right' }}>New payers</th>
                  <th style={{ textAlign: 'right' }}>Churned</th>
                  <th style={{ textAlign: 'right' }}>Payers</th>
                  <th style={{ textAlign: 'right' }}>MRR</th>
                  <th style={{ textAlign: 'right' }}>{current.monthlyCosts > 0 ? 'Profit' : 'Net'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const bottom = current.monthlyCosts > 0 ? r.profit : r.net;
                  return (
                    <tr key={r.month} style={{ cursor: 'default' }}>
                      <td>{monthLabel(r.month)}</td>
                      <td style={{ textAlign: 'right' }}>{Math.round(r.signups).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{r.trialToPaid.toFixed(1)}%</td>
                      <td style={{ textAlign: 'right' }}>{r.newPayers.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)' }}>{r.churned.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{r.payers.toFixed(1)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-accent-light)' }}>{money0(r.mrr)}</td>
                      <td style={{ textAlign: 'right', color: bottom >= 0 ? '#6ee7b7' : '#fca5a5' }}>{money0(bottom)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <div className={styles.cardTitle}>What moves the needle</div>
              <div className={styles.cardSubtitle}>Extra MRR by {monthLabel(current.horizon)} from one change — click to apply</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leverResults.map((l) => (
              <button
                key={l.label}
                onClick={() => update(l.patch)}
                style={{ all: 'unset', cursor: 'pointer', display: 'block' }}
                title="Apply this change to the scenario"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{l.label}</span>
                  <span style={{ color: '#6ee7b7', fontWeight: 600, whiteSpace: 'nowrap' }}>+{money0(l.gain)}/mo</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.max(0, (l.gain / maxGain) * 100)}%`, height: '100%', background: 'var(--color-accent)', borderRadius: 3 }} />
                </div>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 12, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
            Model: payers = last month × (1 − churn) + signups × trial-start × trial→paid, with trial→paid
            ramping linearly from today's rate to the target, then holding. Annual plans are folded into
            revenue per payer and churn is spread evenly, so a cohort of annual renewals will land lumpier than this.
            Square app fees aren't included.
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label, value, live, onChange, prefix, suffix, hint,
}: {
  label: string;
  value: number;
  live: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const changed = Math.abs(value - live) > 1e-9;
  return (
    <label style={{ display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: changed ? 'var(--color-accent-light)' : 'var(--color-text-secondary)', fontSize: 11 }}>
          {changed ? `live: ${prefix || ''}${round1(live)}${suffix || ''}` : hint || 'live'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prefix && <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{prefix}</span>}
        <input
          className={styles.input}
          type="number"
          min={0}
          step="any"
          value={Number.isFinite(value) ? round1(value) : ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            onChange(Number.isFinite(v) && v >= 0 ? v : 0);
          }}
          style={{ padding: '7px 10px' }}
        />
        {suffix && <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{suffix}</span>}
      </div>
    </label>
  );
}

function ProjectionChart({
  rows, liveRows, startMrr, goals, logScale,
}: {
  rows: MonthRow[];
  liveRows: MonthRow[];
  startMrr: number;
  goals: { month: number; target: number }[];
  logScale: boolean;
}) {
  const W = 640;
  const H = 240;
  const pad = { top: 12, right: 12, bottom: 24, left: 52 };
  const series = [startMrr, ...rows.map((r) => r.mrr)];
  const liveSeries = liveRows.length ? [startMrr, ...liveRows.map((r) => r.mrr)] : [];
  const all = [...series, ...liveSeries, ...goals.map((g) => g.target)];
  const max = Math.max(...all, 1) * 1.08;
  const n = series.length - 1;
  const x = (i: number) => pad.left + (i / Math.max(n, 1)) * (W - pad.left - pad.right);
  const plotH = H - pad.top - pad.bottom;

  // Log scale spans whole decades around the data. $0 (no payers yet) has no
  // log, so it pins to the floor rather than vanishing off the chart.
  const positives = all.filter((v) => v > 0);
  const logLo = Math.pow(10, Math.floor(Math.log10(Math.max(Math.min(...positives, max), 1))));
  const logHi = Math.max(Math.pow(10, Math.ceil(Math.log10(Math.max(...all, 1)))), logLo * 10);
  const y = logScale
    ? (v: number) => pad.top + (1 - (Math.log10(Math.max(v, logLo)) - Math.log10(logLo)) / (Math.log10(logHi) - Math.log10(logLo))) * plotH
    : (v: number) => pad.top + (1 - v / max) * plotH;
  const floor = logScale ? logLo : 0;
  const line = (s: number[]) => s.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line(series)} L ${x(n)} ${y(floor)} L ${x(0)} ${y(floor)} Z`;

  let ticks: number[];
  if (logScale) {
    const decades = Math.round(Math.log10(logHi / logLo));
    ticks = [];
    for (let d = logLo; d <= logHi * 1.0001; d *= 10) {
      ticks.push(d);
      // Few decades on screen → add 2× and 5× gridlines so it isn't bare.
      if (decades <= 2 && d < logHi) ticks.push(d * 2, d * 5);
    }
  } else {
    ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => (max / 1.08) * t);
  }
  const xTicks = Array.from({ length: n + 1 }, (_, i) => i).filter((i) => i % (n > 12 ? 6 : 3) === 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label={`Projected MRR by month, ${logScale ? 'log' : 'linear'} scale`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">{money0(t)}</text>
        </g>
      ))}
      {xTicks.map((i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">
          {i === 0 ? 'Now' : monthLabel(i)}
        </text>
      ))}
      <path d={area} fill="rgba(249, 115, 22, 0.12)" />
      {liveSeries.length > 0 && (
        <path d={line(liveSeries)} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeDasharray="4 4" />
      )}
      <path d={line(series)} fill="none" stroke="#f97316" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(n)} cy={y(series[n])} r={3.5} fill="#f97316" />
      {goals.map((g) => (
        <g key={`${g.month}-${g.target}`}>
          <line x1={x(g.month)} x2={x(g.month)} y1={y(g.target)} y2={y(floor)} stroke="rgba(110, 231, 183, 0.25)" strokeDasharray="2 3" />
          <circle cx={x(g.month)} cy={y(g.target)} r={4.5} fill="none" stroke="#6ee7b7" strokeWidth={1.5} />
          <text x={x(g.month)} y={y(g.target) - 8} textAnchor="middle" fontSize="10" fill="#6ee7b7">Goal {money0(g.target)}</text>
        </g>
      ))}
      {liveSeries.length > 0 && (
        <g fontSize="10">
          <line x1={pad.left + 6} x2={pad.left + 22} y1={pad.top + 6} y2={pad.top + 6} stroke="#f97316" strokeWidth={2} />
          <text x={pad.left + 26} y={pad.top + 9} fill="var(--color-text-secondary)">Your scenario</text>
          <line x1={pad.left + 110} x2={pad.left + 126} y1={pad.top + 6} y2={pad.top + 6} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} strokeDasharray="4 4" />
          <text x={pad.left + 130} y={pad.top + 9} fill="var(--color-text-secondary)">Live trend</text>
        </g>
      )}
    </svg>
  );
}

function StatTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={styles.statCard} style={accent ? { borderColor: 'rgba(249, 115, 22, 0.25)' } : undefined}>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue} style={accent ? { color: 'var(--color-accent-light)' } : undefined}>{value}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
    </div>
  );
}
