/**
 * SERP outline fetcher.
 *
 * Uses Gemini's googleSearch grounding tool to fetch the top results for a
 * primary keyword, then returns a structural outline (target word count,
 * common H2 patterns) used to brief the article generator.
 *
 * Grounded calls cannot use responseSchema, so we ask for a JSON block in
 * plain text and parse it defensively.
 */

import type { GoogleGenAI } from '@google/genai';

export interface SerpOutline {
  keyword: string;
  targetWordCount: number;
  topResults: { title: string; url: string; estWordCount?: number }[];
  sharedH2s: string[];
  notes: string;
}

const SERP_MODEL = process.env.GEMINI_SERP_MODEL ?? 'gemini-2.5-flash';

const PROMPT_TEMPLATE = (keyword: string) =>
  `Use Google Search to find the top 3 currently-ranking results in Australia for the search query: "${keyword}".

For each of the top 3 results, identify:
- The page title
- The URL
- A rough word-count estimate of the article body (round to nearest 100)
- The primary H2/H3 headings used (full list, in order)

Then synthesise:
- A target body word count for a competitive Australian-market article (typically the median of the top 3, rounded to the nearest 100, capped at 2000)
- A list of 5-8 H2 themes that recur across the top 3 — these are the topics Google has decided this query is about

Return ONLY a JSON code block (\`\`\`json … \`\`\`) with this exact shape, no other prose:

{
  "targetWordCount": 1500,
  "topResults": [
    { "title": "…", "url": "https://…", "estWordCount": 1400 },
    { "title": "…", "url": "https://…", "estWordCount": 1600 },
    { "title": "…", "url": "https://…", "estWordCount": 1500 }
  ],
  "sharedH2s": [
    "What goes into the quote",
    "Typical costs",
    "How to price materials",
    "Labour pricing",
    "Common mistakes"
  ],
  "notes": "1-2 sentences on what the SERP is rewarding (e.g. 'Top 3 lead with cost ranges before methodology — open with a price band')."
}`;

const FALLBACK: SerpOutline = {
  keyword: '',
  targetWordCount: 1500,
  topResults: [],
  sharedH2s: [
    'What to include in the quote',
    'Typical costs',
    'How to price materials',
    'Labour pricing tips',
    'Common quoting mistakes',
  ],
  notes: 'SERP fetch failed — using default Australian tradie quoting outline.',
};

function extractJson(text: string): unknown | null {
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch { /* fall through */ }
  }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.slice(firstBrace, lastBrace + 1)); } catch { /* fall through */ }
  }
  return null;
}

export async function fetchSerpOutline(
  ai: GoogleGenAI,
  keyword: string,
): Promise<SerpOutline> {
  try {
    const res = await ai.models.generateContent({
      model: SERP_MODEL,
      contents: PROMPT_TEMPLATE(keyword),
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    const text = res.text?.trim() ?? '';
    const parsed = extractJson(text) as Partial<SerpOutline> | null;
    if (!parsed || !Array.isArray(parsed.sharedH2s) || parsed.sharedH2s.length === 0) {
      console.warn(`  SERP fetch returned no usable JSON for "${keyword}", using fallback`);
      return { ...FALLBACK, keyword };
    }
    return {
      keyword,
      targetWordCount: Math.min(2000, Math.max(1100, parsed.targetWordCount ?? 1500)),
      topResults: parsed.topResults ?? [],
      sharedH2s: parsed.sharedH2s.slice(0, 8),
      notes: parsed.notes ?? '',
    };
  } catch (err) {
    console.warn(`  SERP fetch error for "${keyword}": ${(err as Error).message} — using fallback`);
    return { ...FALLBACK, keyword };
  }
}

export function outlineBriefing(outline: SerpOutline): string {
  const h2List = outline.sharedH2s.map((h, i) => `  ${i + 1}. ${h}`).join('\n');
  const topLine = outline.topResults.length
    ? `Top ${outline.topResults.length} ranking pages avg ~${Math.round(outline.topResults.reduce((s, r) => s + (r.estWordCount ?? 0), 0) / Math.max(1, outline.topResults.length))} words.`
    : 'No SERP data — using default outline.';
  return `SERP target: ~${outline.targetWordCount} words. ${topLine}
Common H2 themes across the top results (cover most of these, in your own framing):
${h2List}
${outline.notes ? `\nSERP read: ${outline.notes}` : ''}`;
}
