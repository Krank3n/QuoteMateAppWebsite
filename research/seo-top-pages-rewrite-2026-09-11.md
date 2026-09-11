# Top-10-by-impressions rewrite — 11 September 2026

Search Console, AU, Web, 12 Aug–8 Sep 2026, read per page via the UI
(`page=*` contains-filter; hub figures therefore include their children).

## What the data said

Sorted by impressions, not clicks, the list was not the one anyone expected:

| Page | Impr | Clicks | Avg pos | Top queries it is shown for |
|---|---:|---:|---:|---|
| `/best/job-management-software-for-tradies/` | 2,098 | 0 | **68.8** | job management software (307), … australia (293), job management app (184), … for tradies (172), job quoting software (116) |
| `/best/app-for-plumbers/` | 1,896 | 0 | **68.2** | plumbing software (135), plumbers software (110), best software for plumbers (89), plumbing invoice app(s) (87+87), plumbing quote software (82) |
| `/best/invoicing-app-for-tradies/` | 1,823 | 0 | **50.8** | quoting and invoicing software (153), invoicing app (127), invoice and quote software (117), best invoice app for tradesmen (60) |
| `/integrations/reece/` | 1,690 | 0 | 10.0 | reece max (1,202), reece max login (137), max reece login (119), reece max portal (21) |
| `/best/app-for-electricians/` | 1,629 | 1 | **42.3** | electrician software (141), electrical contractor apps (124), electrician app (112), apps for electricians (102) |
| `/best/tradie-app-australia/` | 1,237 | 0 | **57.6** | trades software (125), best tradie apps australia (77), tradie app (75), app for tradies (62) |
| `/quotes-for-glaziers/` | 1,149 | 0 | **5.4** | glass quoting program (680), glass quoting system (117), shower quoting tool (92), glazing quoting software (66) |
| `/best/quoting-app-for-tradies/` | 797 | 1 | **53.2** | quoting app (124), best app for quoting jobs (101), job quoting software (97), quoting apps (89) |
| `/best/` (hub, contains all six) | 10,200 | 2 | 58.1 | the union of the above |
| `/templates/` (hub, contains children) | 790 | 2 | 20.7 | construction quote template (120), building quote template (72), tradesman quote template (71), carpentry quote template (69) |

Three things this settles:

1. **The `/best/` section is 10,200 impressions, 2 clicks, position 58.** Six pages, one template with the nouns swapped (same intro shape, same two H2s, same three FAQs), filed by Google on pages five to seven. The site-wide average position of 25.9 is the homepage's brand queries pulling the mean up; the commercial pages are far deeper than that number suggests. Rewriting the words inside the same shape would not have moved them.
2. **The queries are category terms, not "best of" searches.** People type *job management software*, *plumbing software*, *electrician software*, *quoting app*. They want a buyer's guide. The pages were written as roundups with QuoteMate first every time.
3. **Two pages are not rewrite targets.** Reece ranks for `reece max login`: those searchers want Reece's portal, and zero clicks is the correct outcome. Glaziers is on **page one with zero clicks**, so the body is fine and the snippet is the problem; its 932 Generative-AI-feature impressions (25 Aug read) also mean many of these impressions are inside AI Overviews, where CTR is near zero by construction.

## What changed

- **Six `/best/` guides rewritten from scratch** as buyer's guides for their category query: distinct section sets per page, honest per-product fits using only claims already made on the site's compare pages and price table, a worked "what you actually pay for one person vs three" section, and an explicit "where QuoteMate stops" on every page. 1,040–1,670 words each (was ~450). Titles and descriptions now match the query (`Job Management Software for Tradies: 6 Apps Compared`, `Plumbing Software for Australian Plumbers…`). QuoteMate's table line is now specific per page instead of the same sentence six times.
- **`RoundupArticle`** gained multi-paragraph sections and bullet lists, and now renders URLs through the same `renderBody` helper the article pages use (lifted into `app/components/renderBody.tsx`), so a URL in guide copy is a link rather than bare text.
- **Glaziers**: new title and description built for the "glass quoting program" click, summary rewritten to answer that query in its first sentence, and a new section routing the `shower quoting tool` searches to the tool that already exists.
- **`/templates/` hub**: three sections answering the construction / building / carpentry / tradesman-template searches it ranks for and routing each to the closest real worksheet. No new free tool (standing rule).
- **`/best/` hub**: a one-screen router from each category query to the guide that answers it.
- Reece: untouched, on purpose.

Not in scope: the clicks-sorted list (homepage, electrical article, plumbers/cleaners/electricians/builders/concreters trade pages, bathroom template). Those were the top ten *by clicks*, not impressions.

## Guardrails applied

Voice guide banlist, AU English, no em-dash filler, one generalised first-hand line per page, no invented figures (every dollar amount checked against an allowlist of figures already on the site; one made-up range was caught and removed), no new supplier names, CallKatie linked once on the one page where phones are relevant.

## What to watch, and when

Position is the metric, not clicks yet. Check these pages' average position in Search Console from mid-October: they were at 42–69 on 8 Sep. Impressions may fall before position rises, because pages Google re-evaluates often drop out of the deep results they were padding. A move to the 20s within eight weeks would be a real result; staying in the 40s–60s means the constraint is domain authority and the backlink work is the next lever, not more rewriting.
