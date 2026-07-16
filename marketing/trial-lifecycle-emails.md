# Trial lifecycle email sequence (v1 draft — 2026-07-16)

Target: lift trial→paid (currently ~1.5%). Five emails across the 14-day Pro trial,
which starts when the user creates their first quote.

**Source-of-truth facts used** (per knowledge-base/, do not drift):
- Free plan: unlimited quotes & invoices, branded PDFs, GST, online card payment (platform fee added to customer's bill).
- Pro ($49/mo or $328/yr, save 44%): AI material generation, all premium templates, lower Square rate, bank/PayID/BPAY/PayPal payment options.
- Trial: 14 days, starts on first quote, no card required.

**Send rules**
- Trigger: `trialStartedAt` on the user doc; send at day 0, 3, 8, 12, 15 (Brisbane mornings, ~7:30am — tradies read email before first site).
- Suppress the whole sequence the moment `subscriptionStatus` goes active; suppress email 5 if converted or if the user was comped.
- Reply-To: tom@hansendev.com.au — replies are half the point.
- Apple private-relay addresses: send via the verified Brevo sender or they bounce (see feedback-reply flow notes).
- Upgrade links carry `utm_source=lifecycle&utm_medium=email&utm_campaign=trial&utm_content=day{N}`.
- Personalisation: `{firstName}` falls back to "mate"; `{trade}` optional.

---

## Email 1 — Day 0 (trigger: first quote created)

**Subject:** Your 14-day Pro trial just started
**Preview:** One thing to do today: send that quote.

G'day {firstName},

You just created your first quote in QuoteMate, which means your 14-day Pro
trial is on — every feature unlocked, no card needed.

One thing to do today: **send that quote.** Email, SMS or WhatsApp, straight
from the app. Quotes sent within the hour win jobs that quotes sent at 9pm
lose.

Two things worth knowing straight away:

- Describe any job and the AI builds the materials list with live Australian
  supplier prices. Check it, adjust it, send it.
- When the job's done, the quote becomes the invoice in one tap. No re-typing.

Stuck on anything? Reply to this email — it's me reading it, not a support
queue.

Tom
QuoteMate

---

## Email 2 — Day 3

**Subject:** Get paid before you leave the driveway
**Preview:** Tap to pay, deposits, part payments — all in the app.

Hi {firstName},

The quickest cash-flow fix in the trades: stop leaving site without money.

QuoteMate takes payment three ways:

- **Tap to pay** — the customer taps their card on your phone. No card reader,
  no "I'll do a transfer tonight".
- **Deposits** — take money up front from the accepted quote, before you order
  materials.
- **Payment links** — text the invoice with a pay-now button. Part payments
  are tracked against the balance automatically.

Tradies who take payment on-site barely chase invoices. Tradies who invoice
from the couch chase plenty.

Try it on your next job: open the invoice, hit **Record Payment**.

Tom

---

## Email 3 — Day 8

**Subject:** Three things in QuoteMate most tradies find by accident
**Preview:** Follow-ups that send themselves, prices that remember, Xero in one tap.

Hi {firstName},

Halfway through your trial. Three features that don't shout about themselves:

1. **Automatic follow-ups.** Quote not answered? The app nudges the customer
   for you, politely, on a schedule. Same for overdue invoices — you never
   write another awkward reminder text.
2. **Price memory.** Fix a price once and the app quotes YOUR rate from then
   on, not the list price.
3. **Xero sync.** Invoices push across in one tap, contacts created
   automatically. Your bookkeeper stops asking for screenshots.

PS — if you're a plumber: connect your Reece maX account and every quote
prices from your actual trade discounts. Setup takes about a minute.

Tom

---

## Email 4 — Day 12

**Subject:** Your trial ends in 2 days — here's exactly what changes
**Preview:** What you keep free forever, what Pro keeps doing.

Hi {firstName},

Straight version, no tricks:

**You keep, free, forever:** unlimited quotes and invoices, your branding on
every PDF, GST handled, online card payments.

**Pro keeps doing:** AI-built material lists with live supplier pricing, every
premium template, the lower Square rate, and bank/PayID/BPAY/PayPal payment
options for your customers.

Pro is **$49/month**, or **$328 for the year** — 44% off, which works out
around $6.30 a week. Most blokes lose more than that in forgotten line items
on one quote.

If the last two weeks saved you time, keep it going: **[Upgrade — takes 30
seconds]**

Either way, your quotes, invoices and customers stay yours.

Tom

---

## Email 5 — Day 15 (only if not converted)

**Subject:** You're on the free plan now — one question
**Preview:** No card charged, nothing lost. But tell me one thing.

Hi {firstName},

Your trial wrapped up yesterday. You're on the free plan now — unlimited
quotes and invoices, nothing deleted, no card charged, because we never took
one.

One question, genuinely: **what would Pro have needed to do for you to keep
it?** Reply with one line. Brutal is fine — brutal is useful.

If the answer is price: the annual plan is $328, about $6.30 a week. If the
answer is a missing feature, there's a decent chance I'll build it — feature
requests from real users run this roadmap.

Tom
QuoteMate

---

## Implementation sketch (separate ticket)

Scheduled Cloud Function (daily, Brisbane morning) queries users where
`trialStartedAt` is 0/3/8/12/15 days ago, checks suppression rules
(`subscriptionStatus`, comped flag, per-email sent-log in
`users/{uid}/lifecycle/`), sends via Brevo transactional API with the
templates above. Log sends to Firestore so re-runs are idempotent. Measure:
open/click per email in Brevo + `utm_content=day{N}` sessions in GA4 +
trial→paid rate by cohort (started before/after sequence launch).
