# QuoteMate email and payment audit

**Date:** 16 July 2026  
**Scope:** `QuoteMateAppWebsite`, sibling `QuoteMate` app/functions repository, production Brevo, SMTP, Stripe, Square, Firestore aggregates, DNS, dependency audits, and automated tests.  
**Method:** Read-only production checks. No customer PII, credentials, payments, subscriptions, or email content were changed.

## Executive summary

The underlying providers are reachable and configured: SMTP authentication succeeds, Stripe and Square accounts are active, both payment webhooks are enabled, Brevo is sending, and all 365 Functions tests pass. However, the application has multiple launch-blocking security and integrity defects.

### Immediate release blockers

1. **Native subscription entitlements fail open.** Apple/Google validation failures still write `isPro: true`; the client also grants local premium regardless of server validation.
2. **Firestore lets users write their own subscription record.** The broad owner wildcard includes `users/{uid}/profile/subscription`, so any authenticated client can self-grant Pro or alter billing state.
3. **Square OAuth state is forgeable.** It is unsigned base64 containing a UID and timestamp, and the callback is unauthenticated. A forged state can bind an attacker's Square merchant account to another QuoteMate user.
4. **The website contact and newsletter forms are broken in production.** The site is deployed as a static export, so `/api/contact/` and `/api/subscribe/` return 404.
5. **Square payment events can be permanently lost.** The webhook returns HTTP 200 before reconciliation. Transient Firestore/Xero/runtime failures therefore do not receive Square retries.

## Production snapshot

### Email (last 30 days)

Brevo reported:

- Requests: **1,157**
- Delivered: **1,093** (**94.47%** of requests)
- Hard bounces: **5** (**0.43%**)
- Soft bounces: **34** (**2.94%**)
- Blocked: **26** (**2.25%**)
- Unique opens: **319** (**29.19%** of delivered; proxy-affected)
- Unique clicks: **36** (**3.29%** of delivered)
- Spam complaints: **0**
- Unsubscribes: **3**

Firestore `emailLog` contained **6,534** rows in the same period:

- 5,485 blocked locally
- 1,037 marked delivered
- 8 bounced
- 4 send failures
- 6,142 marketing / 392 transactional

The local blocked volume is dominated by repeated attempts to known-unsendable recipients:

- 4,526 Apple private relay blocks
- 949 `example.com` blocks
- 4,217 quote-follow-up-tagged rows overall

Brevo is currently on a **free plan with 286 remaining sending credits** at audit time. That is insufficient headroom for the recent send rate.

### Payments

Stripe production:

- Account is fully submitted; charges and payouts enabled
- Monthly price: AUD 49, active
- Annual price: AUD 328, active
- Webhook enabled for the six events handled in code
- Subscriptions: 22 `incomplete_expired`, 1 canceled, **0 active**

Square production:

- AU merchant active, AUD, one active location
- Credit-card processing and automatic transfers enabled
- Webhook enabled for `payment.created` and `payment.updated`
- Firestore has 12 payment-link orders (10 quote deposits, 2 invoices)
- Firestore has **0 reconciled Square payments**

Subscription records in Firestore:

- 235 subscription profile documents
- 8 currently `isPro: true`
- 4 store-platform Pro records, 2 admin grants
- **2 Pro records explicitly have failed store validation**
- No web Pro records

## Findings

### Critical

#### PAY-01 — Failed Apple/Google validation still grants Pro

**Evidence:** `QuoteMate/functions/src/index.ts` in `validateAppleReceipt` and `validateGoogleReceipt` calculates a fallback expiry and unconditionally writes `isPro: true`, even when `appleValidated`/`googleValidated` is false. Production contains two Pro records with failed validation.

**Impact:** A fabricated transaction/product identifier, a store outage, missing credentials, or malformed receipt can grant paid access without payment.

**Fix:** Reject unless server-side validation succeeds and the validated bundle/package, product ID, transaction ownership, expiry, revocation state, and original transaction are correct. Use App Store Server API / signed transaction verification and Google Play Subscriptions v2. Never calculate an entitlement expiry from an unvalidated client product ID.

#### PAY-02 — Clients can write subscription entitlements directly

**Evidence:** `QuoteMate/firestore.rules` grants owners read/write access to every path under `users/{userId}/{document=**}`, including `users/{uid}/profile/subscription`.

**Impact:** Any authenticated user can set `isPro`, plan, expiry, platform, or validation fields directly. This independently bypasses all payment providers.

**Fix:** Add a more specific deny/write rule for the subscription document and move client-controlled fields elsewhere. Only Admin SDK/webhooks should mutate entitlement fields. Add Firestore emulator tests proving client writes fail.

#### PAY-03 — Square OAuth state is unsigned and callback is unauthenticated

**Evidence:** `getSquareAuthUrl` base64-encodes `{ uid, ts }`; `squareCallback` trusts the decoded UID and does not authenticate the caller or verify an HMAC/one-time nonce.

**Impact:** An attacker can forge a fresh state for a known victim UID and connect the attacker's Square account to the victim's QuoteMate account (login CSRF/account-linking attack).

**Fix:** Generate a cryptographically random, single-use nonce; store its hash server-side against the authenticated UID and expiry; consume it transactionally in the callback. Alternatively use authenticated, HMAC-signed state plus replay protection.

#### WEB-01 — Contact and newsletter endpoints do not exist in production

**Evidence:** `QuoteMateAppWebsite/next.config.ts` uses `output: 'export'`; DigitalOcean deploys `/out` as a static site. Live GET checks to both API paths returned HTTP 404. Static output contains only client chunks for these route handlers, not executable endpoints.

**Impact:** Contact messages and newsletter signups fail. The UI catches the HTML/JSON parse failure and shows an error.

**Fix:** Move handlers to Cloud Functions/a serverless endpoint and call the configured API base URL, or deploy Next.js as a web service rather than static hosting. Add a production smoke test that submits a honeypot payload and expects JSON 200 without sending mail.

### High

#### PAY-04 — Square webhook acknowledges before durable processing

**Evidence:** `squareWebhook` sends HTTP 200 immediately after signature/JSON checks, before any Firestore reconciliation. Errors are only logged and best-effort-stamped.

**Impact:** A transient failure can leave a customer charged while QuoteMate still shows unpaid. Square will not retry after the 200 response.

**Fix:** First write the verified event to a durable inbox keyed by Square event ID, then acknowledge. Process asynchronously with retries and a dead-letter/alert path. At minimum, return 5xx on reconciliation failure and make all writes idempotent.

#### PAY-05 — Payment reconciliation is not transactional

**Evidence:** Invoice and document idempotency is implemented as read/check followed by separate writes. Concurrent `payment.created` and `payment.updated` deliveries can both pass the check before either write lands.

**Impact:** Partial payments can be double-applied, ledgers can diverge, and side effects can duplicate.

**Fix:** Reconcile in a Firestore transaction using a payment-ID receipt document as the create-once guard. Update legacy invoice, unified document, reverse index, and event status atomically where possible.

#### PAY-06 — Square dispute handling exists but production is not subscribed to dispute events

**Evidence:** Code handles `dispute.created`, `dispute.state.updated`, and `dispute.evidence_added`; the live Square subscription only includes payment created/updated.

**Impact:** Chargebacks will not create in-app warnings or email deadlines, despite the implementation suggesting they will.

**Fix:** Add the handled dispute event types in Square, test with sandbox events, and alert on unmatched payment IDs.

#### PAY-07 — Stripe accepts arbitrary price IDs

**Evidence:** `createCheckoutSession` and `createPaymentIntent` accept any non-empty client `priceId` and send it to Stripe.

**Impact:** Users may subscribe to any active recurring price in the account, including unrelated/legacy products, while receiving QuoteMate Pro.

**Fix:** Allowlist the exact live monthly/annual price IDs server-side and verify currency, amount, active status, recurrence, and product before creating a session/subscription.

#### PAY-08 — Stripe creates duplicate customers and incomplete subscriptions

**Evidence:** Checkout always creates a new customer; embedded checkout creates a `default_incomplete` subscription every time the modal initializes. Production has 22 `incomplete_expired` subscriptions and no active web subscriptions.

**Impact:** Polluted customer records, confusing portal lookup, avoidable recovery work, and evidence of substantial checkout abandonment or malfunction.

**Fix:** Persist one Stripe customer ID per Firebase UID; reuse an existing incomplete subscription where safe; expire/cancel abandoned attempts; instrument checkout stages and inspect the 22 attempts.

#### EMAIL-01 — Document state is marked sent before Brevo accepts the email

**Evidence:** `sendDocumentEmail` commits quote/invoice status, stage, timestamps, acceptance token, and telemetry before PDF generation and `sendEmail` complete.

**Impact:** PDF generation or Brevo failures leave documents marked sent even though the customer received nothing. Follow-up automation may then email a customer about a quote they never received.

**Fix:** Prepare artifacts first, send, then commit `sent` state only after provider acceptance. Keep an explicit `sending`/`send_failed` state and an idempotency key.

#### EMAIL-02 — Brevo `request` events are incorrectly marked delivered

**Evidence:** `brevoEmailWebhook` handles both `request` and `delivered` by setting `status = 'delivered'` and `deliveredAt`.

**Impact:** Internal deliverability metrics are inflated and cannot distinguish accepted-by-Brevo from delivered-to-recipient.

**Fix:** Store `request` as `accepted`/`queued`; only a `delivered` event should set delivery fields.

#### SEC-01 — Production dependency vulnerabilities

`npm audit --omit=dev` found:

- Website: 11 vulnerabilities (2 critical, 5 high)
- App: 36 vulnerabilities (3 critical, 10 high)
- Functions: 25 vulnerabilities (3 critical, 8 high)

Direct vulnerable packages include Next.js/Nodemailer/XLSX on the website and XLSX in the app. Critical transitive findings include protobuf/websocket packages in the website/app and FTP/XML/websocket packages in Functions.

**Fix:** Triage reachable paths, upgrade lockfiles and direct dependencies, replace the unsupported vulnerable `xlsx` package, and add CI audit gating with an approved exception file rather than ignoring all transitive findings.

### Medium

#### EMAIL-03 — Marketing preferences fail open

`canSendEmail` returns true when Firestore preference reads fail. A database incident can therefore send marketing mail contrary to a recorded opt-out.

**Fix:** Fail closed for marketing and cache suppression state safely.

#### EMAIL-04 — Unsigned unsubscribe links expose UID and are misleading for transactional mail

Unsubscribe URLs contain only `userId` and category. Anyone with a UID can alter preferences. The endpoint accepts `transactional`, but `canSendEmail` always permits transactional sends, so the success page can claim an unsubscribe that has no effect.

**Fix:** Use an opaque/HMAC-signed, expiring token tied to user/category. Do not offer a transactional unsubscribe, or define narrow optional transactional categories.

#### EMAIL-05 — Known-unsendable recipients are retried excessively

The 30-day log contains 5,485 locally blocked attempts, mostly private-relay/example addresses, with quote follow-ups the largest tag. This creates noise, Firestore cost, and obscures genuine failures.

**Fix:** Persist a suppression flag after the first block and exclude suppressed recipients in every scheduler query before creating an email log.

#### EMAIL-06 — Sender/domain posture needs hardening

- SMTP authentication succeeds.
- SPF is present and includes Google/Brevo.
- DMARC is `p=none` on both primary domains.
- Brevo reports a mixture of authenticated and unauthenticated domains.
- The transactional sender is `noreply@hansendev.com.au`, while customer replies route to the tradie or Tom.

**Fix:** Verify every active sender/domain, confirm DKIM selectors, move DMARC gradually to `quarantine` then `reject`, and isolate cold outreach on its authenticated subdomain. Replace `noreply` with a monitored role address if reply handling is expected.

#### PAY-09 — Stripe URLs are only syntax-validated

Authenticated clients can supply any HTTP(S) success, cancel, or portal return URL, turning Stripe-hosted flows into an open redirect.

**Fix:** Allowlist QuoteMate production/staging origins and generate return URLs server-side.

#### PAY-10 — Customer/subject/template escaping is inconsistent

Customer names, quote numbers, business names, client notes, and some lifecycle values are interpolated into HTML templates without universal escaping. Client-facing body text is escaped correctly, but not all surrounding fields are.

**Fix:** Centralize HTML/text/URL escaping and require escaped template primitives. Add malicious-input snapshot tests.

#### PAY-11 — Square token encryption can silently fall back to plaintext

Production currently has an encryption key configured, but `encryptSquareToken` stores plaintext if the key disappears.

**Fix:** Fail closed in production. Refuse connection/refresh if encryption cannot be performed; use Secret Manager/KMS and rotate legacy plaintext rows.

#### SEC-02 — A Brevo API key is duplicated in local command-history configuration

An ignored `.claude/settings.local.json` contains a literal Brevo key inside an allowed shell command. It is not Git-tracked, and scans found no server-side keys in exported web bundles, but the duplicate plaintext secret can leak through workstation backups, logs, or support bundles.

**Fix:** Rotate the exposed key, remove the literal from local history/configuration, and reference Secret Manager or an environment variable instead.

### Low / correctness

- Web product metadata says currency `USD` while Stripe prices are AUD.
- Subscription cancellation email says the free plan has limited quotes, contradicting current “unlimited quotes and invoices” positioning.
- `logCancellationFeedback` validates but does not persist feedback.
- Stripe API errors are returned verbatim to clients in multiple handlers.
- Stripe customer search uses a single metadata match and no canonical Firestore customer ID.
- Brevo's remaining free-plan credit balance is operationally risky at current volume.

## Positive controls observed

- Stripe webhook signature verification uses the raw request body.
- Square webhook verification uses HMAC and timing-safe comparison.
- Square production tokens are currently configured for AES-256-GCM at rest.
- Firebase ID tokens protect authenticated payment endpoints.
- Square payment money conversion uses integer-cent helpers.
- Square payment IDs are accumulated for redelivery checks.
- Brevo API sends are logged and correlated to webhook events.
- Customer-authored email body text is escaped before rendering its limited markdown subset.
- SPF exists; Brevo reports zero spam complaints in the last 30 days.
- SMTP credential verification succeeded.
- All 30 Functions test files passed: **365/365 tests**.
- Website production build completed successfully (but this does not validate static API availability).
- Exported website/app bundles contained no Stripe secret key, Brevo key, Square access token/secret, or webhook secret patterns.

## Recommended remediation order

### Within 24 hours

1. Deny client writes to subscription entitlements.
2. Make Apple/Google validation fail closed; revoke/review the two invalid Pro records.
3. Sign and replay-protect Square OAuth state.
4. Repair production contact/newsletter routing.
5. Add Square dispute subscriptions.
6. Upgrade Brevo capacity or pause nonessential lifecycle/outreach sends before credits run out.

### Within 72 hours

1. Introduce a durable, idempotent Square webhook inbox and transactional reconciliation.
2. Allowlist Stripe prices and return URLs; canonicalize Stripe customer IDs.
3. Move email `sent` state changes after provider acceptance.
4. Correct Brevo request-vs-delivered semantics.
5. Stop retrying suppressed recipients.
6. Triage critical/high dependency vulnerabilities.

### Within two weeks

1. Replace legacy store receipt verification with current signed server APIs and renewal webhooks/notifications.
2. Add end-to-end tests for entitlement forgery, duplicate webhooks, failed email sends, abandoned checkout, refund/dispute, partial payment, and OAuth replay.
3. Add reconciliation jobs comparing Stripe/Square/store truth to Firestore entitlements and invoice ledgers.
4. Harden DKIM/DMARC and separate transactional versus outreach reputation.
5. Add monitoring for webhook lag/failures, payment-to-ledger mismatches, Brevo credit balance, bounce spikes, and invalid Pro records.

## Verification commands run

- Website production build
- `npm audit --omit=dev` in website, app, and Functions
- Functions test suite (`30` files, `365` tests)
- SMTP `verify()` (no email sent)
- Read-only Brevo account/sender/domain/statistics API calls
- Read-only Stripe account/prices/webhooks/subscriptions API calls
- Read-only Square merchant/location/webhook API calls
- Read-only Firestore aggregate queries (no PII output)
- Live HTTP status checks for website API routes
- SPF/DMARC/MX DNS lookups
