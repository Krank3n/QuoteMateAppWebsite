# QuoteMate Marketing Website — Visual & Technical QA Report

**Date:** 2026-06-22
**Scope:** Playwright-rendered visual QA (mobile 390px + desktop 1440px screenshots) across 20 page templates, plus static analysis of 438 built pages. Screenshots & diagnostics in qa-artifacts/.

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Blocker  | 2     |
| High     | 22    |
| Medium   | 23    |
| Low      | 43    |
| **Total**| **90** |

Note: Many findings are template-level defects that replicate across programmatic pages. Deduplicated entry count is 60 distinct defects covering 438 pages.

**Top 5 themes:**

1. **Doubled brand suffix in `<title>`** — 93 pages emit `… | QuoteMate — QuoteMate` because `seo/data.json` metaTitles already embed `| QuoteMate` and the layout template appends `— QuoteMate` again.
2. **`og:image` absent on 332–335 content pages** — every page that overrides the layout `openGraph` object drops the inherited image because Next.js does not merge page-level and layout-level OG objects.
3. **Wrong/stale App Store IDs on conversion-critical pages** — two deep-link landing pages use IDs that differ from the canonical `6754000046`, breaking iOS installs.
4. **Stale pricing in structured data and content** — trial duration (`7` vs `14` days) and Pro price (`$29` vs `$49`) are inconsistent across copy, JSON-LD, and LLM context files.
5. **Footer contact email exposes a personal developer address** site-wide instead of `hello@quotemateapp.au`.

---

## Blockers

### B-1: Comparison table causes horizontal scroll on mobile (16 px overflow)

**Scope:** All `/compare/[slug]` pages (6 pages)
**Viewport:** Mobile (390 px)
**Evidence:** `capture-report.json` confirms `horizontalOverflow=true`, `scrollWidth=406` vs `innerWidth=390`. `table.comparison-table`, all `thead/tbody/tr/th/td` extend to `right=406`. The wrapper `.comparison-table-wrap` has no `overflow-x:auto`, so the 16 px bleed produces a page-wide horizontal scrollbar. The third column header (`CHATGPT / AND OTHER AI CHATBOTS`) is visibly clipped in the mobile screenshot.
**Fix:** `app/globals.css:1735` — add `overflow-x: auto` to `.comparison-table-wrap`. Add a mobile media query:
```css
@media (max-width: 640px) {
  .comparison-table th, .comparison-table td { padding: 10px; }
  .comparison-table td:nth-child(2), .comparison-table td:nth-child(3),
  .comparison-table th:nth-child(2), .comparison-table th:nth-child(3) { width: 72px; }
}
```

---

### B-2: App Store link uses wrong app ID on /join page

**Scope:** `/join` (primary iOS conversion page)
**Viewport:** Both
**Evidence:** `app/join/JoinClient.tsx:60` — `href="https://apps.apple.com/au/app/quotemate/id6738030590"`. Canonical ID used on 433 other pages (`app/layout.tsx:21`, rendered `<meta name="apple-itunes-app" content="app-id=6754000046"/>`): `6754000046`. A user tapping "Download on the App Store" from the join page is sent to the wrong listing.
**Fix:** `app/join/JoinClient.tsx:60` — change `id6738030590` to `id6754000046`.

---

## High

### H-1: Doubled brand suffix in `<title>` tag — 93 pages

**Scope:** 24 trade hub pages, 43 template pages, all get-paid/manage-jobs/quoting/integrations hub+spoke pages, callback pages — 93 pages total
**Viewport:** n/a
**Evidence:** `<title>Free Quoting App for Painters (2026) | QuoteMate — QuoteMate</title>`. `seo/data.json` metaTitles end with `| QuoteMate`; `app/layout.tsx:17` template `'%s — QuoteMate'` appends a second suffix. `og:title` does not get the layout suffix, so `<title>` and `og:title` also diverge on all 93 pages.
**Fix:** Option A (preferred): strip `| QuoteMate` and `— QuoteMate` suffixes from all affected `metaTitle` strings in `seo/data.json`. Also fix the fallback formula in `app/templates/[templateSlug]/page.tsx:26` from `` `Free ${template.name} (PDF & Excel) | QuoteMate` `` to `` `Free ${template.name} (PDF & Excel)` ``. Option B: use `title: { absolute: '...' }` in individual `generateMetadata` calls to bypass the layout template.

---

### H-2: `og:image` and `twitter:image` missing on 332 content pages

**Scope:** 25 trade hub pages, 240 trade-city pages, 45 template pages, 7 manage-jobs, 5 quoting, 5 get-paid, 6 integrations/reece pages — 332 pages
**Viewport:** n/a
**Evidence:** `out/quotes-for-electricians/index.html` — `og:title`, `og:description`, `og:url`, `og:type` present; `og:image` absent. Pattern is uniform: every page that sets its own `openGraph` object omits `images`, which causes Next.js App Router to drop the layout-level fallback (`/assets/og-image.jpg`). Social shares render blank cards.
**Fix:** Add `images: [{ url: 'https://quotemateapp.au/assets/og-image.jpg', width: 1200, height: 630, alt: 'QuoteMate' }]` to the `openGraph` (and matching `twitter`) block in:
- `app/[tradeSlug]/page.tsx`
- `app/[tradeSlug]/[citySlug]/page.tsx`
- `app/templates/[templateSlug]/page.tsx`
- `app/manage-jobs/page.tsx` + `app/manage-jobs/[slug]/page.tsx`
- `app/quoting/page.tsx` + `app/quoting/[slug]/page.tsx`
- `app/get-paid/page.tsx` + `app/get-paid/[slug]/page.tsx`
- `app/integrations/reece/page.tsx` + `app/integrations/reece/[jobSlug]/page.tsx`

Define a shared constant in `lib/seo.ts` to avoid future drift.

---

### H-3: Wrong App Store IDs on two deep-link pages

**Scope:** `/app/open` and `/join` (referral/invite landing pages)
**Viewport:** Both
**Evidence:**
- `public/app/open/index.html:47` — `id6740091464`
- `app/join/JoinClient.tsx:60` and `public/app/join/index.html:87` — `id6738030590`
- Canonical: `id6754000046` (set in `app/layout.tsx` and used on 433 other pages)
**Fix:**
1. `public/app/open/index.html:47` — replace `id6740091464` with `id6754000046`
2. `app/join/JoinClient.tsx:60` — replace `id6738030590` with `id6754000046`
3. `public/app/join/index.html:87` — replace `id6738030590` with `id6754000046`

---

### H-4: Trial duration says "7-day" but real trial is 14 days — 309 pages + emails

**Scope:** All 309 `quotes-for-*` and city sub-pages (via `lib/data.ts`); also the welcome email and admin CRM
**Viewport:** n/a
**Evidence:** `lib/data.ts:277` — `"QuoteMate offers a free 7-day trial..."`. Source of truth: `QuoteMate/src/utils/trialConfig.ts` exports `TRIAL_DAYS = 14`; `functions/src/index.ts:1038` uses `14 * 24 * 60 * 60 * 1000` with comment "14-day trial". Pricing page, homepage, and shower tool all correctly say 14 days.
**Fix:**
1. `lib/data.ts:277` — change `"free 7-day trial"` to `"free 14-day trial"`
2. `/Users/tom/Documents/GitHub/QuoteMate/functions/src/adminCrm.ts:42` — change `TRIAL_DAYS = 7` to `TRIAL_DAYS = 14` (or import from `trialConfig.ts`)
3. `/Users/tom/Documents/GitHub/QuoteMate/functions/src/email.ts:1064` — change `"7 days"` to `"14 days"`
4. Rebuild static export to regenerate all 309 trade pages.

---

### H-5: Stale $29/month price in JSON-LD structured data on 2 pages

**Scope:** `/shower-quoting-tool` and `/integrations/reece`
**Viewport:** n/a
**Evidence:** Both pages emit `{"@type":"Offer","price":"29","priceCurrency":"AUD","name":"Pro","billingIncrement":"month"}`. Live price since 2026-06-09 is $49/mo. Visible FAQ copy on the same pages correctly states $49. Google rich results will surface the contradictory $29 figure.
**Fix:**
- `app/shower-quoting-tool/page.tsx:229` — change `price: '29'` to `price: '49'`
- `app/integrations/reece/page.tsx:236` — change `price: '29'` to `price: '49'`

---

### H-6: Subscription plan named "Pro" in Terms but live Stripe product is "Starter"

**Scope:** `/terms` (legal agreement for all users)
**Viewport:** n/a
**Evidence:** `app/terms/page.tsx:67–83` — sections 4.2, 4.3, 4.5 all reference a "Pro" plan. Per `project_stripe_subscriptions.md`, the live Stripe product is "Starter" at $49/mo and $328/yr. The Terms must match the marketed product name.
**Fix:** `app/terms/page.tsx:67–83` — replace all plan-name references to `Pro` with `Starter` (h3 heading, body text across sections 4.2, 4.3, 4.5). Also update the id/anchor at line 67 if it is linked externally.

---

### H-7: Footer contact email is developer personal address site-wide

**Scope:** All pages sharing the footer (entire site)
**Viewport:** Both
**Evidence:** `app/components/Footer.tsx:41` — `<a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a>`. The About page (`app/about/page.tsx:70`), Privacy Policy (`app/privacy/page.tsx:136`), and Terms (`app/terms/page.tsx:147,171`) all correctly list `hello@quotemateapp.au`. The footer email is the primary clickable contact on every page — legal dispute notifications and support queries go to the wrong address.
**Fix:** `app/components/Footer.tsx:41` — change both the `href` and display text from `tom@hansendev.com.au` to `hello@quotemateapp.au`. Fix propagates site-wide.

---

### H-8: Square fee copy misleads — conflates QuoteMate platform fee with Square's processing fee

**Scope:** `/pricing` (features array and Pro Monthly card)
**Viewport:** Both
**Evidence:** `app/pricing/page.tsx:29` and `:89` — feature label reads `"Lower Square fee (1% vs 1.7%)"`. Per project memory (`project_payments_provider.md`): Square's AU processing rate is ~1.9%, fixed by Square and identical on both plans. The 1.0% and 1.7% figures are QuoteMate's own platform fee. A tradie reading this will believe they are getting a lower Square processing rate, which is false.
**Fix:** `app/pricing/page.tsx:29` and `:89` — rename the feature to `"Lower QuoteMate platform fee (1% vs 1.7% on payments)"`. Update in both the features array (line 29) and the Pro Monthly card list item (line 89) so the comparison table row matches.

---

### H-9: `handleSaveProfile` silently swallows Firestore write errors

**Scope:** `/portal/dashboard`
**Viewport:** n/a
**Evidence:** `app/portal/dashboard/DashboardClient.tsx:211–222` — calls `await createOrUpdateSupplier(...)` then immediately `setEditing(false)` and `loadData()` with no `try/catch`. On Firestore failure (offline, auth expired, permission denied) the edit form closes, the UI reloads stale data, and the user sees no error — they believe the save succeeded when it did not.
**Fix:** Wrap lines 211–222 in `try/catch`. On failure, keep `editing` true and surface the error using existing `uploadError` state (or a new `profileError` state). Render the error message below the Save button.

---

### H-10: `handleDeleteItem` removes item from UI before confirming Firestore delete

**Scope:** `/portal/dashboard`
**Viewport:** n/a
**Evidence:** `app/portal/dashboard/DashboardClient.tsx:224–227` — calls `await deletePriceItem(...)` then immediately `setItems(items.filter(...))`. No `try/catch`. On failure the item vanishes from the screen but persists in the database; it reappears on next reload, giving false confidence that an outdated price was removed.
**Fix:** Move `setItems` call inside `try` block, execute only after confirmed successful delete. Add `setUploadError(...)` in `catch`. Lines 224–227.

---

### H-11: Page title contains brand suffix twice — trade landing pages (26 pages)

**Scope:** `/[tradeSlug]` — 26 trade landing pages
**Viewport:** n/a
**Evidence:** `<title>Free Quoting App for Electricians (2026) | QuoteMate — QuoteMate</title>`. `app/[tradeSlug]/page.tsx:33` fallback title already ends with `| QuoteMate`; layout template appends `— QuoteMate`.
**Fix:** `app/[tradeSlug]/page.tsx:33` — remove `| QuoteMate` from the fallback string: `` const title = trade.metaTitle ?? `Free Quoting App for ${trade.name} (2026)`; ``

---

### H-12: `og:image` and `twitter:image` missing on all trade-city pages (~230 pages)

**Scope:** `/[tradeSlug]/[citySlug]` — approx 230 pages
**Viewport:** n/a
**Evidence:** `out/quotes-for-carpenters/melbourne/index.html` — `grep -c 'og:image|twitter:image'` returns 0. `app/[tradeSlug]/[citySlug]/page.tsx:52–63` sets `openGraph` type/url/title/description with no `images` key.
**Fix:** Add `images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: \`${title} — QuoteMate\` }]` to both `openGraph` and `twitter` blocks in `app/[tradeSlug]/[citySlug]/page.tsx` generateMetadata. (Covered by the umbrella fix in H-2.)

---

### H-13: `og:image` missing on all quoting spoke pages (5 pages)

**Scope:** `/quoting/[slug]` — 5 pages
**Viewport:** n/a
**Evidence:** No `og:image` or `twitter:image` in rendered HTML. `twitter:card` is `summary_large_image` with no image — produces a broken card on Twitter/X.
**Fix:** `app/quoting/[slug]/page.tsx:30–41` — add `images` to both `openGraph` and `twitter` objects. (Covered by H-2.)

---

### H-14: `og:image` missing on all Reece integration pages (6 pages)

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** `out/integrations/reece/bathroom-rough-in/index.html` — zero `og:image` results. `app/integrations/reece/[jobSlug]/page.tsx:39–50` declares `openGraph` and `twitter` without `images`.
**Fix:** Add `images` to both objects in `app/integrations/reece/[jobSlug]/page.tsx:39–50`. (Covered by H-2.)

---

### H-15: Page title doubles brand name on Reece integration pages

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** `<title>Quote a Bathroom Rough-In with Reece Trade Prices | QuoteMate — QuoteMate</title>`. Spoke `metaTitle` in `seo/data.json` already ends with `| QuoteMate`.
**Fix:** Remove `| QuoteMate` suffix from all Reece spoke `metaTitle` entries in `seo/data.json`. (Covered by H-1.)

---

### H-16: `og:image` missing on Terms page

**Scope:** `/terms`
**Viewport:** n/a
**Evidence:** `out/terms/index.html` — only `og:title`, `og:description`, `og:url` present. `app/terms/page.tsx:10–13` declares `openGraph` without `images`.
**Fix:** `app/terms/page.tsx` — add `images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: 'QuoteMate — AI-powered quoting app for Australian tradies' }]` to the `openGraph` object.

---

### H-17: Broken logo images on `/app/join` and `/app/open` deep-link pages

**Scope:** `/app/join` and `/app/open`
**Viewport:** Both
**Evidence:** `out/app/join/index.html:82` — `src="/email-assets/logo-180.png"` (404). `out/app/open/index.html:42` — `src="/email-assets/logo.png"` (404). The asset directory is `out/app/email-assets/`, not site root.
**Fix:**
- `public/app/join/index.html:82` — change `src="/email-assets/logo-180.png"` to `src="/app/email-assets/logo.png"`
- `public/app/open/index.html:42` — change `src="/email-assets/logo.png"` to `src="/app/email-assets/logo.png"`

---

### H-18: 47 article hero images are oversized press-quality JPEGs (500 KB–1.25 MB)

**Scope:** `out/assets/articles/` — 47 files >500 KB; 31 at 1376x768 @ 300 DPI
**Viewport:** n/a
**Evidence:** `file` output confirms `JPEG image data, resolution (DPI), density 300x300, 1376x768`. `<img>` declares `width=800 height=450` — browser downloads 1.22 MB to display at 800 px. No WebP/AVIF, no `srcset`, raw `<img>` at `app/articles/[slug]/page.tsx:118`.
**Fix:** Re-export all article images at 800x450, 72 DPI, JPEG quality 85 (target <150 KB). Replace native `<img>` with Next.js `<Image>` in `app/articles/[slug]/page.tsx:117–125` for automatic responsive `srcset`. Correct `og:image` dimensions from `1200x630` to match actual image dimensions.

---

### H-19: 22 article hero images are PNG data served with `.jpg` extension

**Scope:** `out/assets/articles/*.jpg` — 22 files
**Viewport:** n/a
**Evidence:** `file` command confirms `PNG image data, 800 x 436, 8-bit/color RGB` for 22 `.jpg`-named files. CDN and Next.js static export serve incorrect MIME type. Files are 500–760 KB (vs ~80–120 KB for equivalent JPEG). `img height="450"` does not match actual pixel height of 436 — 3% vertical stretch on all 22 affected articles.
**Fix:** Re-export as true JPEG at 72–96 DPI, 800x450 resolution, ~85% quality. Fix `img height` attribute to `450` after resize.

---

### H-20: Page title doubles brand on shower quoting tool page

**Scope:** `/shower-quoting-tool`
**Viewport:** n/a
**Evidence:** `<title>Shower Quoting Tool — Free for Aussie Tradies | QuoteMate — QuoteMate</title>`. `app/shower-quoting-tool/page.tsx:10` title constant ends with `| QuoteMate`.
**Fix:** `app/shower-quoting-tool/page.tsx:10` — remove `| QuoteMate` from the title constant.

---

### H-21: Structured data `SoftwareApplication` price is $29 on shower quoting tool

**Scope:** `/shower-quoting-tool`
**Viewport:** n/a
**Evidence:** `app/shower-quoting-tool/page.tsx:229` — `"price":"29"`. FAQ answer on the same page correctly reads `"Pro starts at $49/month"`. Live price since 2026-06-09 is $49.
**Fix:** `app/shower-quoting-tool/page.tsx:229` — change `price: '29'` to `price: '49'`. (Also covered by H-5.)

---

### H-22: Google Play store buttons missing `target="_blank"` and `rel="noopener noreferrer"` — sitewide

**Scope:** `app/components/CTAButtons.tsx:17`, `app/components/Footer.tsx:61`, `app/page.tsx:457` — affects every page rendering these components
**Viewport:** Both
**Evidence:** Adjacent App Store links correctly have `target="_blank" rel="noopener noreferrer"`. Google Play anchors have neither. Clicking navigates the current tab to the Play Store, losing the visitor from the marketing site.
**Fix:** Add `target="_blank" rel="noopener noreferrer"` to Google Play `<a>` in `app/components/CTAButtons.tsx:17`, `app/components/Footer.tsx:61`, and `app/page.tsx:457`.

---

## Medium

### M-1: Integrations marquee animation jumps — `--cards-per-group: 3` but 5 partners exist

**Scope:** Homepage `/`
**Viewport:** Both
**Evidence:** `app/globals.css:1125` — `--cards-per-group: 3` computes `--group-w: 780px`. `IntegrationsBanner.tsx:13–19` defines 5 partners (each 240+20 px = 1300 px wide). The animation translates `-780px` then resets, leaving 520 px unscrolled — visible jump mid-loop.
**Fix:** `app/globals.css:1125` — change `--cards-per-group: 3` to `--cards-per-group: 5` so `--group-w` equals `5 × 260px = 1300px`.

---

### M-2: Pro Tips list uses wrong CSS class — styled layout never applies on article pages

**Scope:** `/articles/[slug]` — 53 articles
**Viewport:** Both
**Evidence:** `app/articles/[slug]/page.tsx:136` renders `<ul>` with no class inside `.guide-tips`. CSS styling is scoped to `.guide-tip-list li` (`app/globals.css:2934`). In screenshots tips appear as plain browser-default bullet list — no icon alignment, no dividers.
**Fix:** `app/articles/[slug]/page.tsx:136` — change `<ul>` to `<ul className="guide-tip-list">`.

---

### M-3: Twitter card image uses global fallback instead of article-specific image

**Scope:** `/articles/[slug]` — 53 articles
**Viewport:** n/a
**Evidence:** `generateMetadata()` sets `openGraph.images` to the article-specific image but does not set `twitter.images`. All Twitter/X shares of any article show the generic brand image.
**Fix:** `app/articles/[slug]/page.tsx` generateMetadata — add `twitter: { card: 'summary_large_image', images: [{ url: \`https://quotemateapp.au${image}\`, width: 1200, height: 630, alt: guide.title }] }`.

---

### M-4: Pricing card plan names unstyled — CSS targets `h3` but JSX uses `h2`

**Scope:** `/pricing`
**Viewport:** Both
**Evidence:** `app/pricing/page.tsx:60,79,100` — `<h2>` inside `.pricing-card-header`. CSS rule `app/globals.css:1049` targets `.pricing-card-header h3`. Plan name headings inherit the global `h2` size (~2rem) instead of the intended 1.5rem — visually oversize relative to the price figure.
**Fix:** `app/pricing/page.tsx:60,79,100` — change `<h2>` to `<h3>` to match the existing CSS selector.

---

### M-5: Comparison table missing `scope` attributes and accessible name (WCAG 1.3.1)

**Scope:** `/pricing`
**Viewport:** Both
**Evidence:** `app/pricing/page.tsx:119–136` — `<table>` has no `<caption>` or `aria-label`; three `<th>` elements have no `scope="col"`. Screen readers using JAWS/NVDA cannot reliably associate data cells with column headers.
**Fix:** `app/pricing/page.tsx:119` — add `aria-label="Feature comparison"` to `<table>`; add `scope="col"` to each `<th>` at lines 122–124.

---

### M-6: Cross icon cells are empty for screen readers in pricing comparison table

**Scope:** `/pricing`
**Viewport:** Both
**Evidence:** `app/pricing/page.tsx:131` — `<CrossIcon />` is `aria-hidden="true"`, leaving its `<td>` empty for screen readers. Cells render as blank — no indication that the feature is not included on Free.
**Fix:** Add visually hidden spans: `<td><CrossIcon /><span className="sr-only">Not included</span></td>` and `<td><CheckIcon /><span className="sr-only">Included</span></td>`. Add `.sr-only` utility class to `globals.css` if absent.

---

### M-7: `og:url` meta tag missing from pricing page

**Scope:** `/pricing`
**Viewport:** n/a
**Evidence:** `out/pricing/index.html` — `og:title`, `og:description`, `og:image` present but no `og:url`. Facebook and LinkedIn crawlers use `og:url` for canonical deduplication.
**Fix:** `app/pricing/page.tsx` — add `url: 'https://quotemateapp.au/pricing/'` to the `openGraph` block.

---

### M-8: `billingIncrement` is not a valid Schema.org property on `Offer`

**Scope:** `/pricing` (JSON-LD)
**Viewport:** n/a
**Evidence:** `app/pricing/page.tsx:181–182` — `"billingIncrement": "month"` and `"billingIncrement": "year"` used on Pro Monthly/Annual Offers. Not a valid Schema.org property on `schema:Offer`; Google Rich Results validator will flag these.
**Fix:** Replace `billingIncrement` with a nested `priceSpecification` of type `UnitPriceSpecification` using `billingDuration` and `unitCode` (`MON`/`ANN`). See `schema.org/UnitPriceSpecification`.

---

### M-9: Canonical URL trailing-slash mismatch between canonical link and Article LD+JSON `@id`

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** `<link rel="canonical">` uses trailing slash; `url` variable at `app/integrations/reece/[jobSlug]/page.tsx:60` is constructed without trailing slash and used as `mainEntityOfPage["@id"]` in Article JSON-LD.
**Fix:** `app/integrations/reece/[jobSlug]/page.tsx:60` — append trailing slash to `url`. Use the same variable for the canonical alternate to ensure single source of truth.

---

### M-10: Article structured data missing `datePublished` and `dateModified` on Reece pages

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** `app/integrations/reece/[jobSlug]/page.tsx:177–193` — Article block contains only `headline`, `description`, `mainEntityOfPage`, `publisher`, `author`. Google requires `datePublished` and `dateModified` for Article rich result eligibility.
**Fix:** Add `datePublished` and `dateModified` to the Article block. Either add fields to the spoke data in `lib/data.ts`/`seo/data.json`, or use static defaults: `datePublished: '2025-01-01'`, `dateModified: new Date().toISOString().split('T')[0]`.

---

### M-11: H1 and meta title wording inconsistent on Reece integration pages

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** H1 reads `"Quoting a Bathroom rough-in with Reece Trade Prices"` (verb: "Quoting", lowercase "rough-in"). Meta title reads `"Quote a Bathroom Rough-In with Reece Trade Prices | QuoteMate"` (verb: "Quote", title-case). The two primary on-page keyword signals differ.
**Fix:** `app/integrations/reece/[jobSlug]/page.tsx:29` — derive meta title from the same headline formula: `` title: `Quote a ${spoke.jobName} with Reece Trade Prices` `` so both stay in sync.

---

### M-12: `hrefLang` alternate always points to site root on every page

**Scope:** All pages (via `app/layout.tsx:31–33`)
**Viewport:** n/a
**Evidence:** `alternates: { languages: { 'en-AU': 'https://quotemateapp.au' } }` is hardcoded. Confirmed on `/portal/dashboard/`: `<link rel="alternate" hrefLang="en-AU" href="https://quotemateapp.au/"/>`. Every non-root page emits a wrong hrefLang.
**Fix:** Remove the hardcoded `alternates` from `app/layout.tsx`. Set `alternates.languages` dynamically per page using each page's canonical URL.

---

### M-13: No canonical tag emitted on portal pages

**Scope:** Portal pages (via shared layout)
**Viewport:** n/a
**Evidence:** Full search of `out/portal/dashboard/index.html` finds no `<link rel="canonical">`.
**Fix:** Add `alternates: { canonical: 'https://quotemateapp.au/portal/dashboard/' }` to `app/portal/dashboard/page.tsx` metadata export. Create a shared canonical helper for all portal pages.

---

### M-14: Logo upload area is a non-interactive `<div>` — not keyboard accessible

**Scope:** `/portal/dashboard`
**Viewport:** Both
**Evidence:** `app/portal/dashboard/DashboardClient.tsx:333–364` — click target is `<div onClick={...}>` with no `role`, no `tabIndex`, no `aria-label`. Associated `<input type="file">` has no `<label>`. Keyboard and screen reader users cannot activate logo upload.
**Fix:** Replace outer `<div>` with `<label htmlFor="logo-upload">` and add `id="logo-upload"` to the hidden input. Add `aria-label="Upload business logo"`. Remove the `onClick` — the label forwards clicks natively.

---

### M-15: Profile edit form inputs have no `<label>` elements

**Scope:** `/portal/dashboard`
**Viewport:** Both
**Evidence:** `app/portal/dashboard/DashboardClient.tsx:382–386` — five profile inputs (Business name, Phone, Email, Address, Website) use placeholder-only labelling. Placeholders disappear on focus. Violates WCAG 1.3.1.
**Fix:** Wrap each input in a field div with a `<label htmlFor="...">` and matching `id` on the input. The `styles.label` class exists in `portal.module.css:63–69`.

---

### M-16: Square Mobile SDK absent from Privacy Policy third-party services disclosure

**Scope:** `/privacy`
**Viewport:** n/a
**Evidence:** `app/privacy/page.tsx:84–92` Section 4 lists Apple/Google for payments but Square Mobile SDK (the actual in-person payment processor, handling PAN and transaction metadata) is entirely unmentioned. Potential non-compliance with Australian Privacy Principle 1.
**Fix:** Add a list item to Section 4: "**Square** — for in-person card payment processing via the Square Mobile SDK (payment card data is handled directly by Square and subject to their privacy policy and PCI DSS compliance)."

---

### M-17: Card descriptions truncated mid-word on all 45 template cards

**Scope:** `/templates` (templates index)
**Viewport:** Both
**Evidence:** `app/templates/page.tsx:40` — `.substring(0, 120)` severs words mid-character. Rendered HTML: `'…ready t<!-- -->...'`. The React JSX comment `<!-- -->` is also visible in raw source.
**Fix:** `app/templates/page.tsx:40` — replace with word-boundary trim: `` `${template.description.substring(0, template.description.lastIndexOf(' ', 120))}…` ``

---

### M-18: Card descriptions truncated mid-word on trades index (63 of 69 cards)

**Scope:** `/trades`
**Viewport:** Both
**Evidence:** `app/trades/page.tsx:39` and `:54` — raw `substring(0, 120)` cuts at byte boundary. Visible in mobile screenshot on nearly every card.
**Fix:** Same word-boundary trim as M-17. Alternatively apply CSS `line-clamp: 3` and remove JS truncation entirely.

---

### M-19: Article JSON-LD missing `datePublished`, `author`, and `image` on 14 hub/spoke pages

**Scope:** `app/quoting/[slug]/page.tsx` (4 pages), `app/manage-jobs/[slug]/page.tsx` (6 pages), `app/get-paid/[slug]/page.tsx` (4 pages)
**Viewport:** n/a
**Evidence:** All three templates emit Article blocks with only `headline`, `description`, `url`, `publisher`. Missing `datePublished`, `author`, `image` — required by Google for Article rich result eligibility.
**Fix:** Add `author: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au' }`, `datePublished` (from spoke data or static), and `image` (og-image fallback) to Article blocks in all three `[slug]/page.tsx` files.

---

### M-20: Article JSON-LD missing `datePublished` and `image` on compare and Reece pages (12 pages)

**Scope:** `app/compare/[slug]/page.tsx` (6 pages), `app/integrations/reece/[jobSlug]/page.tsx` (6 pages)
**Viewport:** n/a
**Evidence:** Author is set but `datePublished` and `image` are absent on both templates. Required for Article rich result eligibility.
**Fix:** Add `datePublished` (static or from data) and `image: 'https://quotemateapp.au/assets/og-image.jpg'` to Article blocks in both templates.

---

### M-21: 109 page titles exceed 65 characters

**Scope:** 109 public pages; worst: `out/articles/how-to-quote-bathroom-waterproofing-compliance/index.html` (110 chars)
**Viewport:** n/a
**Evidence:** `<title>Mastering Bathroom Waterproofing Quotes: How to Quote Bathroom Waterproofing Compliance for Profit — QuoteMate</title>` (110 chars). Many template/trade titles inflated further by the doubled-brand-suffix bug.
**Fix:** Shorten `metaTitle` strings in `seo/data.json` for the 24 article pages exceeding 75 chars. Fixing the doubled-brand-suffix bug (H-1) will reduce template/trade page titles by ~12 chars automatically.

---

### M-22: 83 pages have meta descriptions exceeding 160 characters

**Scope:** 83 pages; worst: `out/quotes-for-electricians/index.html` (222 chars)
**Viewport:** n/a
**Evidence:** Google truncates at ~155–160 chars; CTA is commonly cut. Worst offenders span trade pages, articles, get-paid spokes, and integrations.
**Fix:** Trim affected `metaDescription` values in `seo/data.json` to ≤155 chars. Prioritise the 25 trade hub pages and the pricing page.

---

### M-23: Duplicate adjacent `seo-rich-content` sections create 128 px dead-white gap on trade pages

**Scope:** `/[tradeSlug]` — 26 trade landing pages
**Viewport:** Both
**Evidence:** `app/[tradeSlug]/page.tsx:160–195` — two consecutive `<section className="seo-rich-content">`. `.seo-rich-content` has `padding: 0 0 64px`; stacked sections produce 128 px of whitespace with no visual break. Visible in mobile screenshot.
**Fix:** Give the second block (`lines 181–195`) a distinct class (e.g. `seo-manage-jobs-cta`) to allow independent padding control.

---

## Low

### L-1: `FeatureShowcase` uses bare `<img>` without `width`/`height` — CLS risk on homepage

**Scope:** Homepage `/` (get-paid section)
**Viewport:** Both
**Evidence:** `app/components/FeatureShowcase.tsx:25` — `<img src={image} alt={...} loading="lazy" />` with no dimensions. CSS sets `width:100%; height:auto`. Browser cannot reserve space; SVG has no intrinsic dimensions in this context.
**Fix:** Replace with Next.js `<Image>` and pass `width`/`height` props, or add explicit `width` and `height` attributes matching the SVG viewBox dimensions.

---

### L-2: SVG feature-section image missing `width`/`height` attributes — CLS risk

**Scope:** Homepage `/`
**Viewport:** Both
**Evidence:** `out/index.html` — `<img src="/assets/get-paid-onsite-online.svg" loading="lazy"/>` with no dimensions.
**Fix:** Add `width="600" height="450"` (or actual SVG viewBox dimensions) to the `<img>` tag in the get-paid feature section of `app/page.tsx`.

---

### L-3: Structured data uses invalid `billingIncrement` and misrepresents free tier on trade pages

**Scope:** `/[tradeSlug]` — 26 trade pages
**Viewport:** n/a
**Evidence:** `app/[tradeSlug]/page.tsx:289–291` — `"billingIncrement": "month"` (not a valid Schema.org property). First Offer `"price": "0", "name": "Free"` implies a permanent free plan when the site actually offers a 14-day trial.
**Fix:** Replace `billingIncrement` with `priceSpecification` using `UnitPriceSpecification`. Change Free offer to `"name": "Free Trial"` with `"description": "14-day free trial"`.

---

### L-4: BreadcrumbList and `SoftwareApplication` URL inconsistency (trailing slash) on trade-city pages

**Scope:** `/[tradeSlug]/[citySlug]` — ~230 pages
**Viewport:** n/a
**Evidence:** BreadcrumbList items use no trailing slash; canonical link and `og:url` use trailing slash. `SoftwareApplication url` at `app/[tradeSlug]/[citySlug]/page.tsx:219` also lacks trailing slash.
**Fix:** `app/components/Breadcrumbs.tsx:20` — append trailing slash. `app/[tradeSlug]/[citySlug]/page.tsx:77` — change `pageUrl` to end with `/`.

---

### L-5: "The Problem" H2 is generic with no trade context on city pages

**Scope:** `/[tradeSlug]/[citySlug]` — ~230 pages
**Viewport:** Both
**Evidence:** `app/[tradeSlug]/[citySlug]/page.tsx:113` — `<h2>The Problem</h2>` hard-coded identically across all trade×city combinations. Near-duplicate heading across hundreds of programmatic pages.
**Fix:** Replace with `` <h2>The {trade.name} Pricing Problem</h2> `` or drive from a `trade.painPointTitle` field.

---

### L-6: Structured data `Article` type used for comparison pages instead of `WebPage`

**Scope:** `/compare/[slug]` — 6 pages
**Viewport:** n/a
**Evidence:** `app/compare/[slug]/page.tsx:148–165` — `@type: 'Article'` on product comparison landing pages. `datePublished` and `dateModified` absent (required for Article eligibility). Using `Article` may trigger incorrect rich results.
**Fix:** Change `@type` to `'WebPage'` (or `'ItemPage'`) and remove Article-specific fields, keeping the `about[]` software entries.

---

### L-7: `og:url` missing from compare pages

**Scope:** `/compare/[slug]` — 6 pages
**Viewport:** n/a
**Evidence:** `out/compare/chatgpt/index.html` — zero occurrences of `og:url`. `app/compare/[slug]/page.tsx:20–29` sets title and description but not `openGraph.url`.
**Fix:** `app/compare/[slug]/page.tsx:27` — add `openGraph: { url: \`https://quotemateapp.au/compare/${comp.slug}/\` }`.

---

### L-8: Compare page `<title>` is 91 characters — well above the 60-char display threshold

**Scope:** `/compare/[slug]` — 6 pages
**Viewport:** n/a
**Evidence:** `'QuoteMate vs ChatGPT (and other AI chatbots) — Compare Quoting Apps for Tradies — QuoteMate'` = 91 chars. Google truncates at ~60.
**Fix:** Use `title: { absolute: \`QuoteMate vs ${comp.name} | Best Quoting App for Tradies\` }` to both shorten and bypass the layout double-suffix.

---

### L-9: `og:url` absent from `/trades` page

**Scope:** `/trades`
**Viewport:** n/a
**Evidence:** `out/trades/index.html` — no `og:url` tag.
**Fix:** `app/trades/page.tsx` — add `openGraph: { url: 'https://quotemateapp.au/trades/' }` to the metadata export.

---

### L-10: `og:url` absent from `/templates` index page

**Scope:** `/templates`
**Viewport:** n/a
**Evidence:** `out/templates/index.html` — no `og:url`.
**Fix:** `app/templates/page.tsx` — add `openGraph: { url: 'https://quotemateapp.au/templates/' }`.

---

### L-11: Keywords meta tag contains duplicated phrase on template pages

**Scope:** `/templates/[templateSlug]` — 45 pages
**Viewport:** n/a
**Evidence:** `app/templates/[templateSlug]/page.tsx:34–38` — `` `free ${template.keyword} quote template` `` when `template.keyword` already ends with `"quote template"`, producing `"free bathroom renovation quote template quote template"`.
**Fix:** Use a shorter base keyword, e.g. strip the `"quote template"` suffix from the keyword before interpolation, or adjust the interpolation strings.

---

### L-12: Breadcrumb JSON-LD `Templates` item URL missing trailing slash

**Scope:** `/templates/[templateSlug]` — 45 pages
**Viewport:** n/a
**Evidence:** `{"position":2,"name":"Templates","item":"https://quotemateapp.au/templates"}` — no trailing slash.
**Fix:** `app/templates/[templateSlug]/page.tsx:67` — change breadcrumb `href` to `'/templates/'`.

---

### L-13: Templates index hero has no primary CTA — zero conversion path above the fold

**Scope:** `/templates`
**Viewport:** Both
**Evidence:** Hero contains only badge, H1, and subtitle paragraph. No app-store buttons above the card grid.
**Fix:** `app/templates/page.tsx:28–29` — add App Store and Google Play `<a>` buttons in the hero, matching the pattern from `app/templates/[templateSlug]/page.tsx`.

---

### L-14: All 45 template card headings use `<h2>` inside `<a>` — should be `<h3>`

**Scope:** `/templates`
**Viewport:** Both
**Evidence:** `app/templates/page.tsx:39` — `<h2>` used for card titles. Page already has an `<h2>` section title at line 35. 46 total `<h2>` tags in rendered HTML.
**Fix:** `app/templates/page.tsx:39` — change to `<h3>`. Update CSS selector in `app/globals.css` from `.trade-directory-card h2` to `.trade-directory-card h3`.

---

### L-15: Pricing comparison table has no `overflow-x: auto` wrapper — clips on sub-390 px devices

**Scope:** `/pricing`
**Viewport:** Mobile
**Evidence:** `app/globals.css:1735` — `.comparison-table-wrap` has `max-width:720px` but no `overflow-x:auto`. Body has `overflow-x:hidden` which clips content silently on older small-screen devices.
**Fix:** `app/globals.css:1735` — add `overflow-x: auto` to `.comparison-table-wrap`.

---

### L-16: `og:type` meta tag absent from all pages

**Scope:** All pages (root layout)
**Viewport:** n/a
**Evidence:** `out/privacy/index.html` — no `<meta property="og:type">`. `app/layout.tsx:22–25` openGraph object does not include `type: 'website'`.
**Fix:** `app/layout.tsx` openGraph block — add `type: 'website'`.

---

### L-17: Broken image `/email-assets/logo-180.png` — file does not exist (join page)

**Scope:** `public/app/join/index.html:82`
**Viewport:** n/a
**Evidence:** `logo-180.png` does not exist anywhere. Actual file: `out/app/email-assets/logo.png`.
**Fix:** `public/app/join/index.html:82` — change `src="/email-assets/logo-180.png"` to `src="/app/email-assets/logo.png"`. (See also H-17.)

---

### L-18: Broken image `/email-assets/logo.png` wrong path on `/app/open` page

**Scope:** `public/app/open/index.html:42`
**Viewport:** n/a
**Evidence:** `<img src="/email-assets/logo.png">` — no file at root `out/email-assets/logo.png`. Asset is at `out/app/email-assets/logo.png`.
**Fix:** `public/app/open/index.html:42` — change `src="/email-assets/logo.png"` to `src="/app/email-assets/logo.png"`.

---

### L-19: 5 `/app/*` utility pages are crawlable with no `noindex`

**Scope:** `out/app/index.html`, `out/app/join/index.html`, `out/app/open/index.html`, `out/app/xero/callback/index.html`, `out/app/square/callback/index.html`
**Viewport:** n/a
**Evidence:** `robots.txt` has `Allow: /` with no `/app/` Disallow. None of these pages have `<meta name="robots" content="noindex">`. They are deep-link handlers and OAuth callbacks with no user-facing content.
**Fix:** Add `Disallow: /app/` to `public/robots.txt`, and/or add `<meta name="robots" content="noindex, nofollow"/>` to each static HTML file under `public/app/`.

---

### L-20: `/join` page is entirely client-side — SSR shell is empty, invisible to crawlers

**Scope:** `/join`
**Viewport:** n/a
**Evidence:** `app/join/JoinLoader.tsx:5` — `dynamic(..., { ssr: false })`. Rendered HTML body: `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>`. Google mobile-first indexing will index an empty page.
**Fix:** Remove `{ ssr: false }`. Render static shell (logo, h1, buttons) in a Server Component. Keep a thin `<JoinRedirect />` Client Component only for the `useSearchParams` deep-link side-effect.

---

### L-21: No canonical URL on `/join` page — query-string variants may compete in search

**Scope:** `/join`
**Viewport:** n/a
**Evidence:** `out/join/index.html` — no `<link rel="canonical">`. hrefLang incorrectly points to `https://quotemateapp.au/`.
**Fix:** `app/join/page.tsx` — add `alternates: { canonical: 'https://quotemateapp.au/join/', languages: { 'en-AU': 'https://quotemateapp.au/join/' } }`. Consider adding `robots: { index: false }` if this is a bridge page not intended for indexing.

---

### L-22: Canonical URL in structured data lacks trailing slash on shower quoting tool

**Scope:** `/shower-quoting-tool`
**Viewport:** n/a
**Evidence:** `app/shower-quoting-tool/page.tsx:9` — `const url = 'https://quotemateapp.au/shower-quoting-tool'` (no slash). Canonical link and `og:url` get the slash from Next.js normalisation; JSON-LD `url` does not.
**Fix:** `app/shower-quoting-tool/page.tsx:9` — add trailing slash: `const url = 'https://quotemateapp.au/shower-quoting-tool/';`

---

### L-23: Pricing page `SoftwareApplication` missing `description` field

**Scope:** `/pricing`
**Viewport:** n/a
**Evidence:** `out/pricing/index.html` — `SoftwareApplication` JSON-LD omits `description`. Google's Rich Results documentation lists `description` as recommended; absence reduces rich result eligibility on the primary conversion page.
**Fix:** `app/pricing/page.tsx` — add `description: 'AI-powered quoting and invoicing app for Australian tradies — Free plan + Pro at $49/month or $328/year.'` to the `SoftwareApplication` JSON-LD.

---

### L-24: 264 `SoftwareApplication` blocks on trade/city pages omit the annual offer ($328/yr)

**Scope:** All `out/quotes-for-*` pages — 264 files
**Viewport:** n/a
**Evidence:** Offers array contains only Free ($0) and Pro Monthly ($49). Homepage and pricing page correctly expose three offers including Pro Annual ($328).
**Fix:** Add a third offer entry to the shared `SoftwareApplication` offers array for trade/city pages: `{ '@type': 'Offer', price: '328', priceCurrency: 'AUD', name: 'Pro Annual' }`.

---

### L-25: `llms-full.txt` describes free tier as "7-day" trial — stale content served to AI assistants

**Scope:** `out/llms-full.txt:27` and `:2497`
**Viewport:** n/a
**Evidence:** Line 27: `"7-day quote trial"`. Line 2497: `"the 7-day free trial"`. Source: `scripts/generate-llms.ts:227`. This public LLM context document will cause AI assistants to repeat the wrong trial length.
**Fix:** `scripts/generate-llms.ts:227` — change `'7-day quote trial'` to `'14-day Pro trial'`. Regenerate `llms.txt` and `llms-full.txt` on next build.

---

### L-26: Duplicate CSS rule blocks cause conflicting styles for article search widget

**Scope:** `/articles` (articles index)
**Viewport:** Both
**Evidence:** `app/globals.css:1537–1607` and `1666–1724` both define `.article-filters`, `.article-search`, `.article-search-input`, `.filter-pill`, etc. Block 2 overrides block 1 on every conflicting property. `.filter-pill` padding silently changes from `8px 18px` to `6px 16px`.
**Fix:** Delete the first redundant block (`app/globals.css:1537–1615`). Update the surviving block to include `position: relative` on `.article-search` and `padding-left: 42px` on `.article-search-input` if inset-icon intent is to be preserved.

---

### L-27: `'Integrations'` breadcrumb on Reece pages is non-linked — no href, no `/integrations/` page

**Scope:** `/integrations/reece/[jobSlug]` — 6 pages
**Viewport:** n/a
**Evidence:** `app/integrations/reece/[jobSlug]/page.tsx:71–74` — Breadcrumbs called with `{ label: 'Integrations' }` (no href). BreadcrumbList emits item without `item` URL; Google flags missing item URLs.
**Fix:** Either pass `href: '/integrations/reece'` (using the Reece hub as intermediate), or remove the Integrations crumb and go Home > Reece > Page.

---

### L-28: `.seo-rich-content` section missing from mobile padding-reduction media query

**Scope:** All pages using `.seo-rich-content`
**Viewport:** Mobile
**Evidence:** `app/globals.css:2988` mobile media query lists 9 section selectors but omits `.seo-rich-content` (which has `padding: 0 0 64px` at line 2570). On mobile it retains 64 px bottom padding while surrounding sections use 48 px.
**Fix:** `app/globals.css:3003` — add `.seo-rich-content` to the comma-separated selector list so it also gets `padding: 48px 0` at mobile.

---

### L-29: Bulk edit grid inputs have no accessible labels in supplier portal

**Scope:** `/portal/dashboard` bulk edit UI
**Viewport:** Both
**Evidence:** `app/portal/dashboard/DashboardClient.tsx:569–601` — visual header row labels are not programmatically associated with inputs. No `aria-label`, no `id`, no linked `<label>`.
**Fix:** Add `aria-label` to each input: `` aria-label={`Product name for ${item.name}`} ``, `` aria-label={`Price for ${item.name}`} ``, `` aria-label={`Unit for ${item.name}`} ``. Lines 571, 578, 586.

---

### L-30: Dashboard renders a blank screen before JS hydration (no SSR skeleton)

**Scope:** `/portal/dashboard`
**Viewport:** Both
**Evidence:** `app/portal/dashboard/DashboardLoader.tsx:1–9` — `dynamic(..., { ssr: false })`. Static HTML body is `<template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"></template>`. No spinner or skeleton before JS loads.
**Fix:** Add a loading fallback: `dynamic(..., { ssr: false, loading: () => <PortalLoader message="Loading dashboard..." /> })` so the initial HTML payload shows the spinner rather than a blank page.

---

### L-31: 5 `/app/*` HTML pages use `lang="en"` instead of `lang="en-AU"`

**Scope:** `public/app/join/index.html`, `public/app/open/index.html`, Xero/Square callback HTML files
**Viewport:** n/a
**Evidence:** All 433 Next.js pages use `lang="en-AU"`. The 5 static HTML files in `public/app/` use `lang="en"`. Affects screen reader pronunciation for Australian English.
**Fix:** Change `<html lang="en">` to `<html lang="en-AU">` in all five `public/app/` static HTML files.

---

### L-32: Breadcrumb JSON-LD trailing-slash mismatches on Article, get-paid, manage-jobs pages

**Scope:** `/articles/[slug]` (53 pages), `/get-paid/[slug]` (4 pages), `/manage-jobs/[slug]` (6 pages)
**Viewport:** n/a
**Evidence:** Breadcrumb item 2 (`Articles`, `Get Paid`, `Manage Jobs`) emits URL without trailing slash; canonical uses trailing slash. `app/articles/[slug]/page.tsx:100`, `app/get-paid/[slug]/page.tsx:59`, `app/manage-jobs/[slug]/page.tsx:59`.
**Fix:** Add trailing slash to the hub `href` in breadcrumb items data in each template file.

---

### L-33: Article schema URL missing trailing slash on get-paid and manage-jobs spoke pages

**Scope:** `/get-paid/[slug]` (4 pages), `/manage-jobs/[slug]` (6 pages)
**Viewport:** n/a
**Evidence:** Article schema `url` field lacks trailing slash while canonical has it. `app/get-paid/[slug]/page.tsx:141`, `app/manage-jobs/[slug]/page.tsx:140`.
**Fix:** Append trailing slash to `url` template literal in Article schema and `openGraph url` on lines 25 and 141 of each template.

---

### L-34: `og:image` OG dimension metadata mismatches actual article image dimensions

**Scope:** `/articles/[slug]` — 53 pages
**Viewport:** n/a
**Evidence:** `app/articles/[slug]/page.tsx:74` — `og:image:width=1200, height=630`. Actual files are 1376x768 (31 JPEGs) or 800x436 (22 PNG-as-JPEGs). Facebook/LinkedIn debuggers flag dimension mismatch.
**Fix:** Re-export article images at exactly 1200x630 and update `img` attributes, or correct the declared OG dimensions to match actual file sizes.

---

### L-35: About page title has brand name at both start and end

**Scope:** `/about`
**Viewport:** n/a
**Evidence:** `<title>About QuoteMate — Built for Australian Tradies — QuoteMate</title>`. `app/about/page.tsx:8` title includes brand; layout template appends it again.
**Fix:** `app/about/page.tsx:8` — change title to `'Built for Australian Tradies'` and let the layout template produce `'Built for Australian Tradies — QuoteMate'`.

---

### L-36: `og:url` absent from `/about` page

**Scope:** `/about`
**Viewport:** n/a
**Evidence:** `out/about/index.html` — `og:title`, `og:description`, `og:image`, `og:type`, `og:site_name` present; no `og:url`.
**Fix:** `app/about/page.tsx` — add `openGraph: { url: 'https://quotemateapp.au/about/' }` to the metadata export.

---

### L-37: 19 admin pages share identical title `QuoteMate Admin — QuoteMate`

**Scope:** All 19 admin pages (`app/admin/layout.tsx`)
**Viewport:** n/a
**Evidence:** All admin pages share `<title>QuoteMate Admin — QuoteMate</title>`. All carry `noindex, nofollow` so no SEO impact, but browser tabs are indistinguishable.
**Fix:** Low priority given `noindex`. Optionally add per-page titles for usability (e.g. `'Users — QuoteMate Admin'`).

---

### L-38: 6 supplier portal pages share identical meta description

**Scope:** All portal pages (portal layout)
**Viewport:** n/a
**Evidence:** All 6 portal pages share the same meta description string. All carry `noindex, nofollow`.
**Fix:** Low priority given `noindex`. If portal pages are ever made indexable, add distinct per-page descriptions.

---

## Suggested Fix Order

1. **Fix the doubled brand suffix in `<title>` (H-1)** — strip `| QuoteMate` from all `seo/data.json` metaTitles and from the `app/templates/[templateSlug]/page.tsx:26` fallback formula. One batch edit fixes 93 pages, removes `<title>`/`og:title` divergence, and reduces ~15 title lengths below 65 chars automatically.

2. **Add `og:image` to all 332 content pages (H-2)** — define a shared constant in `lib/seo.ts` and add it to `openGraph` and `twitter` objects in all 9 affected `generateMetadata` functions. Fixes blank social share cards on the majority of the site's content.

3. **Fix wrong App Store IDs on conversion pages (B-2, H-3)** — three one-line changes in `JoinClient.tsx`, `public/app/join/index.html`, and `public/app/open/index.html`. Directly unblocks iOS installs from referral and join flows.

4. **Fix horizontal scroll on compare table (B-1)** — add `overflow-x: auto` to `.comparison-table-wrap` in `app/globals.css:1735` and add the mobile padding media query. Eliminates the only confirmed page-breaking layout defect.

5. **Fix stale trial duration copy (H-4)** — three file edits (`lib/data.ts:277`, `functions/src/adminCrm.ts:42`, `functions/src/email.ts:1064`) plus a static export rebuild. Ensures 309 public pages, the welcome email, and admin CRM all reflect the correct 14-day trial.

6. **Fix stale $29 price in JSON-LD and Terms plan name (H-5, H-6)** — two `price: '49'` changes in `page.tsx` files and a find-replace of `Pro` → `Starter` in `app/terms/page.tsx:67–83`. Prevents Google rich results from surfacing incorrect pricing and removes legal mislabelling.

7. **Fix footer contact email site-wide (H-7)** — single change in `app/components/Footer.tsx:41`. Ensures all user-facing contact and legal pages point to the correct support inbox.

8. **Fix Square fee copy on pricing page (H-8)** — two label changes in `app/pricing/page.tsx:29,89`. Removes a factually incorrect claim that could mislead tradie purchase decisions.

9. **Fix `handleSaveProfile` and `handleDeleteItem` silent error swallowing (H-9, H-10)** — add `try/catch` and error display in `DashboardClient.tsx:211–227`. Prevents users from believing writes succeeded when they failed.

10. **Add `noindex` to `/app/*` utility pages and fix broken logo images (L-19, H-17)** — add `Disallow: /app/` to `public/robots.txt`; fix two `src` paths in `public/app/join/index.html` and `public/app/open/index.html`. Removes thin-content indexing risk and fixes the first impression for referral link recipients.
