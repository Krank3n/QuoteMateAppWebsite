# Phase-1 launch kit — paste-ready Ads Manager setup (2026-07-26)

Everything needed to go from "pixel exists" to "ads live" in one sitting. Rules and rationale live in `fb-ads-growth-system-2026-07.md`; this is just the execution sheet.

## 0. Prerequisites (blockers)

- [x] Pixel: already existed — "QuoteMate" dataset, ID `1714708188811919` (Events Manager, personal ad account 38348825). Env vars set 2026-07-26: `NEXT_PUBLIC_META_PIXEL_ID` (website `.env`) + `META_PIXEL_ID` (functions `.env`). NOTE: its base code currently fires PageViews from hansendev.com.au (old install) — consider removing that install, and add a traffic-permissions allow list (quotemateapp.au, www, staging) once live.
- [ ] **CAPI token (Tom, ~10 min)**: blocked on "must be an admin … for this business portfolio". There is no Business portfolio yet (only the QuoteMate Page). Create one at business.facebook.com → claim the pixel dataset into it → Events Manager → QuoteMate → Settings → Conversions API → Generate access token → paste into `functions/.env` as `META_CAPI_ACCESS_TOKEN` (line already stubbed). Pixel-only is enough to LAUNCH Phase 1; add the token before trusting optimization/scale decisions (pixel-only under-reports 25–40%).
- [ ] Commit + deploy: functions, website, web-app re-export to `/app`
- [ ] End-to-end test: visit `quotemateapp.au/?utm_source=facebook&utm_medium=paid&utm_campaign=qm-launch&utm_content=test-e2e` → sign up with a test account → confirm `users/{uid}/profile/attribution` → `test-e2e` row appears in /admin/analytics after the next cron (or trigger `aggregateEventFunnel` manually)
- [ ] Verify `config/foundingOffer` still shows `capActive` + spots left (needed for qm-e1-news honesty)
- [ ] Customer list uploaded to Meta as exclusion audience (existing users' emails)

## 1. Campaign settings

| Setting | Value |
|---|---|
| Campaign | `qm-leads`, Leads objective (Advantage+ Leads if offered) |
| Budget | **$25/day, campaign level** — hard stop at $500 total |
| Ad set | ONE. Broad AU, ages 22–55, all placements (Advantage+) |
| Exclusions | customer list |
| Optimization event | `SignupStart` (custom event — appears in Events Manager once the pixel fires it) |
| Attribution setting | default (7-day click / 1-day view) |
| Advantage+ creative enhancements | **OFF** (auto-altered creative breaks single-variable testing) |
| CTA on all ads | **Learn More** |

## 2. Launch batch (4 ads — one per concept, <60% similar)

Link URL pattern (per ad): `https://quotemateapp.au/?utm_source=facebook&utm_medium=paid&utm_campaign=qm-launch&utm_content=<AD NAME>`. **Ad name in Ads Manager = utm_content, exactly.**

### Ad 1 — `qm-b1-news-inset` (news + highlight, lost-quote story)
- Creative: `ad-creative/qm-b1-news-inset.png`
- Primary text: `It's the oldest bad joke in the trades. One tradie walks the job, measures up, prices every material, sends a proper quote three nights later. Another pulls a number out of the hat on the spot — and wins. QuoteMate ends the trade-off: talk the job into the phone, materials priced as it builds, proper quote sent before the ute leaves the street. Free 14-day trial — and it doesn't start until the first quote gets made.`
- Headline (Meta field): `Quotes done before the ute leaves`
- Description: `Free 14-day trial — starts on the first quote`

### Ad 2 — `qm-a1` (raw native, after-hours pain)
- Creative: `ad-creative/qm-a1-kitchen-9pm.png`
- Primary text: `The job took 6 hours. The quote took the whole evening. Talk the job into a phone on the drive home instead — Mate builds the quote, materials, labour, the lot, and it's in the customer's inbox before dinner. Free 14-day trial — and it doesn't start until the first quote gets made.`
- Headline: `Still pricing jobs at 9pm?`
- Description: `Talk the job in. The quote builds itself.`

### Ad 3 — `qm-c1` (raw native, curiosity)
- Creative: `ad-creative/qm-c1-boots-toolbox.png`
- Primary text: `No laptop. No spreadsheet. No typing with thumbs like it's 2009. Talk, and Mate writes the quote — line items, materials at real prices, margin on top. Sounds made up. It isn't. Free 14-day trial — and it doesn't start until the first quote gets made.`
- Headline: `Quotes without typing a word`
- Description: `Free 14-day trial for Aussie tradies`

### Ad 4 — `qm-f1-news` (stat card, payments proof)
- Creative: `ad-creative/qm-f1-news.png`
- Primary text: `Xero's data says 48% of Aussie small-business invoices get paid late, and the average wait is 22.6 days. The fix isn't chasing harder — it's making paying easy at the job. QuoteMate sends the invoice from the ute and takes the card payment on the spot through Square, so the money lands before the excuses start.`
- Headline: `Invoiced and paid at the job`
- Description: `Quote, invoice, card payment — one app`

## 3. Bench (swap in per §5 of the growth system — 1 winner-iteration + 1 net-new per cycle)

`qm-b2-inset`, `qm-a1-inset`, `qm-c2-news`, `qm-b1-news`, `qm-b2`, `qm-a2`/`qm-c2`/`qm-d2`/`qm-e2` copy blocks in the playbook, plus the §4a headline bench. `qm-e1-news` (founding price) joins only while the cap is verifiably open. `qm-d1` demo video slots in as soon as a real screen recording exists — expected top performer.

## 4. Week-1 notes

- Do nothing for 7 days unless catastrophic (broken link, CPC >2× everything else). First read at ~1,000 impressions/ad: rank by link CTR, kill only the clear floor (<0.5%).
- Log the week in `ads-log.md` even if no action taken — the baseline numbers (CPM, CPC, CTR) calibrate every later decision.
- Sanity-check attribution weekly: admin table's attributed signups vs Meta's claimed results. Meta will claim more; the admin table is the truth for money decisions.
