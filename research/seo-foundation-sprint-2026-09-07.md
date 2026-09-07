# SEO foundation sprint — 7 September 2026

**Status: implemented and locally validated; NOT deployed.** This is the first tranche of phase 1 in `seo-5x-traffic-plan-2026-09-07.md`. Account/hosting blockers and the remaining product-side attribution work are explicitly listed below. No cloud configuration, GA setting or account permission has been changed.

## Implemented

### 1. Four equivalent-page 301s, prepared at the hosting layer

- Reviewed the concrete driveway, retaining wall, epoxy floor and fencing article pairs. Each pair serves the same job/intention; all four surviving destinations were checked live and return HTTP 200.
- `seo/redirects.json` is the reviewed map. `.do/app.yaml` has corresponding **301 ingress rules before the catch-all static component**, covering slashless/slash variants and descendants.
- Confirmed the official DigitalOcean App Platform schema supports `match.path.prefix`, `redirect.uri` and `redirect.redirect_code`. Do not invent an unsupported exact-path match or use Next server redirects in this static export.
- Tests verify sources are unlisted, destinations are active and in the sitemap, no chain exists, and no active URL collides with a redirect prefix.
- The remaining unlisted guides are unchanged. No unrelated city pages or unmatched URLs are redirected to the homepage.
- Original article data remains intact for later editorial review. No unverified old prices or compliance claims were copied into surviving articles as part of redirect preparation.

**Blocked:** `doctl apps list` returned **401 Unable to authenticate**. These redirects are not live. Git-based source deploys do not automatically apply changes to the App Platform ingress spec.

**Release procedure:** restore DigitalOcean access; retrieve and privately back up the actual live app spec; merge only these reviewed redirect rules ahead of its catch-all; review the resulting diff and apply through App Platform. **Do not replace the live app spec wholesale with this repository's older static-site spec**—it may omit live routing, environment or component settings.

After applying, check both source variants:

```text
/articles/how-to-quote-a-concrete-driveway[/]
/articles/how-to-quote-retaining-wall-installation[/]
/articles/how-to-quote-an-epoxy-floor-coating[/]
/articles/how-to-price-a-fence-installation[/]
```

Acceptance: 301 → one hop to the manifest destination → 200, destination self-canonical, no old source in sitemap. Also check a real non-retired article and an unrelated nonexistent path. Test query-string behaviour explicitly: DigitalOcean's redirect URI replaces the original URI, so do not assume query preservation.

### 2. The PDF/Excel promise is now real

- **54 template pages, 108 downloadable files.** Blank PDF and editable XLSX worksheets are generated from the existing template catalogue, including the nine extra templates.
- Downloads are ungated, visible before app CTAs and labelled as blank worksheets. Quantities, rates and amounts are empty; there are no generated prices, formulas or default GST assumptions. Suggested materials are explicitly not a complete specification.
- Each file includes business/customer/scope fields, suggested line items, labour/allowances, totals/GST fields, exclusions and payment terms. The workbook includes usage instructions.
- This is **not** a free public quote generator or a substitute for the app's pricing/sending/payment workflow.
- Removed the template index's unsupported “pricing included” promise. Video cues only render when the template has a video.
- Assets are reproducible via `npm run generate-template-assets`, and run automatically before dev/build. Generated files are gitignored, but were verified present in the static export.
- `template_download` is a click micro-event, never a signup/key-event proxy. It records only template slug and file format, not customer-entered data.

### 3. Website tracking and first-touch handling

- GA events queue before the external script loads, preventing loss of early impressions/clicks.
- Replaced one-time DOM scans with delegated click tracking. Late-rendered app CTAs work; overlapping selectors do not double-count them.
- Listeners, observers and timers clean up on route changes. Strict Mode does not double-count the homepage experiment impression; a genuine homepage return gets its own impression.
- Destination-based app/store classification; private/product/admin routes excluded. Owner opt-out and an existing declined-consent preference are respected by the new tracking entry points.
- Custom outbound-link events drop query strings/fragments; contact events do not contain email addresses. This is not a complete audit of every third-party tag or a new consent-management platform.
- Kept GA enhanced measurement in charge of page views; did **not** add a competing manual SPA `page_view` sender. Verify the actual GA history/page-view settings in DebugView before changing them.
- Existing paid first-touch parameters continue to use the app's `qm_attribution` storage/URL contract. They now survive internal navigation, corrupt storage recovery and late-rendered new-tab links without breaking `?signup=1` or fragments.
- **Organic first-touch context** is captured separately in `qm_acquisition`: source, medium, original public landing path, referrer hostname and capture time. Query strings, fragments, search terms and private routes are excluded. A same-origin cookie (original 30-minute expiry, not renewed by page navigation) supports noopener/new-tab journeys; same-tab session storage retains context. Explicit campaign signals take precedence; internal unknowns are not falsely called organic.
- Existing paid handoff UTMs are retained; organic browsing gets **no invented internal UTMs**. The organic context also accompanies website custom events as `first_landing_page`, `acquisition_source`, `acquisition_medium`.

**Important boundary:** this does not yet persist those new organic fields to user records. The sibling app's current attribution parser accepts only the legacy campaign keys and would drop these fields. We deliberately did not change or rebuild that separate repository's authentication, Firestore or billing code in this sprint.

### 4. Honest sitemap dates

- Removed build-time `lastModified` from all pages.
- Articles use their explicit `dateModified`, falling back to `datePublished` when available.
- Pages without an explicit content date omit `lastmod`. The sitemap stays stable between builds and contains the same 339 URLs.

### 5. Reproducible read-only scorecard

`scripts/seo-report.py` outputs a Markdown scorecard plus raw request/response definitions. It separates:

1. Whole-channel organic sessions.
2. Organic sessions landing on known marketing pages (the 535-session baseline).
3. Tracked organic signup users, still requiring reconciliation with auth records.
4. CTA clicks and download clicks as micro-events.

Optional GSC exports cover AU Web Search totals/pages/queries/query-page pairs for the same two 28-day windows. Failed API calls are recorded as **unavailable**, not zero traffic. Full query-table exports require pagination if the 25,000-row cap is reached; totals should not be replaced with query-row sums.

Example (Google credentials must have permission to the property):

```bash
# Install google-auth and requests in an isolated Python environment if needed.
# Use an existing authorised Google credential; do not commit it.
python3 scripts/seo-report.py \
  --credentials "$GOOGLE_APPLICATION_CREDENTIALS" \
  --end-date 2026-09-04 \
  --gsc \
  --output /tmp/quotemate-seo-scorecard
```

Without `--credentials`, the script uses Google Application Default Credentials. It requests only read-only API scopes and never enables services or changes key events. The default end date excludes the newest three processing days.

Live re-run reproduced **466 → 535 marketing sessions** and showed **25 → 15 tracked organic signup users** across the comparison windows. Those signup counts warrant monitoring and reconciliation; this small before/after sample does not prove a conversion regression or its cause. They are not paid-customer counts.

## Validation completed

- Production Next.js static build passed; TypeScript check passed.
- **146 Vitest tests pass across 10 files**, covering redirects/sitemap dates, every PDF/XLSX template, attribution parsing/handoff, delegated tracking, route cleanup, opt-outs and actual React component lifecycles.
- Dependency check: the new YAML test dependency was upgraded to the patched release. `npm audit` still reports 14 alerts in pre-existing dependency nodes (including two critical); no blanket dependency upgrades were attempted. Track those separately as a security-maintenance task.
- Export check: all **54 template pages reference two existing files**, all 108 assets are present (~1.85 MB total); sitemap XML parses and has 339 URLs.
- Real browser: inspected desktop/mobile template layout; no horizontal overflow in the sampled mobile page; both PDF and XLSX downloaded successfully from the production export; no browser errors reported during those checks.
- Local unthrottled lab sample of the template page: LCP ~60ms, CLS 0, TTFB ~0.5ms. **This is localhost lab data, not mobile-network performance or field Core Web Vitals**, and is not evidence of a ranking improvement.
- The public PageSpeed API returned **429 quota exceeded**. No verified field CWV result was obtained.

## Still required to finish phase 1

| Task | Status / next action |
|---|---|
| Publish the website code/assets | Not deployed; review and deploy through the normal release workflow |
| Apply and verify 301 ingress rules | Blocked by DigitalOcean authentication; merge into actual live spec, then test both slash variants |
| Fresh Search Console queries/indexing | Configured project has Search Console API disabled; existing user credential lacks the scope. Owner can provide exports or enable/read-authorise the API and grant property access. No permission changes were made here |
| GA `sign_up` as a key event | Current service-account workflow is read-only. Owner should validate DebugView/auth reconciliation, then mark `sign_up` as a key event; keep CTA/download reporting separate. Not retroactive |
| GA event dimensions | Register `first_landing_page`, `acquisition_source`, `acquisition_medium` if needed for custom reports; GA's native session-source dimensions remain primary acquisition truth |
| Organic acquisition → account → first sent quote → monetised | Extend the app's attribution types/parser/service to consume the validated same-origin first-touch record, persist write-once acquisition state, and join the existing durable funnel. Preserve original attribution and dedupe Pro/Square outcomes. Do not label all unattributed accounts “organic” |
| Native-install attribution | Still incomplete; a Play/App Store click is not an install or signup. Do not attribute native revenue from website click counts |
| Field Core Web Vitals | Obtain GSC CWV/CrUX data or an authorised PageSpeed report. Do not extrapolate from the local lab sample |

## Release acceptance checklist

1. All generated downloads return 200 with real PDF/XLSX contents after deployment; no customer-data fields are sent to analytics.
2. Original GA page-view behaviour remains single-counted in a real navigation trace.
3. Organic search → article → template → app: native GA attribution is retained, no synthetic internal organic UTMs are added; the new website first-touch context remains stable.
4. Paid landing → another page → normal/new-tab app click: original campaign plus signup intent survive.
5. New account → exactly one app `sign_up`; returning OAuth user → `login`, not signup. Website CTA never emits signup. The existing app source already distinguishes these using Firebase `getAdditionalUserInfo(result).isNewUser`; confirm runtime behaviour separately.
6. Admin/private routes and opted-out browsing do not initialise new marketing tracking.
7. 301 rules pass live status, chain and canonical checks after the separate hosting change.
8. Annotate the release in reporting. Do not claim traffic growth from measurement changes alone.
