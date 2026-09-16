---
id: integrations-square
title: Connecting Square for payments
category: Integrations
audience: [customers, prospects]
last_updated: 2026-09-16
keywords: [square, connect square, payments, oauth, merchant, tap to pay setup, location, not accepting payments, activate square]
question_examples:
  - "How do I connect Square?"
  - "Do I need a Square account?"
  - "How do I set up card payments?"
  - "Where do I connect Square in the app?"
---

# Connecting Square for payments

Square is how QuoteMate takes card payments. Connecting it once lets you take Tap to Pay payments on-site and add online payment links to your invoices.

## How to connect

You can connect Square during onboarding (the Payments step) or later in **Settings → Square Payments**. Connecting uses Square's secure OAuth sign-in — your Square login and tokens stay on the server side, never on your device. Once connected, QuoteMate shows your merchant and location.

You'll need a **Square account connected to your ABN**. If you don't have one, you can create it as part of connecting.

## After connecting

- Take **Tap to Pay** card payments on a supported phone (iPhone XS+ on iOS 16.4+, or NFC Android).
- Add **online payment links** to invoices.

Full details on fees, requirements and payouts are in [Getting paid with Square](../03-invoicing-and-payments/getting-paid-with-square.md).

## "This business is currently not accepting payments"

If a customer taps your Pay Now button and Square shows this message, your Square account is connected but Square hasn't switched on card payments for it yet. That usually means the account is new and still needs its identity and bank details confirmed at squareup.com, or the account was created outside Australia.

QuoteMate checks this with Square when you connect and again in the background. While Square can't take a card for your account, quotes and invoices go out **without** a Pay Now button (your other payment methods still show), and **Settings → Square Payments** explains what to fix. Finish activating the account in Square, then tap **Check again** on that screen. Any pay links made before that are retired, so resend the invoice to give the customer a working button.

## Related

- [Getting paid with Square](../03-invoicing-and-payments/getting-paid-with-square.md)
- [Payment methods](../03-invoicing-and-payments/payment-methods.md)
- [Create your account](../01-getting-started/create-your-account.md)
