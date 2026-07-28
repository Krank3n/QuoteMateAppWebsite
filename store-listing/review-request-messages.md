# Review-request messages — Capterra / G2 push

Prepared: 2026-07-28 · Companion to `software-directory-listings.md`.

Goal: five Capterra reviews, which is roughly where the listing starts
appearing in category pages — the pages AI answer engines actually quote.

**Copy rules applied** (from `functions/src/emailCopy.guard.test.ts`, house
rules for user-facing copy): never the word "AI" — describe the outcome
instead; gender-neutral, no "guys/blokes/folks/fancy"; the trial is 14 days;
no quote-quota claims, the free plan is unlimited.

---

## Before you send anything

**Claim the Capterra profile first.** You get a unique review-collection URL
once the vendor profile is claimed — that link pre-fills the product and is
the only way the review is attributed correctly. Every `[REVIEW LINK]`
placeholder below needs it. Sending people to a generic search page loses
most of them.

**Warn them about the sign-in.** Capterra requires reviewers to verify via
LinkedIn or a business email, and it takes about 10 minutes, not 2. People
who aren't told this abandon halfway and don't come back. Saying it up front
costs you a few replies and saves the ones who start.

**Never offer anything in return.** No discount, no free months, no gift
card. Capterra and G2 both remove incentivised reviews publicly and flag the
vendor. Capterra runs its own gift-card program — you can mention that it
exists, since it's theirs, but you offer nothing yourself.

**Ask for honest, not positive.** Partly because it's the right thing, partly
because a 5.0-with-no-criticism profile reads as fake to both the platform
and to a model summarising it. A four-star review with a real drawback in it
is worth more than a perfect one.

---

## 1. Paying subscribers — the main ask

Highest-value segment and the smallest. Send these **individually**, not as a
campaign, with the first line genuinely personalised — reference the trade,
how long they've been on, something they've told you. At this volume there is
no excuse for a mail merge, and a merge is obvious.

> **Subject:** Small favour to ask
>
> Hi [NAME],
>
> You've been using QuoteMate since [MONTH] — long enough to have a real
> opinion on it, which is why I'm asking you rather than someone who signed
> up last week.
>
> I'm trying to get QuoteMate listed on Capterra, which is where a lot of
> people start when they're comparing trade software. A listing with no
> reviews on it is invisible, so I need a handful of actual users to write
> one. Would you be up for it?
>
> Here's the link: [REVIEW LINK]
>
> Two honest warnings. It asks you to verify through LinkedIn or a business
> email, so it's about ten minutes rather than two. And please write what you
> actually think — if the [SPECIFIC THING] still annoys you, put that in. A
> page of glowing reviews with nothing critical on it doesn't read as real,
> and it wouldn't be.
>
> No problem at all if you'd rather not. You're already paying me, which is
> the part that counts.
>
> Thanks,
> Tom

---

## 2. Engaged users who've sent positive feedback

For people in the `feedback` collection who wrote something warm, whether or
not they're paying. They've already volunteered an opinion unprompted, which
makes them far likelier to write one again.

Quote their own words back — it proves it's a real message to a real person,
and it reminds them why they liked it.

> **Subject:** That note you sent about QuoteMate
>
> Hi [NAME],
>
> A while back you sent through some feedback about QuoteMate — you said
> "[QUOTE THEIR WORDS]". That stuck with me, and it's the reason I'm
> emailing.
>
> I'm setting up a Capterra listing so tradies comparing quoting software can
> actually find us. The listing does nothing until there are reviews on it,
> and I'd rather have five real ones from people who use the thing than
> anything I could write myself.
>
> If you've got ten minutes: [REVIEW LINK]
>
> Fair warning, it makes you verify through LinkedIn or a business email, so
> it's a bit more of a process than it should be. And write it straight —
> including whatever's still missing for you. I'd rather have that on the
> record than a page of five stars.
>
> Either way, thanks for the original note. It's a short list of people who
> bother.
>
> Tom

---

## 3. Reply to the two Google Play reviewers

Sonni Joshua Lynton (27 Apr 2026) and TMAK 11 (13 Apr 2026) both wrote long,
specific, unprompted five-star reviews. They're the two most likely people in
the entire base to write another one.

**Do this in two steps.** First, reply publicly on Play — you should be doing
this regardless. It's good practice, it's crawlable text, and a developer who
answers reviews reads as an active company. Don't put the ask in the public
reply; a visible "now go review us somewhere else" looks like farming.

**Public reply (Sonni):**

> Thanks Sonni — genuinely made my week. "More than just a quoting app" is
> exactly what we were going for, so it's good to hear it landed. If there's
> anything you hit that slows you down, tell me directly at
> tom@hansendev.com.au — I read all of it. — Tom

**Public reply (TMAK 11):**

> Thank you — this is a really thoughtful review. The point about staying
> consistent across quotes is the one people don't expect until they've sent
> a few dozen. Anything you want it to do that it doesn't yet, email me at
> tom@hansendev.com.au and it goes on the list. — Tom

Then, **only if you can match them to an account email**, send the ask
separately. If you can't match them, leave it — there's no way to ask
privately and asking in public isn't worth it.

> **Subject:** You reviewed QuoteMate on Google Play in April
>
> Hi [NAME],
>
> You left a review on Google Play back in April — the one about [DETAIL
> FROM THEIR REVIEW]. I've been meaning to thank you properly for it.
>
> One ask, and no hard feelings if it's a no. I'm listing QuoteMate on
> Capterra, where tradies compare this kind of software, and it needs real
> reviews before it shows up anywhere useful. You already wrote the hard part
> once: [REVIEW LINK]
>
> It's a slower process than Play — LinkedIn or business email verification,
> maybe ten minutes.
>
> Thanks either way,
> Tom

---

## 4. One follow-up, then stop

Send 8–10 days later, once, only to people who didn't reply. Never chase a
third time — these are customers, and the relationship is worth more than the
review.

> **Subject:** Re: [original subject]
>
> Hi [NAME] — bumping this once in case it got buried, then I'll leave you
> alone about it.
>
> [REVIEW LINK]
>
> Genuinely no obligation.
>
> Tom

---

## 5. If someone says no, or goes quiet

Drop it immediately and don't record it as a to-do. The number of people you
can ask is tiny and the cost of annoying one is high — a customer who feels
chased is a churn risk worth far more than a review.

If someone replies with a complaint instead of a review, that's a better
outcome than the review. Fix it, tell them you fixed it, and ask again in a
couple of months — a customer who watched you act on their complaint writes
the most credible review you'll ever get.

---

## Sequencing

1. Claim the Capterra vendor profile, get the review link.
2. Reply publicly to both Play reviews (do this today — it's free and it
   should have happened in April).
3. Send segment 1, individually, over a few days. Not all in one hour.
4. Wait a week. Send segment 2.
5. Follow up once with non-responders.
6. Stop at five reviews and reassess. If it stalls at two or three, the
   answer isn't more chasing — it's more customers, and that's the trial
   conversion problem, not this one.
