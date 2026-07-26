# Growth-system plan validation — 2026-07-26

Four research streams pressure-tested `marketing/fb-ads-growth-system-2026-07.md` v1. Verdicts below drove the v2 rewrite. Full agent outputs summarized; keep this as the "why" behind v2's numbers.

## Verdict scorecard

| v1 element | Verdict | Correction |
|---|---|---|
| 4 ABO ad sets × $10/day | **WRONG** — each needs ~50 optimization events/wk to exit learning (budget ≈ CPA×50÷7 → $10/day only works if event costs ~$1.40); 4-way split is the textbook Learning-Limited anti-pattern | 1 campaign, 1 broad ad set (Advantage+ Leads or CBO), all creatives in it. Andromeda-era test: 1×25 creatives beat 5×5 by +17% conv / −16% cost |
| Traffic objective for first $100 | **WRONG** — "traffic trap": optimizes for serial clickers; CTR on that population doesn't predict conversion performance; objective can't be switched, needs new campaign anyway | Launch on the real objective; solve event volume by optimizing a higher-frequency upstream event (signup-start micro-conversion) |
| Pixel plan without CAPI | **INSUFFICIENT** — pixel-only loses ~25–40% of attributable conversions; at 5–15 leads/wk that's fatal to optimization | Pixel + CAPI with event_id dedup = baseline. Mitigating fact (verified): web app is served at quotemateapp.au/app — same domain, so no cross-domain cookie problem |
| Kill at $15 if CTR<1%; $30 zero-signup kill | **TOO AGGRESSIVE** — practitioner norm: CTR triage at ~1,000 impressions is *relative* (kill bottom 20–30% of batch; absolute floor 0.5% link CTR); zero-conversion kill at ~3× target CPA spend (~95% Poisson confidence); no decisions on data <48–72h old (attribution lag), ≥1 week runtime unless catastrophic | Staged gates rewritten in v2 §5 |
| Breed-only-from-winner | **NAMED FAILURE MODE** ("iteration paralysis"); Andromeda collapses ads >~60% similar into one entity (they cannibalize); leading buyers run majority net-new concepts | Each cycle = 1 winner-iteration + 1 net-new concept; keep variants genuinely distinct |
| +20% budget per 3 days | **CONFIRMED** (heuristic, not official constant; >30% risks learning reset) | Kept |
| Fatigue: freq >2.5, CTR −30% | **CONFIRMED** — and at <$2k/mo fatigue is much slower (months); don't retire winners on a timer | Kept, timer removed |
| CPC $1.50–4 AUD | **CONSERVATIVE** — AU all-industry median CPC ≈ A$1, CPM ≈ A$14 | Kept as planning band |
| Cost/signup ≤$15, cost/trial ≤$30→$15 | **TOO OPTIMISTIC** — US lead-form fill averages ~A$42; paid SaaS trial-starts ≈ A$60–100+; only Meta comp in this price band (ZenMaid, $49–100/mo) paid **~$90–120/trial** | Planning band A$40–80/trial; $30 = top-quartile stretch |
| LTV $300 (6-mo retention) | **TOO PESSIMISTIC** — implies 16%/mo churn vs SMB norms 3–7%/mo (→ LTV A$690–1,600) | Keep $300 until real churn data (zero real-payer history), but CAC ceiling gets a benchmark-LTV sensitivity row |
| CAC ≤$150 | Internally consistent; **top-decile vs Meta norms** (A$310–920 for sub-$50/mo products) | Kept as founding-era target with eyes open |
| Payback <3 months | **STRICTER THAN NEEDED** (industry: <12mo good, 18mo median) | Relax to <6mo at scale phase |
| Trial→paid needed (10–20%) | Benchmark band for no-CC opt-in trials: **8–18%** (First Page Sage 17–18%; ChartMogul median 8%). QuoteMate history ~1–2% → **the decisive variable, re-confirming the 5% spend gate independently** | Gate unchanged; conversion work stays priority #1 |

## The strategic finding: channel evidence

Across Tradify, ServiceM8, Fergus, simPRO, AroFlo, Jobber, Housecall Pro, ServiceTitan: **zero grew primarily on Meta prospecting.** The vertical's proven zero-to-one channels:

1. **App-store search / ASO / Apple Search Ads** — the proven *paid* channel for sub-$50 mobile trade apps (Invoice Simple's primary channel at six-figure monthly budgets; Invoice2go #1-invoicing-app pattern; Joist).
2. **Google search intent + AU comparison layer** — TradiePad, besttradiesoftware.com, Capterra/G2/Software Advice; simPRO literally buys placement there (its own demand-gen JD lists Meta last).
3. **Association + wholesaler partnerships** — Tradify×Master Electricians (50%-off member deal), Fergus×NECA/MPAQ/Reece/Plumbing World, ServiceTitan×Nexstar (~4% rebate for member-list access; association-referred = ~50% of customers). Solo-founder-feasible: BD emails, not budgets. (QuoteMate's existing Reece relationship = the Fergus playbook.)
4. **Paid referral with real cash** — ServiceM8: $500/client + up to 20% rev share to accountants; Tradify: $160/conversion; Housecall Pro: $200/$200 two-sided. Winners institutionalize word of mouth.
5. **Meta = amplifier, not engine** — where it appears sustained, it's **creator-code ads** (Tradify × tradie influencers with discount codes), adopted at ~$10M+ ARR with a CRO machine behind it. ZenMaid's frank Meta case study: FB only worked because nurture + retention already worked.

Implication: FB ads stay in the portfolio (creative bank is built, retargeting + creator-format prospecting when conversion works), but they are **not the primary income engine at this stage** — search intent, partnerships, and referral rank ahead on evidence, and all are cheaper than the ~A$90+/trial Meta prospecting realistically costs.
