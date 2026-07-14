# QuoteMate Customer Knowledge Base

A single source of truth for customer-facing help content about QuoteMate — written for support and structured so a chatbot can answer customer questions from it (retrieval-augmented generation, or RAG).

**Audience:** the tradies who use QuoteMate, and prospects browsing the website. It is *not* written for the homeowners who receive quotes.

**Currency / market:** AUD, Australia only.

Every fact here is grounded in the live website copy and the actual app code (as of the last-updated dates in each file), not invented. Where the app and marketing disagreed, this KB records the resolved source of truth — see [Known discrepancies](#known-website-discrepancies-to-reconcile).

---

## Structure

```
knowledge-base/
├── README.md          ← this file
├── manifest.json      ← machine-readable index of every article (for chatbot ingestion)
├── faq.md             ← consolidated quick-answer FAQ
├── 01-getting-started/
├── 02-quoting/
├── 03-invoicing-and-payments/
├── 04-job-management/
├── 05-integrations/
├── 06-pricing-and-billing/
├── 07-account-and-settings/
└── 08-troubleshooting/
```

27 articles across 9 categories. Each article is self-contained so it can be retrieved and answered on its own.

## Article format

Every `.md` file starts with YAML frontmatter, then the body:

```yaml
---
id: quoting-creating-a-quote          # stable unique id (used by the chatbot)
title: Creating a quote
category: Quoting
audience: [customers, prospects]
last_updated: 2026-07-05
keywords: [create quote, quoting flow, sections]
question_examples:                     # real phrasings a user might type
  - "How do I create a quote?"
  - "Can I split a quote into sections?"
---
```

- **`question_examples`** are the highest-value field for a chatbot — they map real user phrasings to the right article and make retrieval much more accurate. Keep them updated from real support questions.
- **Body**: an H1 title, a short plain-English intro, H2 sections (each answers a coherent sub-question so it chunks cleanly), and a **Related** list at the end.

## How to build the chatbot on this

The KB is designed to drop into a RAG pipeline:

1. **Chunk** — split each article by H2 heading (sections are already sized to be self-contained). Keep the `id`, `title`, and `category` as metadata on every chunk.
2. **Embed** — embed each chunk plus its `question_examples`. Store in a vector database.
3. **Retrieve + answer** — on a user question, retrieve the top chunks and have the model answer *only* from them, citing the article `title`. `manifest.json` gives you the full list to ingest and can also power quick keyword routing.
4. **Guardrails** — instruct the bot to answer only from the KB, to hand off to `tom@hansendev.com.au` when it doesn't know, and never to invent pricing, fees, or features. Pricing, fees, and the trial rules are the facts most likely to cause a support/refund issue if wrong — pin them from `manifest.json → source_of_truth`.

Recommended handoff: any billing dispute, refund, account deletion, or "it's not working" that the KB doesn't resolve → human support.

## Voice

Follow the house style in `../seo/voice.md`: plain English, Australian spelling (colour, organise, GST, ute, tradie), short sentences, no marketing slop ("unlock", "seamless", "streamline", "game-changer"). Lead with the answer, then the detail.

## Maintenance

- This KB is the **source of truth**. When the product changes (price, fee, feature, flow), update the relevant article and its `last_updated`, then re-ingest into the chatbot.
- Keep the website and the KB in step. If they drift, fix both.
- One fact lives in one place. Fees, for example, live canonically in `03-invoicing-and-payments/getting-paid-with-square.md`; other articles link to it rather than restating the numbers.

---

## Known website discrepancies to reconcile

While building this KB, the audit found places where the **live website contradicts itself or the app**. The KB uses the resolved value in each row. Items 1–4 and 7 were **fixed in the website source on 2026-07-12**; items 5 and 6 are left open (see notes).

| # | Topic | KB uses (source of truth) | Status |
|---|---|---|---|
| 1 | **Free plan quote limit** | **Unlimited** quotes & invoices (decision, 2026-07-05) | ✅ Fixed — Terms §4.1 now says unlimited; §4.2 reworded so "unlimited quotes" is no longer a Pro-only differentiator. |
| 2 | **Free trial length** | **14 days** (app code `TRIAL_DAYS=14`) | ✅ Fixed — per-trade FAQ (`lib/data.ts`) and Reece FAQ (`seo/data.json`) now say 14 days. |
| 3 | **Free = forever, not trial-only** | Free plan is **forever** | ✅ Fixed — per-trade FAQ reworded to lead with the free plan, then the 14-day trial. |
| 4 | **Pro price** | **$49/month** | ✅ Fixed — JSON-LD on the Reece page and Shower Quoting Tool page now list Pro at $49 (was $29). |
| 5 | **Square fees** | Free 1.7%; Pro **1.0% online / 1.5% in-person** (+ Square's own fee). Both the "1.7%/1%" and "1.5%" figures on the site are correct but describe different channels. | ⏳ Open (not a true contradiction) — the online (1%/1.7%) and in-person (1.5%) figures are both accurate. Left as-is; reconcile into one fee model only if you want the pages to show the full online-vs-in-person breakdown. |
| 6 | **Google Calendar sync** | Documented **conservatively** — connection exists; automatic job→calendar push should be verified | ⏳ Open (needs product decision) — Home FAQ promises scheduled jobs "sync to Google Calendar." Confirm the auto-push is actually wired before keeping that promise, or soften the copy. Not auto-edited because it's a feature claim, not a typo. |
| 7 | **App Store URL placeholder** | n/a | ✅ Fixed — `seo/data.json → site.appStoreUrl` now points to the real App Store listing (`id6754000046`). |

### Feature claims to verify before the chatbot promises them

The app code clearly ships one-tap **single**-invoice push to Xero and auto-create contacts. The marketing site also promises **Xero bulk sync**, **CSV export**, and **payment recording back to Xero**. These are included in the Xero article because they're public promises, but engineering should confirm they're live — otherwise soften both the site and `05-integrations/xero-integration.md`.

Not documented as live anywhere in this KB (planned/partial in the app, so intentionally left out): flat-rate/hide-line-item PDFs, end-to-end voice-to-quote, coverage-based auto-calc, SMS reminders, stock/inventory tracking, and in-app refunds. Keep these out of the chatbot's answers until they ship.
