# Ads Growth System — money in, money out, and the loop between (v2, 2026-07-26)

v2 after adversarial validation — every changed number/structure is justified in `research/fb-ads-plan-validation-2026-07.md`. Companions: `facebook-ads-playbook-2026-07.md` (creative + copy), `research/fb-headline-research-2026-07.md` (headline research), `marketing/ads-log.md` (learning ledger).

**Objective:** maximise `(LTV − CAC) × volume`. Monetised users are the scoreboard; CTR is a diagnostic.

**The v2 strategic reframe (evidence-driven):** no company in this vertical demonstrably grew on Meta prospecting. The proven zero-to-one channels for sub-$50 tradie apps are search intent (app-store + Google + comparison sites), association/wholesaler partnerships, and cash referral programs — with Meta as amplifier (retargeting + creator-code ads) once trial→paid works. This doc therefore runs a **channel portfolio** with Meta as one seat, not the engine.

---

## 1. Unit economics

| Input | Value | Notes |
|---|---|---|
| Price | $49/mo founding · $328/yr · $99/mo post-cap | live |
| Working LTV | **$300** (conservative) | implies 16%/mo churn — benchmarks say 3–7%/mo → LTV $690–1,600. Revisit with first real cohort data; the CAC ceiling loosens a lot if churn is normal |
| CAC ceiling | **≤$150** while LTV unproven | top-decile vs Meta norms (A$310–920 for sub-$50/mo SaaS) — treat as a discipline, expect to miss it on Meta prospecting early |
| Payback target | <3mo now, relax to <6mo at scale | industry considers <12mo good |

**Funnel ceilings (planning bands, not hopes):**

| Rung | Benchmark reality | Our target |
|---|---|---|
| Link CTR | median ≈1% | triage: bottom of batch dies; floor 0.5% |
| CPC (AU) | median ≈A$1, lead-optimised ≈A$3 | ≤$3 |
| Cost per trial-start | SaaS paid norms A$60–100+; only same-band Meta comp (ZenMaid) paid $90–120 | **A$40–80 planning band; ≤$30 = stretch** |
| Trial→paid needed | no-CC opt-in benchmark 8–18%; ChartMogul median 8% | **≥10% makes $40–80 trials viable at benchmark LTV** |

**The decisive variable is trial→monetised** (history ~2%, benchmark 8–18%). CAC = cost/trial ÷ conversion. Every point of conversion is worth more than any ad optimisation — the validation research independently re-derived the existing **≥5% spend gate**. Conversion work remains priority #1.

## 2. Channel portfolio (ranked by vertical evidence)

| # | Channel | Why | Cost shape | Status |
|---|---|---|---|---|
| 1 | **ASO + Apple Search Ads** ("quote app", "invoice app tradie") | THE proven paid channel for sub-$50 trade apps (Invoice Simple, Invoice2go, Joist) | intent-priced, starts ~$10/day | not started |
| 2 | **Google Search ads + comparison-site listings** (Capterra/G2/Software Advice, TradiePad, besttradiesoftware.com) | where AU tradie purchase decisions get shaped; simPRO buys placement here | CPL higher than Meta but intent converts | not started |
| 3 | **Association/wholesaler partnerships** (MEA/NECA/MPAQ-style member discounts; Reece relationship = Fergus playbook) | ~50% of ServiceTitan's early base; Tradify×MEA live right now | BD emails + member discount, ~$0 media | Reece contact exists |
| 4 | **Referral with real cash** (tradie→tradie + accountant/bookkeeper) | every scaled player pays: ServiceM8 $500+20% share, Tradify $160, HCP $200/$200 | pay-on-success only | not built |
| 5 | **Meta** — retargeting always; prospecting per §3–5; creator-code format when budget allows | amplifier, not engine; Tradify's sustained Meta motion is influencer-code ads | $90+/trial realistic prospecting | creative bank ready |

Meta prospecting stays in the plan because the creative system is built and the learnings transfer (hooks proven on Meta feed the website, ASA copy, emails) — but if forced to choose where the next $500 goes for *income*, the evidence ranks 1–4 above it.

## 3. Meta campaign architecture (corrected)

```
Campaign: qm-leads  (Advantage+ Leads or CBO — ONE campaign)
  Ad set: ONE, broad AU 22–55, all placements, exclude customer list
    → ALL creatives in it (5–10 genuinely distinct concepts, <60% similarity
      so Andromeda doesn't collapse them into one entity)
Campaign: qm-retargeting  (launch only when matched audience ≥1,000)
```

- **No traffic-objective phase** (the "traffic trap" — clicker CTR doesn't predict conversion performance). Launch on the conversion objective from dollar one.
- **Optimization event:** `SignupStart` micro-conversion (CTA click / auth-start on quotemateapp.au), NOT the completed Lead. Reason: learning needs ~50 events/wk (budget ≈ CPA×50÷7); a $40/day budget supports learning only if the event costs ≲$5.60. Completed signups stay the *reporting* truth; the cheap upstream event is the *optimization* signal.
- **Pixel + CAPI with event_id dedup from day one** (pixel-only loses 25–40% of conversions — fatal at our volume). Same-domain simplification (verified): web app serves at `quotemateapp.au/app`, so no cross-domain cookie forwarding needed; UTM/fbclid just have to survive the internal nav to `/app`.
- Expect **Learning Limited anyway** at this budget — that's normal for small accounts; consolidation minimizes the damage.
- Naming discipline unchanged: ad name = `utm_content` exactly.

## 4. Budget ladder

| Phase | Budget | Entry | Exit up | Hard stop |
|---|---|---|---|---|
| 0: Build | $0 | now | tracking live + end-to-end tested | — |
| 1: Creative test | **$25/day, $500 cap ⇒ ~3 weeks = 3 decision cycles** | tracking live | a creative at ≤A$60/signup with healthy CTR | $150 spent, zero signups (tracking bug or creative catastrophe — diagnose, don't just rebuy) |
| 2: Conversion proof | $50/day, $1,500/mo | Phase-1 winner **AND trial→monetised ≥5%** | cost/trial ≤A$60 sustained 2 wks AND attributed monetised >0 | trailing-14d cost/trial >A$120 |
| 3: Scale | +20% per 3–4 days (never >30%) | CAC ≤$150 on ≥5 attributed monetised | keep climbing while CAC ≤ ceiling; recompute ceiling when real LTV lands | CAC >2× ceiling trailing 30d, or payback >6mo |
| 4: Portfolio expand | shift marginal $ to best CAC channel (likely ASA/Google) | 3 profitable months on any channel | — | per-channel same rules |

Cash rule unchanged: monthly spend ≤ attributed MRR × 3 once scaling. Founding-price ads: re-verify `config/foundingOffer` weekly, fail closed.

## 5. Kill / iterate / scale rules (corrected to practitioner + statistical norms)

**Staged gates — never judge a stage on the previous stage's metric:**

1. **Triage (~1,000 impressions/ad):** rank the batch by link CTR; kill the bottom 20–30% *relative to the batch*. Absolute kill only below 0.5% link CTR. CTR is a diagnostic, never the final verdict.
2. **Conversion judgment:** zero signups after **~3× target cost-per-signup in spend** (~95% confidence it's below target) → kill. At target A$60 that's ~$180/creative — which is why Phase 1 tests ≤4 concepts at a time, sequentially.
3. **Timing discipline:** no decisions on data <72h old (attribution lag); minimum 1 week runtime unless catastrophic (CPC >2× account average at ~20% of threshold spend, or broken tracking → kill immediately).
4. **Diagnose survivors:** high CTR + no signups = promise/landing mismatch; low CTR + good signups = weak scroll-stopper; both good = scale.
5. **Iteration mix — kill the incest:** each cycle ships **one iteration of the best performer (change ONE element — hook first, it fatigues fastest) + one net-new concept** from the playbook bench. Never >60% similar to a live ad. "Only breed the winner" is a named failure mode (iteration paralysis) and Andromeda punishes look-alike fleets.
6. **Scale:** +20% every 3–4 days on winners (confirmed consensus). Pause increases if CPA rises >25% for 3 days.
7. **Fatigue watch, no timer:** act on signals only — frequency >2.5, CTR −20–25% from baseline, first-time-impression ratio <50%. At <$2k/mo spend creatives often live for months; don't retire winners on a calendar.

Creative volume expectation at this spend: a handful of concepts per month, tested sequentially — not a weekly churn machine (~4–5% of ads become winners; ~20 concepts ≈ 1 winner; production budget ~10% of spend).

## 6. Weekly cadence (Monday, ~30 min) — unchanged mechanics, corrected decisions

1. Export Meta spend per ad → ads log.
2. Pull attribution rollup (admin CRM) per `utm_content`.
3. Scoreboard: cost/signup, cost/trial, CAC-to-date, attributed MRR.
4. Apply §5 gates **only to ads past their spend/time thresholds**.
5. Ledger entry: hypothesis → result → learned → next.
6. Gates check (§4) + founding-cap truth check.
7. Ship the cycle's two creatives (1 iterate + 1 new) if a slot opened.

Monthly: cohort retention of ad-acquired vs organic (updates LTV → recomputes CAC ceiling); channel-portfolio review (§2) — move marginal dollars to whichever channel's CAC is winning.

## 7. Failure modes (v2 additions marked)

- Attribution mirage → decide on UTM floor numbers + baseline lift, not Meta claims.
- Winning the wrong metric → trial-start is the first "winner" metric; SignupStart is optimization fuel only. **(v2: don't confuse the optimization event with the success metric.)**
- Peeking → Monday decisions, thresholds only.
- **(v2) False negatives** — killing good ads on thin data was v1's biggest error; the 3×-CPA rule exists to prevent it.
- **(v2) Entity collapse** — near-identical variants cannibalize under Andromeda; keep concepts distinct.
- **(v2) Channel tunnel-vision** — Meta CAC must compete with ASA/Google/partnership CAC monthly, or lose its budget.
- Ad-acquired cohort quality vs organic; compliance drift (stats stay on the verified list) — unchanged.

## 8. Critical path

1. **Tracking build** — UTM/fbclid capture at `/app` signup → `users/{uid}.attribution`; CTA param passthrough; Pixel + CAPI + `SignupStart` event; CRM rollup per utm_content. (~1–1.5 dev-days now including CAPI.)
2. **Parallel zero-budget channel starts:** Apple Search Ads basic campaign on brand+category terms; Capterra/G2/TradiePad listings; draft the MEA/NECA-style partnership pitch (member discount + code); spec the $-per-referral program on existing primitives.
3. qm-d1 demo video (best expected creative in the deck).
4. End-to-end attribution test, then Phase 1 at $25/day.
