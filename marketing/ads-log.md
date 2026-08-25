# Ads learning ledger

Append-only weekly log per `fb-ads-growth-system-2026-07.md` §7. Newest week on top.

Template:

```
## Week of 2026-MM-DD
Spend: $X | Signups: N ($/ea) | Trials: N ($/ea) | Monetised: N | Attributed MRR: $X | Verdict: <one line>
| ad | spend | impr | CTR | clicks | signups | trials | monetised | action + why |
|---|---|---|---|---|---|---|---|---|
Hypothesis tested:
Learned:
Next test:
```

---

## Phase 1, full run to date — 2026-07-29 → 2026-08-11 (14 days)

Backfilled 2026-08-11. **The Monday cadence never ran** — this covers all three
missed decision cycles in one entry. Numbers are Ads Manager (spend, results) +
GA4 (sessions, on-site clicks) + `adminStats/eventFunnel` attribution rollup
(signups/trials/monetised — the money truth). Impressions/CTR/frequency are NOT
in this entry: Ads Manager wedged before the columns could be read. Add them on
the next pass; every judgment below stands without them.

Spend: **$317.71** | Signups: **4 ($79.43/ea)** | Trials: **3 ($105.90/ea)** | Monetised: **0** | Attributed MRR: **$0** | Verdict: creative read is inconclusive because budget never spread; the landing page is the binding constraint.

| ad | spend | sessions | $/session | SignupStart | $/SignupStart | signups | trials | monetised | action + why |
|---|---|---|---|---|---|---|---|---|---|
| qm-a1 (kitchen 9pm, raw native) | $248.60 | 323 | $0.77 | 13 | $19.12 | 3 | 2 | 0 | **Keep.** Only ad with real data. Above the A$60/signup target but not at the 3×-CPA kill line. |
| qm-c1 (boots+toolbox, raw native) | $49.80 | 46 | $1.08 | 2 | $24.90 | 1 | 1 | 0 | **Keep.** Dearest traffic, but it produced a signup and a trial per §5.2 it is nowhere near judgment spend. |
| qm-b1-news-inset (article card + inset) | $10.63 | 27 | $0.39 | 0 | — | 0 | 0 | 0 | **Untested — do not kill.** 6% of judgment spend. Cheapest traffic in the batch. |
| qm-b1-tvnews (TV broadcast still) | $5.10 | 11 | $0.46 | 0 | — | 0 | 0 | 0 | **Untested — do not kill.** 3% of judgment spend. |
| qm-f1-news (late-invoice stat card) | $3.58 | 9 | $0.40 | 0 | — | 0 | 0 | 0 | **Untested — do not kill.** 2% of judgment spend. |
| *(non-campaign: "New App promotion Ad", off, $190.83 lifetime — excluded)* | | | | | | | | | |

Site-side funnel across all 416 paid sessions: **10 product clicks** (7 `web_app_click`
+ 3 `google_play_click`) → **4 accounts**. That is **2.4% of paid visitors clicking
anything that leads to the product**, and **0.96% signing up**.

**Hypothesis tested:** that five distinct concepts in one broad CBO ad set would
each earn enough delivery to rank by CTR, and that the winning hook would show up
inside a $500 Phase-1 cap.

**Learned:**

1. **Budget consolidation defeated the test.** qm-a1 took 78% of spend; three of
   five concepts got $3.58–$10.63 — 2–6% of the ~$180 (3× target CPA) needed to
   judge them. The five-concept batch produced **one** data point, not five. The
   growth system's "ONE broad ad set, all creatives" rule optimises against entity
   collapse but hands concept selection to Meta, which picks early and never looks
   back. At $25/day those two goals are in direct conflict.
2. **The starved ads were not losing on cost.** Cost per landing session ran
   $0.39–$0.46 for the three news-card creatives vs $0.77 (qm-a1) and $1.08
   (qm-c1). Tiny samples, but the ads Meta abandoned bought *cheaper* traffic than
   the ones it backed. Nothing here says the news cards are weak; they were
   defunded before they could speak.
3. **Optimization could never have worked at this budget.** SignupStart cost
   $19–25 against the ≲$5.60 the growth system §3 calculated as the ceiling for
   learning at $25/day. 15 events in 14 days vs Meta's ~50/week. Every ad sat
   Learning Limited for the entire run and always would have. At this spend
   Phase 1 buys a *creative and landing-page read*, not an optimised campaign —
   the plan should say so instead of implying the algorithm will help.
4. **It is an intent gap, not a broken page.** *(Corrected 2026-08-11 — the first
   version of this entry called the landing page "the binding constraint". The
   organic comparison says otherwise.)* Same page, same window, **mobile only**:

   | | sessions | product clicks | rate | avg session | bounce |
   |---|---|---|---|---|---|
   | organic mobile | 146 | 37 | **25.3%** | 263s | 29% |
   | paid mobile | 395 | 10 | **2.5%** | 278s | 39% |

   A **10× gap on the identical page and the same device class** — and paid
   visitors *stay longer* than organic ones (278s vs 263s) before leaving. They
   are not bouncing, not mis-rendering, not failing to find the button. They read
   it and don't want it yet. The page closes people who already decided to look;
   it has no mechanism to *create* intent in someone interrupted mid-scroll.
   Prescribing "fix the page" would have been chasing the wrong variable.
5. **Paid traffic leaks to the app stores.** 3 of 10 product clicks went to Google
   Play, whose badge hardcodes `referrer=utm_source%3Dquotemateapp.au%26utm_medium%3Dwebsite` —
   so those installs are attribution-dead *and* pay an install-then-signup tax.
   The header's "Download App" button and the two hero badges compete with the
   web CTA on the page paid traffic lands on, against the playbook §5 rule that
   ad traffic goes to the web app only.
6. **Paid budget is funding the hero A/B test.** Paid split 207/212 across
   variants A/B. On product clicks A leads 6–4 (`web_app_click` 3 v 4,
   `google_play_click` 3 v 0) and on `onboarding_completed` 4 v 3; B leads only on
   generic `cta_click` (6 v 1), which is not a product click. So the variants are
   **indistinguishable at this sample size** — but half the paid budget is still
   being spent randomising the page under a creative test, which makes both tests
   unreadable. Pin paid to one variant; the choice between them is a tiebreak, not
   a finding.
7. **The plumbing is sound.** Verified live: the hero CTA carries
   `/app?utm_source=facebook&utm_medium=paid&utm_campaign=qm-launch&utm_content=qm-a1`,
   the rollup joins it to signups/trials, and Meta's SignupStart fires. Nothing
   in this entry is a tracking artefact. One open discrepancy: GA4 counts 7
   `onboarding_completed` on paid sessions vs 4 attributed accounts — worth a look
   before trusting per-ad signup counts below ~5.

**Next test:** see `marketing/ads-cycle2-2026-08-11.md`. Order of operations is
landing page first, campaign structure second, creative third — that is the order
of the constraints, not of the fun.
