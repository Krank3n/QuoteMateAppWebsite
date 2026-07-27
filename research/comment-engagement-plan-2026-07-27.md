# Community engagement — research update + execution plan

Written 2026-07-27. Continues `comment-engagement-targets.md` (51 threads,
16 Jul) and `comment-drafts-top5.md`. Read those first; this file records what
changed in the 11 days since, and turns the paused strategy into a dated plan.

---

## 1. What changed since 16 July

### 1.1 The NSW eCert mandate is now live — this is the story of the quarter

Verified against Building Commission NSW and independent sources:

- From **1 July 2026**, every Certificate of Compliance for Electrical Work
  (CCEW) in NSW must be lodged **digitally** through the BCNSW eCert portal.
  The PDF CCEW form is gone.
- The portal went live for voluntary use in **December 2025**; 1 July 2026 is
  when it stopped being optional.
- **On-the-spot fines of up to $1,000** apply per occasion a certificate isn't
  supplied to the consumer (or network provider where relevant).
- eCert validates the electrician's NSW licence on every lodgement.
- There is a **BCNSW eCert API** for third-party apps to lodge on the sparky's
  behalf.

Why this matters for the comment channel: it is a four-week-old regulatory
change with a fine attached, affecting every licensed electrician in the
largest state. r/AusElectricians is the #1 target sub. **Explaining eCert
accurately, with zero product mention, is the single strongest value-only
comment available to us** — it's exactly the "answer completely, sell nothing"
play the standing rule asks for, and it earns more profile clicks than any
quoting-workflow answer could.

It is also a gap in our own content. Searching both repos: QuoteMate's SEO
content mentions CCEW only as a **line item to charge for** ($50–95 + GST,
`seo/template-content.json:966`) and as a compliance note in electrical
templates. **Nothing anywhere covers the digital mandate.**

### 1.2 A direct competitor has appeared, and it is aimed at our exact wedge

**Just Send It AI** — justsendit.com.au, ROCO GROUP AUSTRALIA PTY LTD (ABN
30 669 916 125), Sydney. Founder Rob Theodoridis, licensed NSW electrician,
23 years on the tools. Currently in beta.

Overlap with QuoteMate is close to total on positioning:

| | Just Send It AI | QuoteMate |
|---|---|---|
| Price | **$49/mo** founders, locked for life ($99 after beta) | **$49/mo** founding member |
| Trial | 14 days, no card | 14 days |
| Story | Founder-led, "built by a tradie not a software company" | Founder-led |
| Wedge | **"Quoting-first, not job management"** — explicitly vs ServiceM8/Tradify/AroFlo | Same |
| Market | NSW electricians only; plumbing/HVAC/carpentry "during 2026" | Multi-trade, national |
| Moat | **CCEW/eCert integration, launching 27 Jul 2026** | Reece maX live integration |

Two things to take seriously:

1. **They own the phrase our drafts plant.** Comment draft #2 (r/Plumbing)
   deliberately seeds the category term *"quoting-first app"* without naming
   anything, on the theory that a searcher who learns the category finds us.
   In an Australian search, that phrase now increasingly returns them.
2. **They are already mining these exact channels.** Their homepage social
   proof is a wall of pull-quotes attributed to *"Whirlpool forums"* and
   *"Reddit r/AusFinance"*. They are reading the same threads we listed.

They do not mention QuoteMate anywhere in their comparison table (they bench
against ServiceM8, Tradify, AroFlo, "generic AI"). We are not yet on their
radar. Their compliance claim is also softer than the marketing implies — the
homepage says CCEW integration is "in progress" / "launching 27 Jul" in five
different places with three different framings.

### 1.3 Reddit is now unverifiable from here — manual check required

This is a real change in what I can do for you:

- WebFetch is blocked on `reddit.com` and `old.reddit.com`.
- The browser extension refuses reddit.com under its safety restrictions.
- Web search will not return reddit.com results.
- Reddit has been **blocking the Wayback Machine** from archiving post pages,
  comments and profiles since Aug 2025 (anti-AI-scraping), so third-party
  archives are no longer a reliable fallback either.

Consequence: **every Reddit thread in the target list has to be eyeballed by
you, logged in, before drafting.** Budget 15 minutes for it. I can't confirm
comment counts, archive status or whether a thread got a better answer since
16 July.

Related: the "Reddit archives threads at ~6 months" assumption in the target
list is **unverified and probably outdated** — Reddit stopped auto-archiving
site-wide some years ago and made it a per-subreddit setting. The Tier-3
"likely archived" threads (Sep 2023 – Jun 2025, high Google visibility) may
well still be open. Worth 5 minutes to check, because those are the ones with
permanent search traffic.

### 1.4 Non-Reddit targets verified live

| Target | Status |
|---|---|
| Flying Solo — "Builders estimating software" | **Live.** 11 posts, last Jul 2015. Reply box present (login required). |
| Whirlpool — thread 2769852 (accounting software, electrical) | **Live and open.** Last post Dec 2018. |
| Quora — "Best software for quotation making?" | **Live, still weak.** Top human answers are 5 years old; the motivational-quotes-app answer is still there; 11 answers collapsed. Open for new answers. |

One useful discovery on Flying Solo: a competitor (**CheckVault**) posted a
full, undisguised product pitch in that estimating thread — features list,
"give me a yell if you need help setting up your account" — and it was **not
removed**. That confirms the target list's read: Flying Solo genuinely
tolerates disclosed product answers. It is the lowest-risk place to put a
real link, and it's underrated in the current priority queue.

### 1.5 Reddit karma gates — the warming requirement is real

No sitewide minimum; each sub sets its own via AutoMod and most don't publish
it. Observed 2026 bands: sub-50K members often no gate; 50–500K typically
50–200 comment karma and 7–30 days account age; 500K–5M commonly 200–500 karma
and 14–30 days. r/smallbusiness and r/Plumbing sit in that middle-to-large
band. **A fresh account cannot work the priority queue.** Warming isn't
optional politeness, it's a hard gate.

---

## 2. What this changes about the strategy

The 16 July plan was right about the rules and the thread list. It was wrong
about the **order**, and it now has a timing problem.

**Invert the sequence.** The old plan led with Reddit — which is the highest
risk channel, has a 2–4 week hard warm-up gate, and is the only one I can no
longer help verify. Meanwhile Quora, Flying Solo and Whirlpool need **zero
warming**, tolerate more, and can take a post today. Those should go first.
Reddit warms quietly in the background and comes online in week 3.

**Lead with eCert, not with quoting workflow.** The drafted comments are good
generic quoting advice. eCert is *timely, high-stakes, and unanswered* — it
gets far more attention for the same effort, and it needs no product mention
at all, so it carries no removal risk whatsoever. It's the perfect
account-warming material: genuinely useful, on-topic for the exact sub we care
about most, and it builds the "this bloke knows the industry" reputation
before any quoting opinion is offered.

**Treat Just Send It as a clock, not a threat.** They're NSW-electrical-only
and in beta. QuoteMate is multi-trade, national, live in both app stores, with
a real supplier integration. But they are founder-led, priced identically, and
working the same forums — so the window where QuoteMate can become the
recognised voice in AU trade communities is *now*, not next quarter.

---

## 3. The plan

Six weeks, ~2 hours a week. Week 1 is heavier because of the eCert window.

### Week 1 (27 Jul – 2 Aug) — eCert content + zero-risk channels

Goal: publish the authority asset, and get the first comments live on
platforms that need no account warming.

1. **Create the Reddit account today and do nothing promotional with it.**
   Real name handle. Bio: "Founder of QuoteMate — quoting app for AU tradies."
   Then leave it alone except for the warming below. The clock on account age
   starts the day you create it, so create it before anything else.
2. **Write the eCert explainer for the site** — `/blog/nsw-ecert-ccew-2026`
   or similar. What changed, when, the $1,000 fine, how to lodge, what the
   API means for apps, what it does *not* change. Straight public-interest
   explainer, no gate, no pitch. This is the reference the comments point
   back to implicitly (we never link it on Reddit — it exists so that people
   who search after reading your comment land on us).
3. **Post the Quora answer** — "Best software for quotation making?"
   (draft #3 exists; the thread is verified weak and open). Disclosed founder
   answer with link, per Quora norms. Zero risk, permanent Google visibility.
4. **Flying Solo** — register, set signature, post the "a decade later" update
   on *Builders estimating software*. Signature link sanctioned; a competitor
   pitched openly in that same thread and survived.

### Week 2 (3–9 Aug) — warming + the slow-burn forums

1. **Reddit warming, ~15 min/day.** Comment in r/AusElectricians,
   r/AusRenovation, r/Plumbing on anything you actually have an opinion on —
   *not* the target threads. Job talk, tool talk, pricing chat. Target
   100–150 comment karma by end of week 3. No links, no product, no quoting
   pitches. This is not a chore to rush; it's the reputation the later
   comments spend.
2. **eCert is your warming fuel.** Every "has anyone worked out eCert yet"
   thread in r/AusElectricians is a free, high-upvote, zero-risk comment.
   Answer them properly. This builds karma *and* the exact reputation we want,
   in the exact sub we want, faster than generic chat will.
3. **Whirlpool** — register openly, QuoteMate in profile only. Post the
   advice-only answer on thread 2769852 (verified open). Never link.
4. **Quora #2** — "What apps do you use, as a small construction company?"
   (draft #3's sibling; solo electrician asking). Disclosed, link included.

### Week 3 (10–16 Aug) — Reddit goes live, top of queue

Pre-flight, every time, no exceptions: open the thread logged in, confirm the
comment box exists, confirm nobody has already given your answer, re-read the
sub's rules in the sidebar.

1. **r/AusElectricians — "Quoting system"** (draft #1 ready). The oldest
   target and the one most at risk of going stale. Do this one first.
2. **r/AusRenovation — "Will you pay for quotes?"** (draft #5 ready).
3. Keep the daily warming going. 5–8 comments/week total across all subs, of
   which only 1–2 are target threads.

### Week 4 (17–23 Aug) — international subs

1. **r/Plumbing — "Solo guys, how are you sending quotes?"** (draft #2 —
   **needs a rewrite**, see §5).
2. **r/smallbusiness — "ServiceTitan quote is LOL"** (draft #4 ready; it's the
   strongest of the five and the "don't build it" argument is genuinely
   valuable).
3. Tier-3 archive check: spend 5 minutes confirming whether the five
   high-Google-visibility old threads are actually open. If they are, they
   jump the queue — permanent search traffic beats a fresh thread.

### Weeks 5–6 (24 Aug – 6 Sep) — work the queue, then review

1. Steady state: 5–8 threads/week from the target list, top-down.
2. Remaining Quora targets (6 left, all verified) — these are the best
   effort-to-permanence ratio in the whole plan and don't need Reddit at all.
3. **Review at 6 weeks** against the metrics below and decide whether the
   channel earns another quarter.

### Parked but decided

- **Xero App Store listing** stays priority #1 of the *backlink* strategy
  (copy already drafted) but it's a different workstream from commenting —
  don't let it block this. Blocker is the Partner Program signup + 3–5
  screenshots, not the copy.
- **Trade Quoting Report / digital PR** — still next quarter. eCert changes
  the pitch though: "how many NSW sparkies were ready for eCert" is a far more
  newsworthy survey hook than average quote values, and trade media will run
  it. Worth revisiting when you get to it.

---

## 4. Product / content decisions this research surfaced

These are outside the comment plan but fall out of it, flagged for your call:

1. **Does QuoteMate integrate the BCNSW eCert API?** There is a public API for
   third-party lodgement. Just Send It is shipping it as their headline moat
   this week. ServiceM8 and Tradify reportedly have not. For NSW electricians
   — a large slice of the target market — this is becoming a buying criterion.
   Not a small build, and NSW-only, so it's a real trade-off against
   multi-trade work. But it should be a deliberate decision, not an oversight.
2. **Ship the eCert explainer regardless.** Even if the integration is a no,
   the content play is cheap, we have nothing on it, and it's the current
   highest-intent search term in AU electrical.
3. **"Quoting-first" as positioning is now contested in AU.** Worth a think
   about what QuoteMate's one-line wedge is that Just Send It can't copy —
   the live supplier integration and multi-trade coverage are the honest
   answers.

---

## 5. Draft changes needed

**Draft #2 (r/Plumbing) must be rewritten before posting.** It currently
teaches the reader to go search "quoting-first app" — a term an AU competitor
is now actively ranking for. The advice is still right; the phrasing needs to
stop being free marketing for someone else. Replace the category-planting line
with the five-point trial checklist as the whole answer (points 1–5 are the
valuable part and stand alone fine).

**Drafts #1, #4, #5 are good to post as-is.** #3 (Quora) is good as-is and
keeps its link and disclosure.

**New drafts needed:** two eCert comments (appendix below).

---

## Appendix — eCert comment drafts (value-only, zero product mention)

### A. For any "how does eCert work / has anyone done one yet" thread in r/AusElectricians

> Short version: since 1 July the paper CCEW is dead, and everything goes
> through the Building Commission's eCert portal. The bit that catches people
> out is that it validates your licence on every single lodgement — so if
> your licence details don't match exactly what BCNSW has on file, it bounces
> and you're standing in someone's kitchen trying to sort it out.
>
> Three things worth knowing before your next job:
>
> 1. The fine is per occasion a certificate isn't supplied, not per audit —
> up to $1,000 a pop. It's not a "they'll never check" risk, it's a
> paper-trail risk, and the paper trail is now automatic.
>
> 2. The portal has been live since December for voluntary use, so it's not
> new software with new-software problems. If you haven't logged in yet, do
> it on a quiet night rather than on site.
>
> 3. There's a public API, which means job/quoting apps can lodge on your
> behalf rather than you re-typing job details into a second system. Most
> haven't built it yet. If you're already paying for software, it's a fair
> question to put to them — the answer tells you a lot about whether they're
> actually paying attention to this market.
>
> Worth doing one lodgement on a small job this week just so the first one
> isn't on a job that matters.

*Why it works: it's the most useful thing anyone can say in that sub right
now, names no product, and point 3 makes every reader go ask their current
app a question its vendor probably can't answer. Nothing removable.*

### B. For the "quoting system" / software-choice threads, as an add-on paragraph

> One more thing to put on the demo list if you're NSW: ask whether they lodge
> CCEWs through the BCNSW eCert API or whether you're re-typing the job into
> the portal afterwards. Since 1 July that's a second data-entry step on every
> single job, and it's the kind of thing that's invisible in a sales demo and
> extremely visible at 7pm on a Thursday.

*Drop-in for draft #1 and any electrical software thread. Turns a generic
software answer into one that only someone actually in the industry could
have written.*
