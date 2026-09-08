# SEO foundation sprint — 7 September 2026

**Status as of 2026-09-07 16:50 AEST: deployed and verified live, except the four 301s.**

This is the first tranche of phase 1 in `seo-5x-traffic-plan-2026-09-07.md`.

| | |
|---|---|
| **Implemented** | All five workstreams below, plus the organic acquisition → account handoff |
| **Tested** | Website 148, app 4,354, functions 1,340, Firestore rules 35 — all green |
| **Deployed** | Website (PR #7, #8), app web bundle, Firestore rules, `aggregateEventFunnel` |
| **Verified live** | 29 of 38 acceptance checks; the 9 failures are all the un-applied redirects |
| **Blocked** | 301 ingress rules (DigitalOcean token revoked — owner-only); Search Console API (needs the service account added to the property) |

Read `research/seo-evidence-2026-09-07/README.md` for the fresh Search Console
and Core Web Vitals findings. The short version: the site is **seen and not
clicked** — 30,100 AU impressions in 28 days at average position 26.8 — and it
has **no Core Web Vitals result at all**, because CrUX has too little traffic
to report one. Nothing in this sprint changes ranking position. These changes
remove excuses and make the next move measurable; they are not the move.

Cloud configuration changed in this sprint, all free and read-only:
`searchconsole.googleapis.com` and `pagespeedonline.googleapis.com` were
enabled on project `hansendev` (the first was the recorded blocker; the second
replaces the exhausted anonymous PageSpeed quota with the project's own). No
billing change, no new credential, no broadened account access.

Measurement configuration changed 2026-09-08: `sign_up` marked a GA key event,
the five CTA click events that had been standing in for conversions un-marked,
and both changes annotated. A GA "conversion" now means an account was created;
before that date it meant somebody pressed a button, so the series is not
comparable across 8 September. Details below.

## Implemented

### 1. Four equivalent-page 301s, prepared at the hosting layer

- Reviewed the concrete driveway, retaining wall, epoxy floor and fencing article pairs. Each pair serves the same job/intention; all four surviving destinations were checked live and return HTTP 200.
- `seo/redirects.json` is the reviewed map. `.do/app.yaml` has corresponding **301 ingress rules before the catch-all static component**, covering slashless/slash variants and descendants.
- Confirmed the official DigitalOcean App Platform schema supports `match.path.prefix`, `redirect.uri` and `redirect.redirect_code`. Do not invent an unsupported exact-path match or use Next server redirects in this static export.
- Tests verify sources are unlisted, destinations are active and in the sitemap, no chain exists, and no active URL collides with a redirect prefix.
- The remaining unlisted guides are unchanged. No unrelated city pages or unmatched URLs are redirected to the homepage.
- Original article data remains intact for later editorial review. No unverified old prices or compliance claims were copied into surviving articles as part of redirect preparation.

**STILL BLOCKED (the only un-shipped item).** `doctl` returns **401 Unable to authenticate** on every endpoint including `/v2/account`, so the stored Personal Access Token is revoked or expired, not merely under-scoped. Verified live 2026-09-07: all four source URLs and their slash variants return **404**, not 301. Git-based source deploys do not touch the App Platform ingress spec, so merging the repo file changed nothing — as designed.

**Owner action, either route.** Both need the same thing first: a Read+Write
token from <https://cloud.digitalocean.com/account/api/tokens>. Nothing routes
around that — the existing token is revoked, and an agent minting or typing a
token is credential handling.

*Route 1 — doctl (fewest moving parts).* `doctl auth init`, and paste the token
into doctl's own prompt. It never touches a chat transcript or a file.

*Route 2 — the MCP server (configured 2026-09-08).* `@digitalocean/mcp@1.0.68`
is registered for this project, scoped to `--services apps` so it can reach App
Platform and nothing else:

```jsonc
// ~/.claude.json → projects → QuoteMateAppWebsite → mcpServers.digitalocean
{ "type": "stdio", "command": "npx",
  "args": ["-y", "@digitalocean/mcp@1.0.68", "--services", "apps"],
  "env": {} }
```

The `env` block is deliberately empty: the server inherits the token from Claude
Code's own environment, so **no token is ever written into a config file**. Put
`export DIGITALOCEAN_API_TOKEN="…"` in `~/.zshrc` and restart Claude Code — not
on a command line inside a session, where it would land in the transcript. Until
that is set the server exits immediately with *"DigitalOcean API token not
provided"*, which is what `claude mcp get digitalocean` currently reports as
`CONNECTION_CLOSED`. The version is pinned on purpose: this process holds a
write-capable token, so upgrades should be a decision rather than a surprise.

Either way, `scripts/release/apply-do-redirects.sh` does the rest, and is
written to be safe:

1. finds the app whose spec actually serves `quotemateapp.au`;
2. saves the **live** spec to a private backup and prints the one-line rollback;
3. merges **only** the four reviewed rules, ahead of the existing `/` catch-all, leaving every other component, route and env setting untouched — it never uploads this repository's spec wholesale;
4. is idempotent: re-running replaces its own rules rather than stacking duplicates;
5. prints a diff and **stops**. It applies only with `APPLY=1`.

**Rollback:** `doctl apps update <APP_ID> --spec $SPEC_DIR/live-spec-ROLLBACK.yaml`
(the script prints the exact command with the app id filled in; `SPEC_DIR`
defaults to a temp directory outside the repo so a live spec is never committed).

`scripts/release/verify-seo-live.sh` re-runs all 38 acceptance checks against
production afterwards, redirects and query strings included.

**Query strings:** verified against production while still 404 — DigitalOcean's `redirect.uri` replaces the whole URI, so `?utm_source=…&gclid=…` on a retired URL will be **dropped**, not carried to the destination. Re-check this after applying; it matters for any old link still circulating with campaign tags.

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

**This boundary is now closed** — see section 6.

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

### 6. Organic acquisition now reaches the account, and the money

The site had been recording first touch for a while; the record died at the
`/app` door, because the app's parser understood only the paid keys. Every
account that arrived through search was written to Firestore as nothing — and
then counted in the admin dashboard as the "organic baseline". That baseline
was really *every account we had no evidence about*: native installs,
cross-device journeys, cleared storage, and everyone who signed up before any
of this existed. Organic search was being credited with all of it.

Shipped in QuoteMate PR #170 and website PR #8:

- The app reads `qm_acquisition` (session storage, with the same-origin cookie
  behind it for `noopener`/new-tab clicks) and persists it under `acquisition`
  on the existing `users/{uid}/profile/attribution` doc.
- **The paid contract is untouched**: same storage key, same top-level
  `utm_*`/`fbclid`/`gclid` fields, same rollup key, same native no-op. The
  per-ad table reads exactly as before.
- **Two gates decide whether an account gets an origin at all**, because
  `persistAttributionIfNew` runs on every auth state change — sign-in, token
  refresh, reload — not only at signup:
  1. the Firebase account must have been created within the hour
     (`user.metadata.creationTime`), so a returning user is never
     retro-attributed to today's browsing;
  2. the landing must predate that account and be under a week old, so a tab
     left open for a fortnight cannot become somebody's origin story.
- **Unknown stays unknown.** A failed gate, a corrupt payload, a missing record
  or an internal referrer records nothing and reports as `unknown`. Nothing is
  backfilled and no synthetic organic UTMs are invented.
- **The record is untrusted input** — browser storage any visitor can hand-edit,
  landing in Firestore and in admin tables. It is validated field by field,
  length-capped, and rebuilt key by key rather than spread, and private paths
  (`/app`, `/admin`, `/portal`, `/q/…`) are refused outright.
- **Opt-outs are honoured** on the app side too: `qm_notrack=1` and a declined
  cookie banner both suppress it.
- **Write-once is enforced in the Firestore rules, not just the client.** The
  client's check-then-write is a race and the wrong place for provenance: while
  the owner wildcard covered this doc, any signed-in user could rewrite their
  own origin and both scoreboards would faithfully follow. `profile/attribution`
  is now create-only; the Admin SDK still bypasses for server-side correction.

**The join to money reuses the existing durable funnel — it does not invent a
second one.** `rollupAttribution` gained a channel view over the same inputs
`rollupEventFunnel` already computes: signup → first quote → sent → monetised,
where monetised stays `isBilledSub(sub) || hasSquarePayment`, deduplicated
(`viaPro + viaSquare − viaBoth`). Durable subscription and payment state remain
the outcome truth; no website CTA click and no lossy client event enters it.

`organicSignups` is renamed `unattributedSignups`, with the old name kept as a
deprecated mirror for one release so the dashboard renders whichever side
deploys first.

## What is actually deployed

| Component | Where | State |
|---|---|---|
| Website: worksheets, sitemap dates, tracking, admin tables | PR #7 → `f499c04` → DigitalOcean auto-deploy | **Live**, verified 2026-09-07 16:32 AEST |
| App web bundle at `/app` | PR #8 → DigitalOcean auto-deploy | **Live**, verified 16:43 AEST |
| App + functions source | QuoteMate PR #170 → `a39d556` | Merged |
| Firestore rules (attribution create-only) | `firebase deploy --only firestore:rules` | **Live** |
| `aggregateEventFunnel` | `firebase deploy --only functions:aggregateEventFunnel` | **Live**, ran clean at 06:40 UTC (16.7 s, 469 users) |
| Four 301 ingress rules | — | **NOT applied.** Blocked on DigitalOcean auth |

The web bundle was rebuilt through the four gates that have caused outages
here before: Stripe resolved to `pk_live` only, the secret scan was empty,
`index.html` carried `/app/`-prefixed hrefs, and the new code was confirmed
present in the bundle. The seven website-owned paths under `public/app` were
excluded from the sync and verified intact.

## Validation completed

### Automated

| Suite | Tests | Result |
|---|---:|---|
| Website (Vitest) | 148 | pass |
| App (Vitest) | 4,354 across 332 files | pass |
| Cloud Functions (Vitest) | 1,340 across 87 files | pass |
| Firestore security rules (emulator) | 35 | pass |

`tsc --noEmit` clean in website, app and functions. Website production build
green with all 108 generated assets present.

New regression coverage, all written for behaviour that would silently corrupt
reporting if it broke:

- **Attribution persistence and write-once** — first touch written once;
  never overwritten by a later sign-in, token refresh or second campaign.
- **Returning users** — an old account signing in today is not attributed;
  missing creation metadata is treated as returning, never as new.
- **Retry safety** — a failed read or write leaves the record in place for the
  next auth event, and the retry then succeeds.
- **Paid attribution** — the legacy contract behaves exactly as before,
  including for returning users, and both kinds of context coexist.
- **Untrusted input** — corrupt JSON, wrong types, oversized payloads,
  private URLs, absolute URLs, query strings and fragments all refused.
- **Signup measurement** — exactly one `sign_up` for a new account (Google and
  email), `login` for returning users, nothing on failure, and absent provider
  metadata treated as returning rather than new.
- **Website never fakes an outcome** — no CTA or download click emits
  `sign_up`, `login`, `purchase`, `subscribe` or `begin_checkout`.
- **Rules** — first touch writable once then frozen against overwrite, update
  and delete; another user can neither read nor write it.

### Live, against production

38 acceptance checks; **29 passed, 9 failed — all nine being the un-applied
redirects.**

| Check | Result |
|---|---|
| 54 template pages × PDF + XLSX = 108 downloads | **all 200, all real files**, none under 3 KB |
| Redirect destinations return 200 and are self-canonical | 4/4 pass |
| Retired URLs absent from the sitemap; destinations present | 8/8 pass |
| Sitemap `lastmod` matches each article's own content date | **74/74 exact, 0 mismatches**; only the `/articles/` index correctly omits one; 339 URLs total |
| Nonexistent URLs still return a genuine 404 | 4/4 pass |
| Unrelated pages and `/app` routes still work | pass |
| **Four retired URLs redirect 301 in one hop** | **FAIL — still 404. Ingress rules not applied.** |

Browser smoke test on production, without creating an account or a charge:

- The owner opt-out (`qm_notrack=1`) was found set and **correctly suppressed
  everything** — no capture, no GA events. It was temporarily lifted with the
  supported `?notrack=0`, the checks run, then restored with `?notrack=1` and
  re-verified. A handful of GA events from that one session should be
  annotated out.
- Landing on a template page wrote `qm_acquisition` to **both** session storage
  and the cookie, with the right shape, `source: (direct)`, `medium: (none)`,
  and **no `?notrack=0` query leaked into the stored landing page**.
- **No manual `page_view` and exactly one GA `config`** on the site, and the
  same after navigating to `/app` — no double counting across the
  website→app boundary.
- App CTAs were plain `/app` and `/app?signup=1` — **no invented organic UTMs**.
- Navigating to `/app` while signed in as an existing account: the record was
  **read and then cleared, and nothing was written**. That is the
  returning-user gate working in production. Confirmed against Firestore: 7
  attribution docs exist, **0 carry an acquisition map, 0 written in the last
  30 minutes**.

**Not verified live:** the positive write path — a genuinely new account
persisting its acquisition map — because that needs a real account created on
production. It has 28 unit tests behind it, and the read path is proven live by
the clear described above (the record can only be cleared if it was read and
judged). The first real organic signup will confirm it end to end.

## The acquisition → monetisation report now available

Admin → Analytics, from `adminStats/eventFunnel` (refreshed every 6 hours):

- **Acquisition by channel** — organic search / referral / direct / paid /
  unknown, each carried through signup → first quote → sent → monetised.
- **Organic landing pages that convert** — the first-touch page for accounts
  that arrived from a search engine. This is the SEO scoreboard the site has
  never had.
- **Acquisition by ad** — unchanged, still keyed on `utm_content`.

First run after deploy (2026-09-07, 469 accounts):

| Channel | Signups | 1st quote | Sent | Monetised |
|---|---:|---:|---:|---:|
| Organic search | 0 | 0 | 0 | 0 |
| Referral | 0 | 0 | 0 | 0 |
| Direct | 0 | 0 | 0 | 0 |
| Paid | 7 | 6 | 1 | 0 |
| **Unknown** | **462** | 243 | 66 | **10** |

**Read this correctly.** The organic row is zero because the handoff is
forward-only and no account has been created since it shipped — not because
organic delivers nothing. All 462 pre-existing accounts, and all 10 monetised
ones, are `unknown`: their origin is genuinely unrecorded and is not being
invented. The organic row will fill from the next organic signup onward.

**This is a measurement change, not growth.** Annotate the release. Nothing
here moved a ranking or won a customer.

## GA measurement changes made 2026-09-08

Both applied to property 527922866 (QuoteMateWebsite) through the GA UI.

**`sign_up` is now a key event.** Verified `aria-pressed: false → true` and confirmed
it survived a full page reload. `login` deliberately stays a normal event.
**Not retroactive** — it counts from 8 September 2026 onward only.

**The release is annotated** (`reportingDataAnnotations/15736494953`, dated
2026-09-07, purple): *"Worksheets, honest sitemap dates, organic first touch now
persisted to new accounts. sign_up became a key event 8 Sep 2026 - not
retroactive."*

### Found while doing it: GA has been counting clicks as conversions

`sign_up` was **not** a key event. Five CTA click events **were**:

| Key event | What it actually is |
|---|---|
| `app_store_click` | a click on a store badge |
| `cta_click` | a click on a call-to-action |
| `google_play_click` | a click on a store badge |
| `web_app_click` | a click through to `/app` |
| `pricing_cta_click` | a click on a pricing button |
| `purchase`, `qualify_lead`, `close_convert_lead` | no stream data |

So every "conversion" figure in GA4 to date is a **button click**, and completed
account creation counted for nothing. That is the exact inversion this sprint's
website work was written to avoid, sitting in the property configuration.

**All five were un-marked on 2026-09-08**, on the owner's instruction. GA warns
on each one that *"no data for this event will be associated with conversions in
any linked account such as Google Ads"* — which does not bite here:
`list_google_ads_links` returns empty, and Meta optimises on the Pixel/CAPI
rather than GA key events. The only real cost was continuity in the historical
conversion series, and that is annotated.

Key events after the change, confirmed by a full page reload:

| Key event | Stream data | Note |
|---|---|---|
| `sign_up` | **Quote Mate** | the only key event that actually fires |
| `purchase` | none | left alone |
| `qualify_lead` | none | left alone |
| `close_convert_lead` | none | left alone |

**A GA "conversion" now means an account was created.** Before 8 September 2026
it meant somebody pressed a button, so the two halves of that series are not
comparable — do not read the step change as a collapse in performance.

Annotated as `reportingDataAnnotations/15739371562`, dated 2026-09-08:
*"Unmarked app_store_click, cta_click, google_play_click, web_app_click,
pricing_cta_click as key events. sign_up is now the only one with data."*

CTA and download clicks keep firing as ordinary events and remain available in
reports — they simply stopped counting as business outcomes.

### Custom dimensions: deliberately none registered

`first_landing_page`, `acquisition_source` and `acquisition_medium` were **not**
registered. The acquisition → monetisation reporting reads durable Firestore
state through the admin dashboard, not GA, so nothing would consume them; GA's
native session-source dimensions remain primary acquisition truth. Registering
them would spend limited custom-dimension slots on dimensions with no reader.
The property still has exactly one: `customEvent:variant` (Hero variant).

## Still required to finish phase 1

| Task | Owner action |
|---|---|
| **Apply the four 301s** | Needs a fresh DigitalOcean token — the stored one is revoked (401 on `/v2/account`, not a scope problem). Both routes are now set up and waiting on it: `doctl auth init`, or `export DIGITALOCEAN_API_TOKEN` + restart for the MCP server registered on 2026-09-08. Then `APPLY=1 scripts/release/apply-do-redirects.sh` and `scripts/release/verify-seo-live.sh` |
| **Watch the GA conversion series across 8 Sep** | Done, not outstanding — but the step change is a definition change, not a performance change. Both sides are annotated in GA |
| **Full Search Console export** | **The `gcloud auth application-default login` route is a dead end** — Google returns *"This app is blocked: this app tried to access sensitive info in your Google Account"* for gcloud's generic auth client when `webmasters.readonly` is requested. Running that command yourself hits the same wall. The working route is the service account: add `ga-reader@hansendev.iam.gserviceaccount.com` as a **Restricted** user under Search Console → Settings → Users and permissions. Its key already exists locally, so `scripts/seo-report.py --credentials ~/.config/gcloud/ga-reader-hansendev.json --gsc --cwv --windows 28,90 --inspect 5` then works |
| **The 180 URLs Google finds missing** | Newly surfaced. Four now have redirects prepared; ~176 have never been triaged, and exactly 1 URL on the site currently redirects. Largest unclaimed housekeeping the index knows about |
| **63 "Crawled – currently not indexed"** | Google fetched these and declined them. On programmatic trade×city pages that usually reads as thin or near-duplicate. Worth a look before publishing more of the same shape |
| **Ranking position** | The actual constraint: position 26.8 over 30,100 AU impressions. `/best/app-for-electricians/` has 1,566 impressions and 1 click. Nothing in this sprint addresses it |
| **`xlsx` advisories** | Two high-severity SheetJS CVEs with no npm fix (the package is unmaintained upstream). This sprint uses it only at build time, writing our own catalogue. The parsing surface those CVEs describe is `app/portal/UploadClient.tsx`, pre-existing and unchanged. Track separately |
| **Native-install attribution** | Still incomplete. A store click is not an install or a signup. Do not attribute native revenue from website click counts |
| **Field Core Web Vitals** | Not a task — a finding. There is not enough traffic for CrUX to report LCP or INP at all. Revisit when traffic supports it; do not substitute lab numbers |
