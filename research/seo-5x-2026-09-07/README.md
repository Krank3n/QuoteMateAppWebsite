# Evidence for the 5× SEO plan

Collected **7 September 2026**, read-only. Plan: [`../seo-5x-traffic-plan-2026-09-07.md`](../seo-5x-traffic-plan-2026-09-07.md).

## GA4

- Property: **527922866 / QuoteMateWebsite**; timezone **Australia/Brisbane**.
- Current period: **2026-08-08 through 2026-09-04**, inclusive.
- Previous period: **2026-07-11 through 2026-08-07**, inclusive.
- Source: Google Analytics Data API `v1beta/properties/527922866:runReport`; key-event definitions from Analytics Admin API, read-only.
- Channel filter: `sessionDefaultChannelGroup` exactly `Organic Search`.
- No sampling or thresholding warnings were returned in the saved report metadata. API counts are still subject to GA processing and aggregation semantics.

### Files

- `ga4-baseline.json`: channel comparison, **complete request and response for the filtered 535-session baseline**, non-homepage baseline, Australian baseline and source/medium breakdown.
- `ga4-organic-landing-pages.csv`: union of landing paths across the two windows, with sessions, engaged sessions and key-event occurrences. Includes unknown/product rows for transparency; exclude them for marketing-page totals. Missing rows are zero-filled. URLs are GA's reported paths; do not interpret their lack of trailing slash as canonical configuration.
- `ga4-organic-events.json`: current organic-channel event counts/users and configured key-event names. User counts are per event and are not additive across events.

### Reproduce the marketing baseline

Combine the Organic Search filter above with a NOT `FULL_REGEXP` filter on `landingPage`:

```text
(\(not set\)|/(app|admin|portal|q|join)(/.*)?|/(google-calendar|reece|square|xero)/callback(/.*)?)
```

Request `sessions`, `engagedSessions`, `keyEvents`, with no dimensions except the API-generated date-range dimension. The exact request is preserved in `ga4-baseline.json`.

The primary figure is **535**, returned by the filtered report. The current landing-page session rows sum to **628**, while the whole-channel aggregate is **627**. The excluded rows total 93. Do not subtract 93 from 627 and substitute 534 for the direct filtered result; dimension/report aggregation is not perfectly additive here. Engaged-session aggregates can also differ slightly by dimension.

The **92 key events are click occurrences**, not sign-ups or monetised users. Current `sign_up` records 15 events/15 users and is not in the configured key-event list. Native installs and durable account/payment outcomes were not independently audited in this task. The comparison period includes two days before the CTA key events were configured on 13 July, another reason not to treat the key-event change as a clean conversion-rate comparison.

## Search Console

Live API retrieval was attempted but unavailable: the configured service-account project does not have Search Console API enabled, and the existing user credential lacks Search Console scope. No APIs, permissions or account settings were changed; no credentials are saved here.

Historical source: [`../gsc-articles-3mo-2026-08-25.csv`](../gsc-articles-3mo-2026-08-25.csv).

- 89 rows; 113 clicks; 11,118 impressions, by summing the file.
- The filename labels the period three months; exact dates, country, device and query definitions are not present.
- Three slugs repeat, so row count is **not** unique URL count. Do not combine repeated positions using a simple average or assume repeated slugs prove current cannibalisation.
- Use as historical article prioritisation evidence only, never a current sitewide/non-brand baseline.

## Live checks and code audit

`live-url-checks.json` records HTTP status, redirects, canonical, title, robots, heading count and visible download links for sampled URLs. These are HTML checks, not a rendered performance audit, full-site crawl or Google URL Inspection.

Additional live checks on 7 September:
- `https://quotemateapp.au/sitemap.xml`: HTTP 200, valid XML, **339 `<url>` entries**.
- Sitemap counts: 24 national trade pages; 120 trade/city pages; 75 article URLs including the index (74 details); 55 template URLs including the index (54 details).
- `/articles/how-to-quote-electrical-work/` and `/articles/how-to-quote-concrete-driveway/`: HTTP 200 with self-canonicals.
- `/articles/how-to-quote-a-concrete-driveway/`: HTTP 404, no redirect, robots noindex.
- `/quotes-for-electricians/sydney/`: HTTP 200 with self-canonical.
- A deliberately nonexistent URL returned HTTP 404 with robots noindex; no general soft-404 problem was established.

The plan also reviews the repository's page components, content data, analytics/attribution components, sitemap and generation workflow. Code observations are identified separately from live findings. Live output takes precedence where canonical formatting differs from source literals.

**Not measured:** current GSC queries/indexing/canonicals, field Core Web Vitals, a live backlink inventory, actual competitor pricing/features, native-install attribution, or verified organic revenue. These are explicit follow-up tasks, not assumed findings.
