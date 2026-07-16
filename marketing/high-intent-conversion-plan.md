# QuoteMate high-intent conversion plan (v2)

**Status:** reconciled 2026-07-17 against the shipped conversion engine (QuoteMate PRs #43–#48), the live event funnel, and `research/email-payment-audit-2026-07-16.md`. Supersedes v1 of this document, whose baseline, target, and roughly half of its interventions predated the engine work shipped on 2026-07-16. Amended same day after review: behavioural-state model (Intervention 0), cross-channel pressure budget, value-evidence hierarchy, reason-capture timing, and qualitative measurement; trial extensions and plan-recommendation segmentation parked.

## Objective

**North star: 20% of trials become monetised**, where monetised = a billed Pro subscription OR ≥1 real Square payment collected (webhook-written `payments[].method === 'square'`; manual cash never counts). This is the committed two-path model: Pro subscriptions (Path A) and free tradies collecting through Square for the platform fee (Path B) are both revenue. Any plan that optimises Path A at Path B's expense is a regression.

**Live baseline (first funnel aggregation, 2026-07-16):** 225 auth users, 146 trials, **trial→monetised 2.05%** (2 Pro + 1 Square). Path B: 7 Square-connected, 1 ever collected. Interim milestone: **5% trial→monetised gates any paid marketing spend.**

Secondary objectives: increase annual share of new Pro subscriptions, and increase the share of trials that collect a first payment through Square.

This plan uses strong, timely sales pressure without dark patterns. QuoteMate should be persistent and commercially direct, but never fabricate scarcity, hide the Free plan, obstruct cancellation, preselect a paid purchase, or shame a user. Pressure comes from the user's real job activity, real trial deadline, real saved work, and the real founding-member cap.

## What already exists — do not rebuild

The engine below is live or merged. Every intervention in this plan is scoped as an **extension** of these surfaces, never a parallel implementation.

| Shipped | Where | What it does |
|---|---|---|
| Event funnel (PR #43) | `analyticsService.ts` → `users/{uid}/events`; `eventFunnel.helpers.ts`; `aggregateEventFunnel` 6h cron; `/admin/analytics` | Two-path funnel with `furthestStage` per user; `paywall_viewed/dismissed`, `checkout_started`, `purchase_completed/failed`, `trial_started`, `square_connected` |
| Founding cap, cap-only (PR #45) | `functions/src/foundingOffer.ts`; `config/foundingOffer` (public read); paywall; website `FoundingPriceNote.tsx` | FOUNDING_CAP=100, NEXT_PRICE $99/$658; real spots-left from billed subs; display suppressed when cap fills or doc unavailable |
| 5-step lifecycle emails (PR #46, LIVE) | `lifecycleEmails.ts` + helpers, `trialLifecycleDaily` 07:30 Brisbane | day 0 value, day 3 Square pitch, day 7 real-numbers recap, T-3 ending + founding spots, ended + free-plan reassurance; send-once flags; dry-run preview via `functions/scripts/lifecycleDryRun.ts` |
| Square trial opt-in (PR #44) | `quoteDeliveryGuard.ts`, `SendDocumentDialog.tsx` | "Get paid on this quote" row in the send sheet for trial users; never blocks |
| Square nudges (PR #47) | `squareNudge.helpers.ts`, same cron | connected-but-idle (≥5d) and expired-never-connected nudges; monetised users never nudged |
| Cross-campaign suppression (PR #48) | lifecycle ↔ onboarding drip | never two campaign emails to one user the same morning (20h window, both directions) |
| Annual-first plan framing | `PaywallScreen.tsx` (default `yearly`, derived Save-44% badge); website "$27.33/month — save 44%" | already the doc's "intervention 4"; nothing to build |
| Hard gate at Send | `SendGateModal.tsx` via `quoteDeliveryGuard.ts` | expired-trial free users choose: connect Square (1.7% fee) or Pro $49/mo; creation stays unlimited |
| Fee-bleed Pro pitch | `pricingConfig.ts` `weeklyFeeBleed`, paywall | real Square volume × (1.7% − 1.0%), shown only above threshold |

## Non-negotiable prerequisites

Before adding any new conversion pressure or payment traffic:

1. **Close the release blockers in `research/email-payment-audit-2026-07-16.md`:** PAY-01 (failed store validation still grants Pro), PAY-02 (clients can write their own entitlement), PAY-03 (forgeable Square OAuth state), PAY-04 (Square webhook acks before processing), PAY-07 (arbitrary Stripe price IDs), PAY-08 (duplicate customers / 22 incomplete subscriptions). There is no point driving more traffic into a checkout that self-grants, forges, or loses payments.
2. **Email capacity and correctness:** Brevo is on a free plan with ~286 credits at audit time — insufficient for current volume. Fix EMAIL-01 (documents marked sent before provider acceptance) and EMAIL-05 (suppression of known-unsendable recipients) before any new email steps.
3. **Push is broken.** All sampled `fcmTokens` are Expo tokens; `sendAussiePush` via `admin.messaging()` delivers nothing. Every channel in this plan is **in-app or email** until the Expo push migration lands. No intervention below may depend on push.

## Guardrails (project rules — enforced by tests where noted)

- Never use "AI" in user-facing copy (`emailCopy.guard.test.ts`). Describe the outcome: "build the materials list", "price the job from your description."
- All prices, savings, deadlines, spot counts, and scarcity come from live server data. If the data can't load, show no scarcity copy (fail closed — already the `FoundingPriceNote` / paywall rule).
- TRIAL_DAYS=14 and $49/$328 are pinned by `crossPackage.guard.test.ts` (functions) and `crossPackageMirrors.guard.test.ts` (app). The trial starts on first quote creation; all messaging uses the real `trialStartedAt`.
- Expiry is recomputed live from `trialStartedAt + TRIAL_MS`; never display a countdown more precise than that.
- Be explicit about what remains on Free. No "you will lose everything" framing — documents are never deleted or obscured.
- Keep dismissal, plan comparison, restore purchase, cancellation, and Free-plan continuation obvious.
- Free stays generous on purpose: a free tradie on Square **is** revenue. No reverse-trial limits, no card-required trial.
- Every ticket ships real, named, passing Vitest tests; behaviour changes get a regression case.
- **New rule to adopt — a cross-channel pressure budget**, not just a modal cap:
  - One primary commercial ask per session, selected by behavioural state (Intervention 0).
  - No unsolicited full-screen prompt within ~20h of a lifecycle email (mirror `CROSS_CAMPAIGN_WINDOW_MS`, which already enforces exactly this between the email campaigns).
  - A dismissed offer enters a cooldown; it reappears only on cooldown expiry or a meaningful new intent event.
  - "Happy on Free" (Intervention 4) suppresses generic Pro asks for 30 days.
  - User-initiated Pro-feature openings bypass the cooldown, contextually only.
  - Implementation: a per-user `users/{uid}/settings/promptState` doc (last-prompt timestamp + per-offer dismissed-at), pure helpers with injectable `now` and Vitest coverage, modelled on the lifecycle verdict. Budget decisions key off real impressions and dismissals (Intervention 8), not whether a component technically rendered.

## The gap this plan fills: in-app conversion UX

The shipped engine is almost entirely **server-side and email**. In-app, between first quote and expiry, a trial user today sees: nothing until day 11 (the dashboard `TrialBanner` is deliberately hidden until ≤3 days remain), then a countdown banner, then the send gate after expiry. There is no setup checklist, no in-app value recap (it exists only in the day-7 email), no decision screen before expiry, no "what stays / what changes" framing, no post-trial feature previews, and no downgrade-reason capture. That untouched surface is where this plan operates.

**Sell after demonstrated value.** The strongest upgrade ask comes immediately after the user sees a real outcome — a sent quote, an accepted quote, a generated materials list — not on app launch. Every prompt should name the next useful action on the user's actual job.

**One primary commercial action at a time.** At any moment the app presents a single primary commercial action, selected from the user's current job state — Square and Pro must never appear as competing primary CTAs. The central principle: increase conversion by helping the user complete the next real job step and making the commercially appropriate continuation feel obvious, not by increasing the number or intensity of upgrade messages.

---

## Interventions

Ordered by expected leverage. Each names the existing surface it extends.

### 0. Behavioural-state model + job progress guide

Intent is better predicted by what a user has done than by trial day. The server already classifies this — `furthestStage` in `eventFunnel.helpers.ts` — but the app never uses it locally. Build a pure `nextBestAction(state)` selector in the app that mirrors the server classifier (guard test on both sides, per the TRIAL_DAYS / price-mirror pattern), fed by local store state: documents and their stages, `squareConnection`, `payments[]`, trial state.

| User state | Primary action | Never show |
|---|---|---|
| No completed quote | Finish the first quote | Subscription pricing |
| Quote completed, unsent | Send it | Square vs Pro competition |
| Quote sent, no response | Follow up / enable a deposit | Generic upgrade modal |
| Accepted quote, unpaid | Take a deposit | Pro as the primary CTA |
| Repeated Pro-feature use | Keep those tools with Pro | Generic onboarding |
| Meaningful Square volume | Real fee comparison vs Pro | Abstract savings claims |
| Trial ending | Informed continuity choice | New feature education |
| Happy on Free | Complete the job via Square | Repeated upgrade prompts |

**Job progress guide:** one compact dashboard card (respecting the minimise-UI-options rule) walking genuine milestones — first quote drafted → sent → customer response recorded → deposit/payment enabled → next job started. Every milestone is already durable Firestore state (doc stages, acceptance from the hosted flow, `squareConnection`, webhook-written payments) — zero new tracking. Framed as completing a job, never "finish onboarding": no artificial progress ("account created: 20%"), completed steps disappear rather than gamifying routine use, and no Pro pricing before a meaningful outcome except when the user opens a Pro feature themselves.

This card and the trial decision card (Intervention 2) are **one surface** whose content is selected by `nextBestAction`, not two competing cards.

**Primary metric:** time to first sent quote; draft → sent rate. **Guardrail:** quote completion.

### 1. In-app value receipt component

A reusable component showing the user's own real outcomes, rendered on: the post-send moment, the state-selected dashboard card (Interventions 0/2), and the paywall.

- **Evidence hierarchy — strongest first:** payments collected → accepted quote value → deposits requested → quotes delivered → quotes drafted / material lists built → total face value quoted (clearly labelled, always secondary). Reorder the recap math in `lifecycleEmails.helpers.ts` (`RECAP_MIN_QUOTES=2`, `RECAP_MIN_DOLLARS=500`; degrade to non-numeric copy when thin — never invent figures) so the day-7 email and this component inherit the same ordering; share via mirror + guard test, per the cross-package pattern.
- Best case: *"Two customers received your quotes. One accepted a $2,400 job, and you collected a $480 deposit."* Face-value-only case: *"You sent three quotes with a combined quoted value of $7,420."* Never follow face value with "keep that value on Pro" — QuoteMate didn't create the underlying job value; sell workflow continuity, not the dollars.
- **Protect the peak-end moment.** Post-send selling is two-stage and non-modal: immediate reinforcement first (*"Quote sent to Sam — you're ready to follow up when they respond"*), then one non-blocking next action (*"Want to take a deposit if they accept?"*). Any upgrade recommendation appears later on the stable job screen, never as a celebratory modal.
- "Worth $X" always means quote face value, never earned revenue. Label accepted and paid amounts separately.

**Primary metric:** paywall view → checkout start. **Guardrail:** quote-send completion must not decline.

### 2. Trial status / decision card on the dashboard

The trial-ending face of the Intervention 0 card — the same persistent, non-modal surface, now showing: days remaining (real), the value receipt, founding spots (from `config/foundingOffer`, fail-closed), and monthly/annual CTAs — annual first with "$328 charged yearly — equivalent to $27.33/month, save $260/year", the total charge at least as prominent as the monthly equivalent, monthly equally legible. Behaviour-dependent plan recommendation (annual for repeat users, monthly for first-outcome users) is parked until volume clears 5% — see "Parked" below.

- ⚠️ **Requires Tom's sign-off first:** this reverses the deliberate past decision to hide the dashboard `TrialBanner` until ≤3 days remain (`DashboardScreen.tsx` gate). Recommended shape: early/mid trial shows the value-receipt + founding framing (no doom timer); the countdown appears only in the final 3 days, as today.
- Day 12: a one-time full-screen trial summary, shown after a natural task completion (quote sent, invoice created) — never on cold launch. Counts against the pressure budget.
- Extends `TrialBanner.tsx` / `DashboardScreen.tsx`; no new screens beyond the day-12 summary.

**Primary metric:** checkout start from the card. **Guardrails:** app exits within 60s of the card appearing; Free-continuation task success.

### 3. Honest expiry framing + post-trial lock previews

**At expiry (in the day-12 summary, T-3 email — already live — and the send gate):** state exactly what stays and what changes. Verify each line against the actual feature gates before writing copy; as implemented today:

- **Stays on Free:** unlimited quote/invoice creation, existing documents untouched, cloud sync, sending via Square pay link (1.7% platform fee).
- **Changes:** sending without a Square link requires Pro; platform fee drops to 1.0% on Pro; logo on documents, premium PDF templates, and other trial-unlocked Pro features (the `isTrialActive` gates in PDF templates, business profile, materials, Xero) switch off.

**After expiry, preview instead of hard-walling:** when a free user opens a Pro feature, show their existing work intact and a preview of the Pro result — the branded PDF preview, the fee difference calculated on their real invoice amount — then the upgrade ask. Never make the user complete a long form before revealing a known paywall.

- Also: either wire up the declared-but-never-fired `trial_expired_banner_shown` event with a real persistent expired-state nudge on the dashboard, or delete the dead event from `analyticsService.ts`.

**Primary metric:** locked-feature view → checkout start. **Guardrails:** rage taps / repeated failed actions; Free-plan task success.

### 4. Free-plan reason capture + routed recovery

Don't interrupt the first post-trial open — let the user start their intended task, and explain what changed only when it becomes relevant. Ask the optional one-tap reason **after** a natural decision moment: dismissing an upgrade, encountering a changed feature, or explicitly choosing Free. Copy: *"Staying on Free is fine. What mattered most in that decision?"* — with a visible Skip, and never framed as a "downgrade receipt" (trial users never paid). When self-report and observed behaviour conflict, trust the behaviour.

Route by reason:

- **Price** → annual framing; no automatic discount.
- **Didn't use enough** → route to the job progress guide (Intervention 0) and changed-feature previews (Intervention 3); no trial extension — see "Parked" below.
- **Missing feature** → capture it; notify only if shipped.
- **Technical issue** → support handoff; suppress all sales pressure until resolved.
- **Happy on Free** → respect it: suppress generic Pro asks for 30 days via `promptState`; the primary action becomes completing jobs via Square.

**Build rule:** the email half of this **extends `lifecycleEmails.ts` / `lifecycleVerdict`** as new steps with send-once flags in `emailState`, inside the existing cross-campaign suppression. Do not build a parallel win-back sender — the trial-ending moment would double-send. Win-back triggers on renewed intent (new quote started, premium template opened), not on calendar repetition.

**Primary metric:** paid or Square-collected within 30 days of expiry. **Guardrail:** unsubscribe rate.

### 5. Cancellation save flow (web/Stripe path)

The reason modal already exists (`CancellationReasonModal.tsx` → `cancelSubscription`), but `logCancellationFeedback` validates and **does not persist** — fix that first; the data is currently thrown away. Then route by reason before the save treatment: too expensive → annual alternative; seasonal → reminder/pause if billing supports it; missing feature → capture; technical → support handoff; not using it → clean cancellation with export. Cancellation always completes in the same flow without contacting support. Native remains store-managed — nothing to build there beyond the reason survey.

**Primary metric:** 30-day retained paid after save. **Guardrails:** refunds, chargebacks, time-to-cancel.

### 6. Founding offer — definition work before scaling the copy

The cap is live but under-specified. Resolve before the founding line goes on more surfaces:

- **Spot consumption:** `taken` is recomputed from live `isBilledSub` every 6h — a churned founder **reopens a spot**, so the count can oscillate around 100 and "spots left" can go back up. Decide whether that's intended (rolling cap) or whether consumed spots should be durable (high-water mark), and make the display match.
- **Enforcement:** nothing blocks a 101st purchase at $49. The committed mechanism is manual: when the 100th billed sub lands, raise store/Stripe base prices to $99/$658 and grandfather members. Write this as a runbook with an alert on `taken ≥ 95` so the ops step isn't missed.
- **"Locked for life":** sanity-check the legal/commercial promise before scaling the copy — what exactly is locked (price? plan contents?), and what happens if a founder cancels and returns.
- One message everywhere, already the shipped pattern: real spots-left, real next price, suppressed when `capActive` is false or the doc is unavailable. Displayed vs server count discrepancy must be zero.

### 7. Square-first moments (extends the shipped Path B work)

Subscription prompts must never compete with a more valuable first payment:

- On quote acceptance, "Take a deposit" is the primary action (the hosted acceptance page already mints deposit links; make the in-app accepted-quote view match, reusing `TakePaymentSheet` / `StickyJobActionBar`).
- After a first successful payment, show the amount collected and offer to default the pay link on future invoices.
- For fee framing, only ever the real calculation on real volume (`weeklyFeeBleed` pattern) — no generic savings claims.
- **Implementation-intention prompts:** at send, offer the pre-commitment *"When they accept, request a 20% deposit?"* — this wires the existing `requireDeposit`/`depositPercentage` settings the hosted acceptance page already honours, so it's a one-toggle prompt, not a feature. *"Use this payment setting on future invoices?"* after a first payment is the same pattern. Follow-up reminders ("remind me Thursday morning") wait for the Expo push migration.

**Primary metrics:** Square connect rate during trial, first-payment rate, volume per connected user. **Guardrails:** invoice-send completion, disputes, fee complaints. (Note: PAY-06 — production isn't subscribed to Square dispute events — must be fixed for the dispute guardrail to be observable.)

### 8. Instrumentation deltas (small, do alongside 1–3)

The funnel architecture is settled: **durable state beats lossy client events** — `quote_sent`, `first_payment_collected`, `trial_expired`, and `pro_paid` are *derived* stages in `eventFunnel.helpers.ts`, not client events. Do not re-implement them as events. What's actually missing:

- `plan_selected` (paywall toggle) — currently only inferable from props on other events.
- A fire site for `trial_expired_banner_shown` (or delete it — see intervention 3).
- Surface exposure props (`surface`, `trigger`, trial-time-remaining) on `paywall_viewed` for the new surfaces above.
- **Exposure logging:** generalise the existing `nudge_shown/tapped/dismissed` trio into `prompt_impression` / `prompt_dismissed` events carrying surface, variant, behavioural state, trial time remaining, user-initiated vs unsolicited, recommendation shown, and cooldown/suppression reason. Before/after reads are unreliable without knowing who actually saw each intervention.
- Analytics `purchase_completed` stays client-side and fire-and-forget — that's fine because revenue truth is already durable (`isBilledSub` from validated receipts / Stripe webhooks). Never report the client event as revenue; the funnel already doesn't.

### Parked (considered, deliberately excluded)

- **Trial extensions** — even gated on "meaningful renewed intent," they train expiry-waiting and throwaway-quote gaming, need honest server enforcement, and target a tiny cohort. The changed-feature previews (Intervention 3) cover the same moment without the moral hazard. If ever revived: a bounded job-completion grace ("finish this active job with Pro tools through Friday"), server-enforced, one-time, visible before the user invests work.
- **Behaviour-dependent plan recommendation** (annual vs monthly vs Square by usage pattern) — a personalisation engine that can't be validated at current volume. Revisit past 5% trial→monetised. The disclosure rule (total charge at least as prominent as the monthly equivalent) applies now regardless.

## Copy system

Direct, concrete, Aussie, gender-neutral (per `emailCopy.guard.test.ts`):

- **Value:** "Keep building the materials list from your job description."
- **Continuity:** "Your trial ends Tuesday. Your documents stay; these Pro tools switch off."
- **Annual:** "Pay $328 for the year instead of $49 each month — save $260."
- **Deadline:** "6 hours left in your Pro trial" — only when server expiry supports it, hours-precision only inside the final 24h.
- **Payment:** "Take a deposit before ordering materials."
- **Recovery:** "Starting another quote? You can turn Pro back on here."
- **Explainable recommendations** (the live fee-bleed line is the template — always the visible reason with the ask): "Pro may suit you because you've sent four invoices this month." / "Pay as you go may suit this job — collect the deposit without subscribing." / "At your current Square volume, Pro would have cut your platform fees by $X." Never infer profitability or claim "Pro pays for itself" — QuoteMate doesn't know the tradie's margins.
- **Annual disclosure:** the total charge is always at least as prominent as the monthly equivalent — "$328 charged yearly — equivalent to $27.33/month."

Never: fabricated scarcity or social proof, resetting countdowns, confirmshaming, "most tradies" / income / win-rate / time-saved claims without measurement, or a visually buried Free option.

## Measurement and decision rules

At the current volume (~3 monetised users), formal A/B testing with confidence intervals is theatre. Until there are enough paid outcomes for intervals to mean anything:

- Ship on judgment, sequenced one intervention at a time, and read the **live event funnel** (`/admin/analytics`, `adminStats/eventFunnel`) before/after with 28-day windows. Treat every result as directional.
- Every intervention above names a primary metric and guardrails — a change ships permanently only if the primary moves without a material guardrail regression.
- Stop immediately for: misleading price/expiry output, displayed-vs-server founding-count mismatch, elevated payment complaints, or a broken Free-plan workflow.
- Never stack a new conversion prompt on top of an unresolved checkout or entitlement defect (see prerequisites).
- Cohort cuts the funnel already supports or should: platform, activated vs not, sent-quote vs not, Square-connected, monthly vs annual, founding cap active vs filled.

**Leading indicators** (readable now from existing events + durable state): time to first completed quote; draft → sent; sent → accepted; accepted → payment-link-created; Square connected → first payment; Pro-feature use → paywall viewed; paywall viewed → checkout started; checkout started → validated entitlement; prompt impression → dismissal or task abandonment.

**Small-sample research beats low-powered testing at this volume.** Run ~5 short interviews per failure state — activated-but-unmonetised, Square-connected-never-collected, expired-and-returned, checkout-started-never-completed — plus one or two successful Path A and Path B users. The admin funnel's `furthestStage` histogram is the recruit list; the CRM has the contact history.

Impact framing (hypothesis, not forecast): at the live base of ~146 trials, moving 2.05% → 5% monetised is roughly +4 monetised users per current cohort — real but small in absolute terms, which is exactly why guardrails matter more than lift-hunting right now. The 20% north star leans on Path B volume, not Pro alone. Model Square as processed volume × net platform take after refunds/disputes; model annual as cash-forward, not incremental MRR.

## Build order

1. **Prerequisites:** audit blockers PAY-01/02/03/04/07/08, Brevo capacity, EMAIL-01/05. Nothing below ships first.
2. **Founding-offer definition work** (6) — decisions and a runbook, no code risk, and it protects copy already live on the paywall and website.
3. **Behavioural-state selector + job progress guide** (0), with the slim pressure budget (`promptState`) and exposure events (8) — the orchestration layer everything else hangs off.
4. **Value receipt** (1) — reorder the evidence hierarchy in `lifecycleEmails.helpers.ts` first so the day-7 email and the app surface match from day one.
5. **Trial decision card + day-12 summary** (2) — after Tom signs off on loosening the banner gate.
6. **Expiry framing + lock previews** (3), including resolving `trial_expired_banner_shown`.
7. **Reason capture + routed recovery** (4) as `lifecycleEmails.ts` extensions; run the **first round of failure-state interviews** in parallel.
8. **Square-first moments** (7) and the **cancellation save flow** (5).
9. Re-read the funnel after each step; revisit this plan when trial→monetised clears 5% or the founding cap fills, whichever comes first.

This sequence creates genuine urgency from completed work and a real expiring entitlement, keeps both revenue paths intact, and never asks the user to pay before they've seen the product do its job.
