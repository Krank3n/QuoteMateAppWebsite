# On-Page SEO Checklist (QuoteMate Articles)

Loaded into every generation prompt as hard rules, then re-checked programmatically by `scripts/lib/checklist.ts`. Articles failing hard checks are regenerated automatically (up to 2 retries) before being saved.

## Hard rules (validator-enforced)

| # | Rule | Min | Max |
|---|------|-----|-----|
| 1 | Total body word count | 1200 | 2200 |
| 2 | Number of H2 sections | 5 | 8 |
| 3 | Each section body word count | 90 | 350 |
| 4 | Meta description length (chars) | 120 | 160 |
| 5 | Title contains primary keyword | yes | — |
| 6 | Primary keyword in first 150 words of section[0].body | yes | — |
| 7 | Primary keyword total occurrences | 3 | 12 |
| 8 | At least one external authority link (https URL in body) | 1 | — |
| 9 | At least 2 secondary keywords woven in | 2 | — |
| 10 | "Pro Tips" array length | 5 | 8 |
| 11 | No banned slop words (see voice.md) | — | — |
| 12 | No US English (color/center/neighborhood/USD) | — | — |
| 13 | No competitor SaaS mentions (Tradify, ServiceM8, Jobber, etc.) | — | — |

## Soft rules (prompt-enforced, not validated)

- Lead with the answer in each section, then explain.
- One concrete AUD price or AS standard reference per 200 words.
- Use real supplier names where natural (Bunnings, Reece, Tradelink, Beacon, CSR, Boral).
- One em-dash per 200 words maximum.

## Cross-product link

If the article topic intersects CallKatie themes (missed calls, after-hours, lead capture, phone handling), exactly ONE in-prose link to https://callkatie.ai must appear in the body. If the topic does not intersect, do NOT include the link.

The cross-link rule is set deterministically by `scripts/lib/cross-links.ts` based on keyword matching, not by the model.

## External authority links

The model should include 1–2 external authority links in body text (full https://… URLs that auto-render via `renderBody`). Acceptable sources:

- *.gov.au (regulator pages, e.g. fair-trading, energy.gov.au)
- standards.org.au
- Manufacturer/supplier specification pages (reece.com.au, bunnings.com.au, beaconlighting.com.au)
- CSIRO, Master Builders Association (mbansw.asn.au, mbav.com.au), HIA (hia.com.au)

Do NOT link to: blog content, competitor SaaS, Reddit, Quora, Wikipedia, generic news.

## Internal links

The article page (`app/articles/[slug]/page.tsx`) renders trade and template internal links automatically from `trade` and `relatedTemplate` fields. The generator must populate both correctly. The model itself does not need to write internal links into the body.

## What NOT to include

- A separate "Conclusion" or "In Summary" section. The last H2 is a useful one.
- A FAQ section unless explicitly part of the keyword cluster.
- Word counts above 2200 — search intent for "how to quote X" doesn't reward 3000-word articles, it punishes them with thin engagement.
