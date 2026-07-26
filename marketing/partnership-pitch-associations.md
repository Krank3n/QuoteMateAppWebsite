# Association / wholesaler partnership pitch (draft v1, 2026-07-26)

Channel #3 in the growth system's evidence-ranked portfolio — the Tradify×Master Electricians and Fergus×NECA/MPAQ template: a member-only discount, promoted by the association to its members, attribution via code + UTM. Zero media cost; the association gets a real member benefit, we get distribution with borrowed trust. This is a DRAFT for Tom to put in his own voice before anything is sent — nothing here is committed until he sends it.

## Offer structure (the standard template in this vertical)

- **Member deal**: 50% off the first 3 months, then an ongoing member discount (Tradify×MEA uses 50%→20%; Fergus×NECA uses flat 15% for membership life). Pick per negotiation; the first-3-months discount is the acquisition lever, the ongoing one is the association's "permanent benefit" story.
- **Attribution**: dedicated signup link `quotemateapp.au/?utm_source=partner&utm_campaign=<assoc>` + a member code. Flows into the existing admin attribution table automatically (same pipe as the ads).
- **Their side**: a listing on the association's member-benefits page + one mention in their member newsletter. That's the whole ask to start.
- Founding-price note: while `config/foundingOffer` is open, the member deal must be phrased against the *current* price honestly — no double-stacked fictional discounts.

## Target list (order by fit with existing product truths)

1. **Plumbing associations** (MPAQ, Master Plumbers state bodies) — Reece integration is a genuine differentiator here; the existing Reece relationship may open the door directly (the Fergus playbook: merchant → association).
2. **Master Electricians Australia / NECA** — biggest tradie associations; already comfortable with this deal shape (Tradify/Fergus precedents mean the benefits manager knows the template).
3. **HIA / Master Builders** state bodies — broader trades, bigger lists, slower to move.
4. **Reece / wholesaler trade programs** — not an association but same mechanic: a perk inside their trade-account ecosystem.

## Draft email (adjust voice, keep short)

> Subject: A member benefit for [ASSOC] — quoting app built for tradies
>
> Hi [NAME],
>
> I'm Tom, the developer behind QuoteMate — a quoting and invoicing app for Australian tradies. Talk the job into the phone, the quote builds itself with materials priced, and the invoice and card payment happen in the same app.
>
> I'd like to offer [ASSOC] members an exclusive deal: [50% off the first 3 months + X% ongoing] for as long as they're members. Members get a real benefit, and it costs [ASSOC] nothing — we'd just need a listing on the member-benefits page and a mention when it launches.
>
> [MEA does this with Tradify; happy to structure it the same way.]
>
> The app has a free 14-day trial that doesn't start until the first quote, so members can try it with zero risk. Keen for a 15-minute call if this sounds useful.
>
> Cheers,
> Tom Hansen — QuoteMate ([quotemateapp.au](https://quotemateapp.au))

## Mechanics to build only when a deal lands (don't pre-build)

- Discount redemption: member code → Stripe coupon / store offer codes (scoping needed per platform — web Stripe is easiest, start web-only).
- A `/partners/<assoc>` landing page variant with the association's logo (with permission) and the member deal.
- Monthly member-count report to the association (attributed signups from the admin table).
