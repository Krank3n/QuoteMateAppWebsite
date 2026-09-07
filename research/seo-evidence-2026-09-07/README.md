# Search Console + field performance evidence — 7 September 2026

Every number below is dated, scoped and sourced. Where a figure could not be
obtained it says so; nothing is filled in with a guess, a lab number or a zero.

## Provenance and its limits

| Source | How it was read | Limitation |
|---|---|---|
| Search Console Performance | Search Console **web UI**, signed in as the property owner | The UI rounds (`1.05K`, `30.1K`). Precise integers need the API. |
| Search Console Page indexing | Search Console web UI | Snapshot dated by Google as "Last update 9/4/26". |
| Search Console Core Web Vitals | Search Console web UI | Source is CrUX; "Last updated 9/5/26". |
| Field Core Web Vitals | **PageSpeed Insights API**, OAuth + `hansendev` quota project | CrUX 28-day rolling window; not a per-day series. |
| Indexed/page counts | Search Console web UI | Google's index state, not a crawl of the site. |

**The Search Console API was NOT used for these figures.** `searchconsole.googleapis.com`
is now enabled on `hansendev` (it was disabled; enabling it was the fix), but the
local Application Default Credential still carries no `webmasters.readonly`
scope, so every API call returns `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT`. The
owner action that closes this is in the sprint document. Until then these are
UI reads: correct, but rounded and without the full query x page matrix,
device split, or period-over-period comparison.

## Search Console — Australia, Web search

Windows end 2026-09-05, Google's last complete day at time of reading.

### 28 days · 2026-08-09 to 2026-09-05

| Metric | Value |
|---|---:|
| Total clicks | 413 |
| Total impressions | 30,100 (UI-rounded "30.1K") |
| Average CTR | 1.4% |
| Average position | 26.8 |

### 90 days · 2026-06-08 to 2026-09-05

| Metric | Value |
|---|---:|
| Total clicks | 1,050 (UI-rounded "1.05K") |
| Total impressions | 60,500 (UI-rounded "60.5K") |
| Average CTR | 1.7% |
| Average position | 23.1 |

For reference, the same 28 days with **no country filter** (all countries, Web):
460 clicks, 34.5K impressions, 1.3% CTR, position 24.7 — so Australia is ~90%
of clicks and ~87% of impressions.

**Preceding-period comparisons are NOT included.** The UI comparison view was
not read, and inferring the previous 28 days by subtracting 28 from 90 would be
arithmetic on rounded numbers, not measurement. This is a gap, closed by the
API run.

### Top queries — 28 days, AU

| Query | Clicks | Impressions |
|---|---:|---:|
| quotemate | 45 | 66 |
| quote mate | 27 | 32 |
| electrical quote | 1 | 214 |
| best app for quoting jobs | 1 | 101 |
| bathroom quote template | 1 | 8 |
| tradie quote app | 1 | 5 |
| quote for landscaping | 1 | 5 |
| how to quote a bathroom renovation | 1 | 3 |
| how to quote concrete jobs | 1 | 3 |
| electrical quoting app | 1 | 2 |

Table reports **1–10 of 1,000 rows** — 1,000 is Search Console's UI cap, so the
tail below this is not visible here.

### Brand / non-brand

**Brand definition (explicit):** any query containing `quotemate`, `quote mate`,
`quotmate`, `quotemateapp`, or `quote mate app`. Everything else is non-brand.

From the visible rows: brand accounts for **72 clicks** (45 + 27) against 98
impressions — a ~73% CTR, which is what a brand search looks like. Every
non-brand query in the top ten returns exactly **1 click**.

**This is a floor, not the split.** Query tables exclude anonymised queries,
so brand + non-brand will never sum to the 413 property total. The honest
statement is: of 413 AU clicks, at least 72 are brand, and no single non-brand
query is known to deliver more than 1. The exact split needs the API.

### Top pages — 28 days, AU

| Page | Clicks | Impressions | CTR |
|---|---:|---:|---:|
| `/` | 73 | 273 | 26.7% |
| `/articles/how-to-quote-electrical-work/` | 2 | 639 | 0.3% |
| `/quotes-for-concreters/` | 2 | 68 | 2.9% |
| `/templates/bathroom-renovation-quote-template/` | 2 | 26 | 7.7% |
| `/best/app-for-electricians/` | 1 | 1,566 | 0.06% |
| `/best/quoting-app-for-tradies/` | 1 | 757 | 0.13% |
| `/quotes-for-plumbers/` | 1 | 432 | 0.23% |
| `/quotes-for-cleaners/` | 1 | 239 | 0.42% |
| `/quotes-for-renderers/` | 1 | 204 | 0.49% |
| `/quotes-for-electricians/` | 1 | 219 | 0.46% |

### What this says

The site is **seen and not clicked**. 30,100 AU impressions in 28 days at an
average position of **26.8** — that is page three. `/best/app-for-electricians/`
collected 1,566 impressions and one click.

The homepage takes 73 of 413 clicks at a 26.7% CTR because those are people
searching for QuoteMate by name. Strip brand out and the entire commercial
long tail is delivering roughly one click per page.

The binding constraint is **ranking position**, not indexability, not page
speed, and not the absence of downloadable templates. Nothing in this sprint —
redirects, worksheets, sitemap dates, attribution — moves position on its own.
They remove excuses and make the next move measurable; they are not the move.

## Page indexing — Google's index, last update 2026-09-04

| State | Pages |
|---|---:|
| **Indexed** | **362** |
| Not indexed | 586 |

Why the 586 are not indexed:

| Reason | Source | Pages |
|---|---|---:|
| Alternate page with proper canonical tag | Website | 336 |
| **Not found (404)** | **Website** | **180** |
| Crawled – currently not indexed | Google systems | 63 |
| Discovered – currently not indexed | Google systems | 3 |
| Excluded by 'noindex' tag | Website | 2 |
| Blocked by robots.txt | Website | 1 |
| Page with redirect | Website | 1 |
| Duplicate without user-selected canonical | Website | 0 |

Two things worth naming:

- **180 URLs 404 for Google, and exactly 1 URL currently redirects.** The four
  reviewed 301s in `seo/redirects.json` address four of those 180. The other
  ~176 have never been triaged. That is the largest single piece of unclaimed
  housekeeping the index knows about, and it was not in this sprint's scope.
- **63 pages are "Crawled – currently not indexed."** Google fetched them and
  declined to index them. On a site of programmatic trade x city pages that
  usually reads as thin or near-duplicate content, and it is a quality signal
  worth a look before publishing more of the same shape.

The submitted sitemap holds 339 URLs; 362 are indexed, so the index also holds
pages the sitemap does not submit.

## Core Web Vitals — insufficient field data

**Search Console › Core Web Vitals** (source: Chrome UX Report, last updated
2026-09-05):

> **Mobile — "Not enough usage data in the last 90 days for this device type."**
> **Desktop — "Not enough usage data in the last 90 days for this device type."**

Independently confirmed through the PageSpeed Insights API (OAuth, `hansendev`
quota project, run 2026-09-07). Every URL sampled returned
`origin_fallback: true`, meaning the URL itself had too few real-user samples
and PSI substituted the origin's record:

| Scope | LCP p75 | INP p75 | CLS p75 | FCP p75 | Verdict |
|---|---|---|---|---|---|
| Origin, mobile | **insufficient** | **insufficient** | 0.00 | 1,261 ms | FAST (on what exists) |
| Origin, desktop | **insufficient** | **insufficient** | 0.01 | 1,451 ms | FAST (on what exists) |

Sampled: `/`, `/templates/`, `/templates/fence-quote-template/`, `/pricing/`,
`/articles/how-to-quote-concrete-driveway/` — all fell back to origin.

**The finding is that the site has no Core Web Vitals result.** Not a pass, not
a failure. Even at origin level there is no LCP and no INP; only CLS and FCP
have enough samples, and both are comfortable. There is not enough traffic for
CrUX to report the metrics that matter.

Two consequences:

1. **CWV cannot be a lever here.** There is nothing to fix and no way to
   observe a fix. Performance work would be unmeasurable in the field.
2. **Any "Core Web Vitals passed" claim about this site would be false**,
   including one derived from a local Lighthouse run. The previous session's
   localhost sample (LCP ~60 ms, CLS 0, TTFB ~0.5 ms) is a laboratory result on
   a developer machine over loopback. It is not evidence about mobile users on
   Australian networks and is not repeated as such here.

The three scopes are kept apart on purpose throughout: **URL-level field**
(unavailable), **origin-level field** (partial), and **laboratory**
(available, and not a substitute for either).

## Still missing, and why

| Gap | Cause | Closes when |
|---|---|---|
| Precise integers rather than UI rounding | UI read | ADC re-auth → API |
| Preceding-period comparisons for both windows | Not read from the UI | ADC re-auth → API |
| Exact brand / non-brand click split | Query tables exclude anonymised queries; needs full export | ADC re-auth → API |
| Device breakdown | UI tab could not be driven reliably | ADC re-auth → API |
| Full query x page matrix, paginated | UI caps at 1,000 rows | ADC re-auth → API |
| URL Inspection sample | Needs the API | ADC re-auth → API |

`scripts/seo-report.py --gsc --cwv --windows 28,90 --inspect 5` produces all of
the above in one run, and marks any failed call `unavailable` rather than zero.
