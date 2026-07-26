# Facebook Ads Playbook — QuoteMate (v1, 2026-07-25)

Built from Sabri Suby's 2026 Facebook Ads method ("Facebook Ads Tutorial — 2026 FREE COURSE for Beginners", youtube.com/watch?v=Ea1hFxPx3JA), adapted to QuoteMate's funnel, tone rules, and unit economics.

**Status: creative + tracking build phase. Scale spend is still gated on trial→monetised ≥5%** (`marketing/high-intent-conversion-plan.md`). Baseline 2026-07-16: 146 trials, 2.05% monetised. This playbook exists so that the moment conversion clears the gate, we're spending into proven creative with clean attribution — not starting cold.

---

## 1. The method (Suby, distilled)

- **Market temperature**: 3% ready to buy now, 17% gathering info, 20% problem-aware, 60% unaware. Most ads only talk to the 3%. The money is in ads for each tier.
- **Hyperdopamine ad structure**: (1) pattern-interrupt visual that stops the scroll, (2) headline with burning intrigue — curiosity without lying, (3) clear benefit promise.
- **Copy rules**: 5th-grade readability. Short words, short sentences, short paragraphs. Specific numbers beat vague claims. Write to one person. Positive benefit hooks beat negative ~80% of the time. "Learn More" is the best-performing CTA.
- **Creative styles that win**: raw native (smartphone-shot, looks organic, not polished) and breaking-news style cards.
- **Process**: creative IS the targeting. Test many hooks cheaply, kill fast on data, scale only winners.

## 2. QuoteMate-specific rules (non-negotiable)

- **Never use the word "AI"** in any ad copy. Say "does the quote for you", "builds it while you talk", "Mate".
- **Aussie, gender-neutral**: no "blokes", "guys", "fancy", "folks". Tradie/tradies is fine.
- **No invented scarcity**: founding-offer ads may only run while `config/foundingOffer` shows `capActive && spotsLeft > 0`, and must use the live number or no number. Same fail-closed rule as the paywall.
- **Honest claims only**: "$49/mo goes to $99/mo when founding spots fill" is true today. Re-verify before every launch.
- **Send traffic to the website → web app** (see §5). App-store links destroy attribution.

## 3. Unit economics — what "make money" actually requires

- Price: $49/mo (founding, for life) or $328/yr. Post-cap $99/mo / $658/yr.
- Assume 6–10 months average retention until real churn data exists → LTV ≈ $300–450 (+ Square payment cuts).
- Target blended CAC ≤ $150 per **monetised** user (≈⅓–½ LTV).

| trial→monetised | max cost per trial at CAC ≤$150 | verdict |
|---|---|---|
| 2.05% (today) | ~$3 | impossible on Meta AU — every dollar loses money |
| 5% (gate) | ~$7.50 | still underwater vs realistic trial costs |
| 10% (benchmark-normal for no-CC trials) | ~$15 | viable only at benchmark LTV (see below) |

Validated planning numbers (2026-07-26, sources in `research/fb-ads-plan-validation-2026-07.md`): realistic Meta cost per trial-start is **A$40–80** (the only published comp at this price point paid $90–120), and benchmark trial→paid for no-card trials is 8–18%. The $150 CAC ceiling assumes a deliberately conservative $300 LTV; at benchmark churn (3–7%/mo) LTV is $690–1,600 and the ceiling loosens accordingly. The leverage order is unchanged: conversion rate first, creative second, spend third. **Economics, budget ladder, and all kill/scale rules now live in `fb-ads-growth-system-2026-07.md` (v2) — that doc is the authority where the two disagree.**

## 4. The ad series

Campaign naming: `qm-{angle}{n}` (e.g. `qm-a1`). Every ad links to `https://quotemateapp.au/?utm_source=facebook&utm_medium=paid&utm_campaign=qm-launch&utm_content=qm-a1`.

All ads: CTA button **Learn More**. Primary text ends with: `Free 14-day trial — and it doesn't start until you make your first quote.` (true: trial starts on first quote, not signup — a genuinely unusual, honest hook).

### Angle A — After-hours admin pain (problem-aware, 20%)

**qm-a1 — "Quoting at 9pm"**
- Creative (raw native): smartphone photo, kitchen table at night, laptop + crumpled paper + coffee mug, warm lamp light. Zero polish.
- Headline: *Still pricing jobs at 9 o'clock at night?*
- Primary text: `The job took 6 hours. The quote took your whole evening. Talk the job into your phone on the drive home instead. Mate builds the quote — materials, labour, the lot — and it's in the customer's inbox before you're home.`

**qm-a2 — "Sundays are for the couch"**
- Creative (raw native): phone photo of a ute tray with tools packed away, golden-hour light.
- Headline: *Your Sunday shouldn't be a paperwork day.*
- Primary text: `Weekends disappear one quote at a time. QuoteMate turns a 40-minute quote into a 4-minute one — describe the job, check the numbers, send. Your logo, your prices, your business name on everything.`

### Angle B — Speed wins jobs (problem-aware → info-gathering)

**qm-b1 — "Number out of a hat"** (v2 headline, 2026-07-26 — see §4a)
- Creative (news-article card): article screenshot layout, photo of a crumpled paper with a scribbled price being pulled from an upturned hard hat.
- Headline: *The quote that took 4 hours just lost to a number pulled out of a hat*
- Primary text: `It's the oldest bad joke in the trades. One tradie walks the job, measures up, prices every material, sends a proper quote three nights later. Another pulls a number out of the hat on the spot — and wins. QuoteMate ends the trade-off: talk the job into the phone, materials priced as it builds, proper quote sent before the ute leaves the street.`

**qm-b2 — "Quoted from the driveway"**
- Creative (raw native): over-the-shoulder phone photo from a ute driver's seat, house visible through windscreen, quote screen on phone.
- Headline: *Quoted from the driveway. Before the handshake wore off.*
- Primary text: `Walk the job. Talk it into your phone. The quote builds itself while you drive to the next one — materials priced, labour added, ready to send. That's the whole workflow.`

### Angle C — Burning intrigue (unaware, 60%)

**qm-c1 — "Without typing a word"**
- Creative (raw native): close phone photo of muddy work boots + phone propped on a toolbox, screen showing a finished quote.
- Headline: *This sparky sends quotes without typing a word.*
- Primary text: `No laptop. No spreadsheet. No typing with thumbs like it's 2009. You talk, Mate writes the quote — line items, materials from the local store's prices, your margin on top. Sounds made up. It isn't.`

**qm-c2 — "20-minute job, 2 hours of paperwork"** (v2 headline, 2026-07-26 — see §4a)
- Creative (news-article card): article screenshot layout, photo of a small finished job (e.g. a replaced tap or switchboard) next to a thick pile of paperwork.
- Headline: *Does a 20-minute job still come with two hours of paperwork?*
- Primary text: `That line comes straight from a sparky's rant online, and every tradie knows the maths. The job's the easy bit — it's the quote, the invoice and the chasing that eat the evening. QuoteMate does that half: talk the job in, the quote builds itself, the invoice follows, card payment lands in the same app. Free 14-day trial — and it doesn't start until the first quote gets made.`

### Angle D — Show, don't tell (info-gathering, 17%)

**qm-d1 — demo video** (build when a: real screen-record exists)
- Creative: 30–45s raw screen recording, no music-video edit. Talk a bathroom reno into Mate → materials list appears priced → send → phone buzzes with the customer email. Captions on, silent-watchable.
- Headline: *Watch a full bathroom quote built in 4 minutes.*
- Primary text: `No cuts, no tricks — one job, quoted start to finish in the time it takes to drink a coffee. Materials priced, labour added, sent from the app with your business name on it.`

**qm-d2 — payments proof**
- Creative (raw native): phone photo of a paid-invoice screen next to a tool bag.
- Headline: *Quote it. Send it. Get paid in the same app.*
- Primary text: `QuoteMate does the unglamorous half of the trade: quotes, invoices, and card payments through Square. One app, one place, and the money lands without chasing.`

### Angle E — Offer (ready-to-buy, 3% + retargeting)

**qm-e1 — founding price** (v2 headline, 2026-07-26; only while cap is open; pull live `spotsLeft` or omit the number)
- Creative (news-alert card): "PRICE ALERT" banner style.
- Headline: *Founding tradies lock $49 a month for life — latecomers pay $99*
- Primary text: `Quotes, invoices and card payments in one app, with Mate doing the heavy lifting. Founding members keep $49/mo for as long as they stay; once the founding spots fill, new members pay $99. That's the whole announcement.`

**qm-f1 — late-invoice stat** (added 2026-07-26 — stat-led news, honest by construction)
- Creative (news-article card): article screenshot layout, photo of a wall calendar with days crossed off next to an unpaid invoice.
- Headline: *Nearly half of tradie invoices get paid late (the other half found a fix)*
- Primary text: `Xero's data says 48% of Aussie small-business invoices are paid late, and the average wait is 22.6 days. The fix isn't chasing harder — it's making paying easy at the job. QuoteMate sends the invoice from the ute and takes the card payment on the spot through Square, so the money lands before the excuses start.`

**qm-e2 — retargeting** (website visitors + video viewers, 30 days)
- Creative: reuse the best-performing Angle A–D visual.
- Headline: *Still quoting the slow way?*
- Primary text: `You had a look at QuoteMate. The next quote you write could take 4 minutes instead of 40. The trial's free, and it doesn't start until your first quote — nothing to lose but the paperwork.`

## 4a. Headline system v2 (2026-07-26)

Full research in `research/fb-headline-research-2026-07.md`. The v1 news-card headlines were claims ("The fastest quote wins the job") — v2 headlines are stories, questions, or stats, per the rules that actually test well:

1. **Third-person news voice, no "you/your"** (Meta call-out penalty + Suby's gossip-press framing). The identity marker ("tradies", "sparkies") does the targeting.
2. **Story-not-claim** — report something that happened, with a curiosity gap.
3. **Specific odd numbers** — 4 hours, 20 minutes, 48%, 22.6 days, $49→$99. Only verified numbers (see research doc §4 for the citable list and the do-not-cite list).
4. **Test negative vs positive frames** — the CTR literature says negative wins (+63% Outbrain), Suby says positive wins 8/10; our data will decide.
5. **Borrow the news layout, never fabricate journalism** — fictional masthead, true claims, no invented people or testimonials.

Candidate bench (rotate in as cards fatigue or die):
- *Aussie tradies are going wild over a quoting trick that prices the job before smoko* (Suby swipe formula)
- *The "4-hour quote" is dying — tradies now talk the job into their phone on the drive home* (story/news)
- *Who else is still quoting at the kitchen table at 9pm?* ("Who else" + self-diagnosis)
- *Tradies call free quotes "unpaid labour" — until they take 4 minutes instead of 4 hours* (paraphrased from a 190-comment r/tradies thread)
- *The secret to quoting a full bathroom reno in 4 minutes (it's not a spreadsheet)* (secret + parenthetical tag)
- *Sparkies are sending quotes from the driveway — before the other quotes even arrive* (identity + speed story)
- *The average small business waits 22.6 days to get paid. Some tradies now wait about 30 seconds.* (stat contrast; Square on-the-spot payment)
- *New: a 14-day free trial that refuses to start until it's actually used* (offer mechanic as news)

## 4b. Creative assets

Both Suby formats live in `marketing/ad-creative/`, generated 2026-07-25 with `gemini-3-pro-image` via `marketing/ad-creative/generate.py` (needs `GEMINI_API_KEY` from the app repo's `functions/.env`; pass ad names as args to regenerate selectively, e.g. `python3 generate.py qm-b1-news`):

- **Raw native**: qm-a1 (kitchen 9pm), qm-b2 (ute driveway), qm-c1 (boots + toolbox)
- **Breaking-news cards**: qm-b1-news, qm-c2-news (fictional "TRADE WIRE" masthead — never a real outlet's branding), qm-e1-news (price alert; re-verify $49/$99 before each launch), qm-f1-news (late-invoice stat)
- **Native highlight** (red-ringed circle inset + hand-drawn arrow — Suby's "marked-up shared photo" format): qm-b2-inset (circle zooms "Total: $4,850 / Send quote" on the phone; NOTE visible Toyota badge on the wheel — crop or regenerate before launch), qm-a1-inset (circle zooms the 9:05 PM clock)
- **Combined news + highlight** (advertorial thumbnail — both interrupts at once): qm-b1-news-inset (hat headline + circle zooming the "$1,500" scribble). Strongest single creative in the bank; test it against its plain-news sibling to isolate the inset's lift.

Always proof generated text before upload — one round already caught a "drivieway" typo and a visible vehicle brand badge. Raw-native stills are 1:1, no text overlays — headline/copy belong in the ad fields, not baked into the image (keeps text-on-image low and lets us test hooks without regenerating art).

## 5. Tracking (build items — nothing works without these)

**Status 2026-07-26: items 1–4 below are CODED and tested (uncommitted)** — app attribution capture (`src/services/attributionService.ts` + utils), website `AttributionBridge` (passthrough + pixel + SignupStart + CAPI beacon), functions `metaCapiTrack` relay and `attributionRollup` in the funnel cron, admin "Acquisition by ad" table on /admin/analytics. Remaining before launch: create the Meta pixel + CAPI token (set `NEXT_PUBLIC_META_PIXEL_ID` on the website build and `META_PIXEL_ID`/`META_CAPI_ACCESS_TOKEN` in functions env — everything fails closed until then), commit + deploy (functions, website, web-app re-export to `/app`), then an end-to-end test. Original build list:

1. **UTM capture at web signup** (app repo, web platform): on web app load, read `utm_source/medium/campaign/content` + `fbclid` from the URL, persist through the auth flow (sessionStorage), write to `users/{uid}.attribution` at signup. This joins ad → signup → the existing event funnel (`furthestStage`) → monetised. ~half-day build. Good news (verified): the web app serves at `quotemateapp.au/app` — same domain as the landing pages, so no cross-domain cookie forwarding is needed; params only have to survive the internal nav to `/app`.
2. **Landing passthrough**: website CTA buttons forward the current page's UTM params to the `/app` URL (hero A/B v2's web-first CTA is the door; today it drops params).
3. **Meta Pixel on quotemateapp.au + CAPI with `event_id` dedup** — CAPI is effectively mandatory at our volume (pixel-only loses ~25–40% of conversions, fatal when the campaign sees a handful of signups a week). Fire a `SignupStart` micro-event (CTA click / auth start) as the campaign's optimization event; completed signup remains the reporting truth.
4. **Attribution rollup in admin CRM**: per `utm_content` (= per ad): signups, trials, sends, monetised. Extends the existing funnel aggregate; this is the table the kill/scale decisions read from.
5. **GA4**: campaign traffic already reportable once UTMs flow (property connected).

Rule: **ad traffic goes to the website → web app only.** The Play/App Store install path loses the click identity; don't send paid traffic there.

## 6. Test → kill → scale loop (v2 summary — full rules in `fb-ads-growth-system-2026-07.md` §5)

Structure (corrected 2026-07-26): **one campaign, ONE broad ad set** (Advantage+ Leads or CBO), all creatives inside it, 5–10 genuinely distinct concepts under 60% similarity, broad AU 22–55, exclude customer list. Never split into per-angle ad sets at this budget — a $10/day ad set can't reach Meta's ~50 optimization events/week and stays permanently Learning Limited. No traffic-objective warm-up (clicker-audience trap); conversion objective on the `SignupStart` micro-event from day one.

- **Triage** at ~1,000 impressions: kill the bottom of the batch by link CTR (relative ranking; absolute floor 0.5%).
- **Conversion kill**: zero signups after ~3× target cost-per-signup in spend. No decisions on data <72h old; minimum 1 week runtime unless catastrophic.
- **Iterate**: per cycle, one variant of the best performer (change ONE element, hook first) **plus one net-new concept** from the §4a bench — iterate-only converges on look-alike ads that Meta collapses and cannibalizes.
- **Scale**: +20% every 3–4 days; pause increases if CPA rises >25% for 3 days.
- **Fatigue**: act on signals (frequency >2.5, CTR −20–25%), not a calendar — at this spend, winners often live for months.
- Metrics ladder unchanged: cost per **monetised** → cost per trial → cost per signup → CTR/CPC (diagnostics only).

## 7. Phased rollout (v2 — authority is `fb-ads-growth-system-2026-07.md` §4)

- **Phase 0 (now)**: build §5 tracking (incl. CAPI + SignupStart); qm-d1 screen recording; start the zero-budget channels in parallel — Apple Search Ads, Capterra/TradiePad listings, association-partnership pitch (the vertical's evidence says search intent + partnerships + referral outrank Meta prospecting for zero-to-one; see `research/fb-ads-plan-validation-2026-07.md`).
- **Phase 1 (conversion <5%)**: **$25/day, $500 cap ⇒ ~3 weeks = 3 Monday decision cycles.** Goal is knowledge, not profit: the winning hook and a real cost-per-signup. Test ≤4 concepts at a time so each can reach its ~3× CPA judgment spend.
- **Phase 2 (conversion ≥5%, the existing gate)**: $50/day; exit up on cost/trial ≤A$60 sustained 2 weeks with attributed monetised >0.
- **Phase 3 (CAC ≤$150 on ≥5 attributed monetised)**: +20% per 3–4 days; recompute the CAC ceiling when real churn/LTV data lands; retargeting campaign only once the matched audience ≥1,000; monthly, Meta's marginal dollar competes against ASA/Google/partnership CAC.
