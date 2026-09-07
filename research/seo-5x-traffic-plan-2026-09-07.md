# QuoteMate: plan to 5× organic search traffic

**Prepared:** 7 September 2026  
**Status:** proposed plan; no production or analytics settings changed.  
**Recommendation:** improve the existing trade, template and quoting-guide clusters before expanding page count. Aim for **535 → 2,675 organic marketing-site sessions per 28 days within 6–9 months**. This is a stretch target, not a forecast or ranking guarantee. Reforecast after the first 90 days.

## 1. What the evidence says

### Baseline: live GA4, not an estimated keyword tool

Property: **QuoteMateWebsite / 527922866**, timezone Australia/Brisbane. Current window: **8 August–4 September 2026**; comparison: **11 July–7 August 2026**. Both are complete 28-day periods; recent processing days are excluded.

| Metric | Previous 28 days | Current 28 days | Interpretation |
|---|---:|---:|---|
| All Organic Search sessions | 541 | 627 | +15.9%; includes product/utility landings and unknown landing pages |
| **Organic sessions landing on known public marketing pages** | **466** | **535** | **+14.8%; primary growth baseline** |
| Australian organic marketing-page sessions | 415 | 487 | 91% of the current marketing baseline is in the target country |
| Non-homepage organic marketing sessions | 360 | 411 | Useful supporting metric; **not** a substitute for non-brand query data |
| Organic GA key-event occurrences | 106 | 92 | These are CTA clicks, **not** sign-ups or paying customers |

Additional current-window facts:
- GA recorded **15 `sign_up` events from 15 users** attributed to Organic Search. Validate these against completed account creation; do not call them paid conversions or assume native installs are covered.
- The 92 key events comprise **35 App Store clicks, 17 Google Play clicks, 19 web-app clicks and 21 generic CTA clicks**. A person can generate multiple events.
- `sign_up` is not currently configured as a GA key event. No `purchase` event appears in the organic event report; that does **not** establish that organic generated no revenue.
- Across the unfiltered organic channel, Google contributed 558 sessions and Bing 53. AI Assistant contributed another 44 sessions in a **separate** channel; exclude those from the SEO target.
- The landing-page report includes 58 `(not set)` sessions and 35 product/utility sessions. GA dimension subtotals differ from the channel total by one session; use the directly filtered **535** report, not subtraction from 627.

### Where organic marketing traffic actually lands

Page-family counts include their index pages where applicable. Session counts are GA Organic Search landing sessions, not Search Console clicks.

| Page family | Previous | Current | What to do |
|---|---:|---:|---|
| National trade pages | 180 | **179** | Largest non-homepage acquisition surface; improve these first |
| Homepage | 106 | **124** | Preserve and improve routing into relevant trade pages |
| Templates | 70 | **78** | Strong commercial adjacency; fix the download/preview experience |
| Articles | 61 | **64** | Refresh demonstrated demand instead of publishing indiscriminately |
| Best-app roundups | 8 | **38** | Promising early movement; small sample, not proof of repeatability |
| Payment guides | 8 | **16** | Useful selective expansion linked to the quote-to-paid workflow |
| Trade × city pages | 11 | **13** | Very low return on 120 URLs; do not expand the matrix |
| Comparisons | 4 | **11** | Improve accuracy and differentiation before adding more |
| Alternatives | 6 | **6** | Maintain distinct switching intent; avoid duplicating comparisons |
| Integrations | 4 | **5** | Support verified integrations and partner distribution |
| Other marketing pages | 8 | **1** | Low immediate priority |
| **Total** | **466** | **535** | |

**Important:** the live sitemap contains **339 URLs**, including 24 national trade pages, 120 trade/city pages, 74 articles and 54 template detail pages. This is not primarily a shortage-of-pages problem. City pages are 35% of sitemap URLs but only 2.4% of organic marketing sessions. That is a prioritisation signal, not proof of a penalty or crawl-budget problem.

### Search Console: useful historical evidence, incomplete current access

Live Search Console access was attempted but is unavailable in this session: the configured service-account project has the Search Console API disabled; the existing user credential lacks the required scope. I did not enable APIs, change permissions or start a new login.

The repository contains `research/gsc-articles-3mo-2026-08-25.csv`. Its 89 rows total **113 clicks and 11,118 impressions** over a window labelled three months. It has repeated slugs and no exact start date, query, country or device dimensions. Treat it as **historical article prioritisation evidence**, not a current sitewide baseline or a unique-page count. Do not compare its clicks directly with GA sessions.

Before committing a keyword-level forecast, obtain fresh GSC exports for the latest 28/90 days and prior periods: pages, queries, query × page, device and country, plus indexing and sitemap reports. Segment Australia and brand/non-brand; use property totals for total clicks because query tables omit anonymised queries. Neither this file nor GA establishes today's non-brand traffic share.

## 2. Define success so 5× is meaningful

**Primary target:** 2,675 sessions per rolling 28 days from Organic Search, landing on public marketing pages, by **March–June 2027**. Keep the same channel and landing-page exclusions throughout. Do not count app usage, paid traffic, AI referrals or newly recovered tracking as SEO growth.

**Quality guardrails:**
1. Australian organic marketing sessions grow alongside the total; aim to retain approximately the current 90% AU share rather than grow irrelevant overseas traffic.
2. Non-brand Australian GSC clicks increase materially. Establish the baseline in week 1; homepage versus non-homepage is not a brand classifier.
3. Verified organic-attributed sign-ups, first quotes sent and monetised users grow. Track both billed Pro subscriptions and genuine Square payment collection, without counting a user twice.
4. Preserve the validated signup-to-first-quote and first-quote-to-monetised rates. Do not optimise merely for download or CTA clicks.

The observed 15 signup users provide a provisional reference: 5× would be 75 per 28 days at unchanged acquisition efficiency. This is **conditional arithmetic, not a signup forecast**; instrumentation, native attribution and cohort deduplication must be validated first.

### What would have to deliver the traffic

These are **mutually exclusive landing-page targets**, not additive promises from individual tactics. Links, content and internal navigation all contribute to the same buckets. The allocations are an ambition to test against GSC demand, not measured market capacity.

| Page family | Current / 28 days | Target / 28 days | Increment |
|---|---:|---:|---:|
| National trade pages | 179 | 800 | +621 |
| Templates | 78 | 550 | +472 |
| Quoting/pricing articles | 64 | 650 | +586 |
| Best / compare / alternatives | 55 | 350 | +295 |
| Payment, workflow and integration pages | 21 | 125 | +104 |
| Homepage | 124 | 180 | +56 |
| City pages | 13 | 20 | +7 |
| Other marketing pages | 1 | 0 | −1 |
| **Total** | **535** | **2,675** | **+2,140** |

The hardest assumptions are ~10× article traffic and ~7× template traffic. If query demand, relevance or indexing does not support them, revise the target or timeframe—do not fill the gap with hundreds of thin pages.

## 3. Prioritised execution

### P0 — Week 1–2: make measurement and existing assets trustworthy

**A. Separate acquisition, activation and revenue.**
- Preserve the existing GA click events as micro-conversions, but report them separately from completed signup, first quote sent and monetisation.
- Validate `sign_up` firing/deduplication and then designate it as a key event. Configuration changes are forward-looking; do not imply they repair history.
- Extend the existing attribution bridge to preserve the initial organic referrer and landing page. It currently returns early when no UTM/ad-click parameters exist. Test organic → marketing page → `/app` → completed signup, including a new tab. **Do not add internal UTMs** to manufacture attribution.
- Join attribution to the existing product funnel and durable payment/subscription state. Do not rebuild the funnel or treat a client purchase event as revenue truth. Never send customer names, job details or quote amounts as public analytics parameters.
- Investigate `(not set)` landings and app/marketing tracking boundaries. In `Analytics.tsx`, event binding depends on `enabled`, not normal route changes; audit missed CTA bindings, script readiness and listener cleanup before calling a conversion improvement.

**B. Repair retirement handling where there is a genuinely equivalent page.**
The site has already unlisted 13 guides. Live checks confirm several now return **404 without redirect**, including the older concrete-driveway URL. Do not mistake existing pruning for a future task.

Proposed mappings, subject to content-equivalence review:

| Retired article slug | Candidate surviving slug |
|---|---|
| `how-to-quote-a-concrete-driveway` | `how-to-quote-concrete-driveway` |
| `how-to-quote-retaining-wall-installation` | `how-to-quote-a-retaining-wall` |
| `how-to-quote-an-epoxy-floor-coating` | `how-to-quote-epoxy-floor-coating` |
| `how-to-price-a-fence-installation` | `how-to-quote-a-fence-installation` |

Merge useful unique material, add a **server/edge 301 or 308**, update links and keep only the survivor in the sitemap. This is a static-export Next.js site: implement at the actual hosting/edge layer, not a client redirect or an unsupported Next server redirect. Test both slash variants and a single hop to a 200 self-canonical destination. Where no relevant replacement exists, an honest 404/410 is correct; do not redirect everything to the homepage or blindly redirect all retired city pages to trade pages.

This preserves assets but is unlikely to deliver a large standalone lift at current volumes.

**C. Fix the template promise.**
Live bathroom-renovation and ducted-aircon templates advertise **“Free … (PDF & Excel)”**, but their rendered pages have no direct PDF/Excel download links; the shared page implementation offers app CTAs instead.

Choose explicitly:
- **Recommended:** provide a useful, ungated static blank PDF/XLSX plus a clearly labelled worked example on the highest-priority templates; retain the app for supplier pricing, editing, sending and payment workflows.
- If standalone downloads are not wanted, remove the PDF/Excel claim and clearly describe an in-app template. Do not advertise an asset that is not available on the page.

This does **not** require a free public quote generator. Preserve the existing product constraint against building an app-replacement generator.

**D. Run targeted technical QA, not a speculative rebuild.**
- The live sitemap is valid XML, sampled active pages return 200 and have self-canonicals, and a random missing URL correctly returns 404/noindex. These basics are already present.
- `app/sitemap.ts` assigns build time to every `lastModified`. Use actual substantive modification dates, or omit unknown dates. Do not fake freshness at each deployment.
- Check GSC indexing and field Core Web Vitals; inspect representative trade/template/article pages on mobile. Target p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 where field data is available. Performance was **not measured** in this audit; do not assume it is the main bottleneck.
- Review video/image loading and sitewide chat/analytics cost if measurement identifies a problem. Do not remove working rich content blindly.

### P1 — Weeks 2–6: strengthen the pages with demonstrated demand

**First national trade-page queue**, based on current GA organic landings:

| Existing URL | Sessions / 28 days | Improvement focus |
|---|---:|---|
| `/quotes-for-cabinet-makers/` | 31 | Cabinet-specific worked quote, inclusions/exclusions, wardrobe/kitchen template links |
| `/quotes-for-cleaners/` | 17 | Commercial versus end-of-lease examples; labour assumptions and scope checklist |
| `/quotes-for-concreters/` | 15 | Slab/driveway examples, units, site-access and excavation allowances |
| `/quotes-for-landscapers/` | 14 | Planting/paving/retaining-wall workflow; scoped exclusions and relevant templates |
| `/quotes-for-electricians/` | 12 | Actual product workflow, materials allowances, licence/compliance review, guide links |
| `/quotes-for-painters/` | 12 | Area/preparation assumptions and clear worked line items |
| `/quotes-for-plumbers/` | 10 | Verified supplier integration and hot-water/bathroom workflow |
| `/quotes-for-carpenters/` | 8 | Deck/pergola examples and connected supporting content |

For each, match one commercial intent and show real product evidence: a job-specific screenshot or existing demo, what the app does and does not do, a sample output, transparent current pricing and a contextual “Start this quote” action using supported product functionality. Do not pretend to offer a local tradesperson rather than software.

**First article refresh queue**, combining historical GSC with current GA:

| Existing article slug | Historical GSC clicks / impressions | Historical avg. position | Current GA organic sessions |
|---|---:|---:|---:|
| `how-to-quote-electrical-work` | 20 / 1,614 | 10.4 | 9 |
| `how-to-quote-concrete-driveway` | 11 / 1,549 | 26.0 | 7 |
| `how-much-should-i-charge-for-callout-fees` | 7 / 923 | 7.8 | 7 |
| `how-to-quote-tile-and-slate-work` | 6 / 580 | 8.3 | 4 |
| `how-to-quote-a-shed-build` | 5 / 635 | 13.0 | 2 |
| `how-to-quote-landscaping` | 5 / 202 | 9.6 | 2 |
| `how-to-quote-a-bathroom-renovation` | 4 / 145 | 15.1 | 8 |
| `how-to-quote-a-retaining-wall` | 3 / 276 | 6.2 | 3 |

The concrete page is a longer-term relevance/coverage opportunity, **not** a title-only quick win at historical position 26. Fresh query data may change this order. Insulation (574 historical impressions, position 19.6) is a reserve candidate if current demand persists.

For every refresh:
1. Identify the real query cluster and whether the searcher is a contractor preparing a quote or a homeowner seeking a price. Prioritise the contractor intent; do not promise high conversion from generic homeowner traffic.
2. Preserve the existing quick-answer box and improve its substance; add or improve a worked line-item quote with quantities, units, GST treatment, labour, wastage, margin assumptions and exclusions where useful. Some pages already have price tables—review rather than duplicate them.
3. Verify figures against dated primary sources or an actual expert-reviewed example. Clearly separate illustrative allowances from current market rates. Australian standards and licence references need appropriate review, not just a plausible citation.
4. Add a relevant template preview/download, genuine product screenshot and contextual CTA near the example—not only after a long article.
5. Match titles/descriptions to the query and actual content. Test “How to Quote Electrical Work: Rates & Example (Australia)” only if the page genuinely delivers that answer. Adding “2026” without a substantive update is not a strategy.
6. Credit the actual author/reviewer and show a real reviewed date. Never invent trade experience, customer adoption by suburb or performance statistics.

**Contextual internal links:** connect **trade page ↔ guide ↔ template ↔ relevant product workflow**. Every priority page should be reachable through relevant crawlable links within roughly three clicks of a strong hub. Replace the primary use of pseudo-random “More Guides” rotation with same-trade/job relevance; keep broad browse links as secondary navigation. Add natural in-content links, not an indiscriminate sitewide exact-match footer.

### P2 — Weeks 4–12: expand only within validated clusters

Improve **eight templates first**: bathroom renovation, ducted aircon, Colorbond fence, concrete driveway, wardrobe fitout, commercial cleaning, painting and electrical switchboard upgrade. The first three have 12, 11 and 7 current organic landing sessions respectively; the rest connect priority trade/guide clusters. Reorder after GSC query validation.

Each template should have a visible example, editable/downloadable asset if promised, instructions, scope exclusions, GST note and a direct next step into the app. Do not gate the whole answer behind signup.

**Buyer-intent content:** improve six existing pages before creating more:
- `/best/app-for-electricians/` — 14 current organic sessions, up from 3.
- `/best/quoting-app-for-tradies/` — 10 current sessions.
- `/best/app-for-plumbers/` — 7 current sessions.
- `/alternatives/servicem8/` — assess Android/switching intent from fresh GSC.
- `/compare/tradify/` — verify product/pricing claims.
- `/compare/servicem8/` — verify product/pricing claims.

Comparison data is inconsistent within the repository: Tradify is shown at $35/user in `app/compare/data.ts`, versus $48/user in alternatives data. Some feature claims also conflict with the internal competitor research. **Neither source should be treated as current truth.** Check official pricing/docs, date the comparison, disclose QuoteMate's authorship, explain the evaluation method and admit where competitors fit better. Avoid unsupported “best” rankings and copied review claims.

Keep intent distinct:
- **Compare:** QuoteMate versus one named product.
- **Alternatives:** switching options and who each fits.
- **Best:** category evaluation by explicit criteria.

New content is allowed only when fresh query/SERP evidence identifies an unanswered job. Potential clusters: cabinet-making quote examples, cleaning quote scope, electrical job quoting, concreting allowances and verified Reece workflows. Map each intent to an existing URL first; a synonym does not warrant another page. Aim for **6–8 new, reviewed assets over 90 days at most**, not a quota to fill.

The scheduled generator already opens drafts as PRs twice weekly. Keep that human-review gate; redirect editorial effort toward updates before adding publishing volume. Update the keyword pipeline/checklist so unique intent, useful examples, source verification and relevance matter more than keyword occurrence counts or arbitrary word-count targets. Existing keyword CSV volumes/KD were not independently verified in this audit.

### P3 — Weeks 3–24: earn authority around useful assets

No live backlink inventory was available, so an authority deficit is a hypothesis to validate, not a diagnosed penalty.

1. Audit GSC Links and current partner/directory listings before duplicating submissions. Continue the existing Xero/Square partner work only if eligible; certification and editorial approval are real dependencies, not guaranteed links.
2. Build relationships with trade-focused accountants/bookkeepers, trainers, legitimate associations and supplier educators. Offer the relevant worked example or template as a genuinely useful resource, not a generic homepage link.
3. Produce one original, expert-reviewed asset in month 2–3: e.g. an Australian trade quote scope/checklist pack. Publish an aggregate quoting benchmark only if sample size, consent/privacy and methodology support it; otherwise use a transparent expert panel rather than made-up statistics.
4. Send **5–10 personalised, relevant pitches a week** and follow up once. Planning goal: **2–4 relevant editorial referring domains a month**, not a guarantee. Record page linked, topical relevance and qualified referral outcomes.
5. Reuse real demos on YouTube and partner resources with descriptive titles, transcripts and the corresponding page link. Use existing videos before generating more. Track referrals separately from search traffic.

No paid link packages, automated comments, PBNs or reciprocal-link quotas. Directory/forum links can help discovery and referrals but should not be sold internally as guaranteed ranking gains.

## 4. Rollout, ownership and capacity

| Period | Deliverables | Owner | Decision gate |
|---|---|---|---|
| Days 1–14 | GSC access/export; fixed baseline dashboard; validate signup/attribution; retirement map; template asset decision; technical field-data check | Growth + engineer + Tom | Measurement reproducible; known redirects tested; no unsupported download promises in the first template batch |
| Days 15–30 | First four trade-page upgrades; four guide refreshes; first two usable templates; contextual-link component/data support | Editor + trade reviewer + engineer | Published content delivers its promise; crawl and analytics QA pass |
| Days 31–60 | Continue toward eight trade pages, ten guides, eight templates and six buyer-page upgrades in total; start selective new assets and outreach | Editor + reviewer + Tom | Improving query coverage on first refreshed cohorts; adapt to actual GSC demand |
| Days 61–90 | Complete those upgrades; one original linkable asset; review city-page cohort and acquisition quality; reforecast | Growth + Tom | Evidence supports continued investment, not just more indexed URLs |
| Months 4–6 | Iterate the two strongest clusters, build qualified links, improve pages gaining positions 4–20 | Same team | Approach 5× only if leading indicators and activation quality support it |
| Months 7–9 | Extend timeframe if needed; expand only validated adjacent intent | Tom | Target achieved sustainably or explicitly revised |

**Planning capacity:** approximately **15–20 hours/week** across content, review, outreach and measurement, plus **20–40 engineering hours initially** for measurement/redirect/template/linking work, depending on the hosting and attribution implementation. This is an allowance, not a quote. If Tom is doing everything in 4–6 hours/week, run the first two clusters and accept a longer timeframe rather than lower-quality volume. Paid tools are not a prerequisite; expert review is.

Suggested effort allocation after setup: **45% existing-page improvements, 25% templates/examples, 20% authority/distribution, 10% measurement and technical QA**.

### Milestones—not promises

Use comparable complete 28-day windows, annotate releases and account for Christmas/summer seasonality. Compare year-on-year where history exists; otherwise use unaffected page cohorts alongside prior periods.

- **Day 30:** reliable dashboard and first improvements shipped. No required traffic lift yet.
- **Day 60:** directional increase in relevant impressions/query coverage; aim for 650–800 marketing organic sessions if changes are taking hold.
- **Day 90:** planning range **800–1,100** sessions, with Australian sign-ups/activation improving rather than just CTA counts.
- **Month 6–9:** stretch target **2,675** sessions; require sustainability across two consecutive complete 28-day periods.

If day-90 traffic is flat and refreshed pages have no improvement in relevant query coverage, pause expansion. Reassess demand, intent, indexing, competition and evidence quality. Do not assume “publish more” is the cure.

## 5. Operating scorecard and experiment rules

Review weekly; make meaningful decisions on 28-day cohorts, with 8–12 weeks where traffic is thin.

**Acquisition:** organic marketing sessions; AU share; GSC AU non-brand clicks/impressions; query coverage by cluster; landing family; Google/Bing split. Track sitewide totals separately from query-table sums.

**Search health:** priority URL indexability; selected canonicals; sitemap consistency; relevant query rankings by device; genuine 404/redirect errors; field CWV where available.

**Business quality:** verified organic-attributed signup users → first quote sent → first monetised outcome, with attribution coverage and unknowns shown. Existing durable product/payment state remains the source of truth.

**Execution:** pages substantively improved, examples reviewed, working assets published, relevant pitches/replies, new editorial referring domains. Page count itself is not a success metric.

**Testing rules:**
- For title/snippet changes, compare the same query/page/device/country cohorts at similar positions. Sitewide CTR changes can simply reflect a different query mix.
- For content refreshes, compare the refreshed cluster with its prior trend and an unchanged peer cluster. Record the publication date and changes; do not claim clean causality from a before/after comparison.
- For template improvements, measure real download use and downstream account/activation outcomes—not download clicks alone.
- With only 15 observed organic signup users, avoid declaring statistically significant conversion wins from tiny page-level tests. Use directional data plus short interviews/usability checks.
- Roll back broken tracking, misleading copy, failed downloads, incorrect prices or a damaged product funnel immediately. Search fluctuations alone need investigation rather than reflexive reversals.

## 6. What not to spend the next quarter on

- More trade × city combinations without distinct demand and useful local evidence. Audit existing pages individually; don't mass-delete useful URLs just because the cohort is weak.
- More near-duplicate “how to quote” slugs, especially variants of retired articles.
- A new SEO framework, SSR migration, blanket schema project or homepage redesign without evidence of a bottleneck. Static HTML, breadcrumbs, article metadata, quick answers and video markup already exist.
- Treating `llms.txt`, AI crawler permissions, FAQ markup or sitemap priority values as a route to 5× Google traffic. AI citations are useful to monitor, not a guaranteed traffic mechanism; ordinary commercial FAQ pages should not expect Google FAQ rich results.
- Invented supplier capabilities, local customer adoption, expert experience, reviews or pricing statistics.
- An unrestricted free quote generator that substitutes for the product.

## 7. Evidence and implementation reference

**Saved evidence:** `research/seo-5x-2026-09-07/` contains the GA baseline, landing-page CSV, event counts and live URL checks, with report definitions in its README. Historical article evidence remains in `research/gsc-articles-3mo-2026-08-25.csv`.

**Implementation surfaces to extend, not replace:**
- `seo/data.json`, `seo/template-content.json`, `lib/data.ts`: content, retirement flags, topical relationships.
- `app/articles/[slug]/page.tsx`: article rendering, examples and contextual links.
- `app/templates/[templateSlug]/page.tsx`: template promise, preview/assets and CTA.
- `app/[tradeSlug]/page.tsx`: national trade pages.
- `app/compare/data.ts`, `app/alternatives/data.ts`, `app/best/data.ts`: verified buyer-page claims.
- `app/components/Analytics.tsx`, `app/components/AttributionBridge.tsx`: measurement validation and acquisition handoff.
- `app/sitemap.ts`, `.do/app.yaml`, actual deployed routing layer: accurate dates, retirement redirects and deployment QA.
- `.github/workflows/generate-article.yml`, `scripts/generate-article.ts`, `seo/checklist.md`: keep review gates; prioritise useful, non-duplicative content.

**Bottom line:** the best next move is a focused two-week foundation sprint followed by improving the trade → guide → template paths already attracting Australian tradies. The route to 5× is more useful pages and stronger evidence/distribution—not five times as many pages.
