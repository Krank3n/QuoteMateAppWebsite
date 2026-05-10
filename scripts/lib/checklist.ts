/**
 * On-page SEO validator for QuoteMate articles.
 * Mirrors the rules in seo/checklist.md.
 *
 * Returns a list of failures. Empty list = pass.
 */

export interface ArticleDraft {
  title: string;
  description: string;
  keyword: string;
  secondaryKeywords?: string[];
  sections: { heading: string; body: string }[];
  tips: string[];
}

export interface ValidationFailure {
  rule: string;
  detail: string;
}

const BANNED_SLOP = [
  'unlock', 'harness', 'leverage', 'empower', 'elevate',
  'supercharge', 'turbocharge', 'unleash', 'game-changer',
  'next-level', 'cutting-edge', 'state-of-the-art',
  'world-class', 'best-in-class', 'in today\'s fast-paced',
  'navigate the complexities', 'delve into', 'dive in',
  'let\'s explore', 'moreover', 'furthermore', 'in conclusion',
  'to summarise', 'as we\'ve seen', 'robust', 'seamless',
  'streamline', 'synergy', 'ecosystem', 'revolutionise',
  'it\'s important to note', 'it\'s worth noting',
];

const US_ENGLISH = [
  /\bcolor\b/i, /\bcenter\b/i, /\bneighborhood\b/i,
  /\bfavorite\b/i, /\borganize\b/i, /\boptimize\b/i,
  /\bUSD\b/, /\$\s?USD\b/i, /\bLowe's\b/, /\bHome Depot\b/,
];

const COMPETITORS = [
  /\bTradify\b/i, /\bServiceM8\b/i, /\bJobber\b/i,
  /\bSimpro\b/i, /\bAroFlo\b/i, /\bFergus\b/i,
];

const URL_RE = /\bhttps?:\/\/[^\s<>()"']+/g;

function bodyText(a: ArticleDraft): string {
  return a.sections.map((s) => `${s.heading}\n${s.body}`).join('\n\n');
}

function totalWordCount(a: ArticleDraft): number {
  return bodyText(a).trim().split(/\s+/).filter(Boolean).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (haystack.match(re) || []).length;
}

export function validate(a: ArticleDraft): ValidationFailure[] {
  const failures: ValidationFailure[] = [];
  const all = bodyText(a);
  const allLower = all.toLowerCase();

  // 1. Total word count
  const total = totalWordCount(a);
  if (total < 1200) failures.push({ rule: 'word-count-min', detail: `${total} words (min 1200)` });
  if (total > 2200) failures.push({ rule: 'word-count-max', detail: `${total} words (max 2200)` });

  // 2. H2 section count
  if (a.sections.length < 5) failures.push({ rule: 'h2-count-min', detail: `${a.sections.length} sections (min 5)` });
  if (a.sections.length > 8) failures.push({ rule: 'h2-count-max', detail: `${a.sections.length} sections (max 8)` });

  // 3. Per-section word count
  a.sections.forEach((s, i) => {
    const wc = s.body.trim().split(/\s+/).filter(Boolean).length;
    if (wc < 90) failures.push({ rule: 'section-word-count-min', detail: `section[${i}] "${s.heading}" has ${wc} words (min 90)` });
    if (wc > 350) failures.push({ rule: 'section-word-count-max', detail: `section[${i}] "${s.heading}" has ${wc} words (max 350)` });
  });

  // 4. Meta description length
  const dlen = a.description.length;
  if (dlen < 120) failures.push({ rule: 'meta-description-short', detail: `${dlen} chars (min 120)` });
  if (dlen > 160) failures.push({ rule: 'meta-description-long', detail: `${dlen} chars (max 160)` });

  // 5. Title contains primary keyword
  if (!a.title.toLowerCase().includes(a.keyword.toLowerCase())) {
    failures.push({ rule: 'title-missing-keyword', detail: `title "${a.title}" missing keyword "${a.keyword}"` });
  }

  // 6. Primary keyword in first 150 words of section[0]
  const first = a.sections[0]?.body || '';
  const first150 = first.trim().split(/\s+/).slice(0, 150).join(' ').toLowerCase();
  if (!first150.includes(a.keyword.toLowerCase())) {
    failures.push({ rule: 'keyword-not-in-first-150', detail: `keyword "${a.keyword}" not in first 150 words` });
  }

  // 7. Primary keyword density bounds
  const kwCount = countOccurrences(all, a.keyword);
  if (kwCount < 3) failures.push({ rule: 'keyword-too-few', detail: `keyword "${a.keyword}" appears ${kwCount} times (min 3)` });
  if (kwCount > 12) failures.push({ rule: 'keyword-stuffing', detail: `keyword "${a.keyword}" appears ${kwCount} times (max 12)` });

  // 8. At least one external https link
  const urls = all.match(URL_RE) || [];
  if (urls.length < 1) failures.push({ rule: 'no-external-link', detail: 'body has no https:// link' });

  // 9. Secondary keywords woven in
  if (a.secondaryKeywords && a.secondaryKeywords.length > 0) {
    const found = a.secondaryKeywords.filter((kw) => allLower.includes(kw.toLowerCase()));
    if (found.length < 2) {
      failures.push({
        rule: 'secondary-keywords-missing',
        detail: `only ${found.length} of ${a.secondaryKeywords.length} secondary keywords found (min 2)`,
      });
    }
  }

  // 10. Tips array
  if (a.tips.length < 5) failures.push({ rule: 'tips-too-few', detail: `${a.tips.length} tips (min 5)` });
  if (a.tips.length > 8) failures.push({ rule: 'tips-too-many', detail: `${a.tips.length} tips (max 8)` });

  // 11. Banned slop
  for (const word of BANNED_SLOP) {
    if (allLower.includes(word.toLowerCase())) {
      failures.push({ rule: 'banned-slop', detail: `contains banned phrase "${word}"` });
    }
  }

  // 12. US English
  for (const re of US_ENGLISH) {
    const m = all.match(re);
    if (m) failures.push({ rule: 'us-english', detail: `matches ${re} ("${m[0]}")` });
  }

  // 13. Competitor mentions
  for (const re of COMPETITORS) {
    const m = all.match(re);
    if (m) failures.push({ rule: 'competitor-mention', detail: `mentions competitor "${m[0]}"` });
  }

  return failures;
}

export function summarize(failures: ValidationFailure[]): string {
  if (failures.length === 0) return 'PASS';
  return failures.map((f) => `  - [${f.rule}] ${f.detail}`).join('\n');
}
