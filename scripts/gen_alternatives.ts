/**
 * Generate unique editorial content for /alternatives/[slug] pages via Gemini 2.5 Pro.
 * Per page: intro + 2 narrative sections + 3 FAQs, grounded on app/alternatives/data.ts
 * and the QuoteMate voice guide. Stored in seo/alternatives-content.json.
 * Idempotent unless --force.
 *
 * Run: npx tsx scripts/gen_alternatives.ts [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { alternativePages } from '../app/alternatives/data';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'seo', 'alternatives-content.json');
const VOICE = fs.readFileSync(path.join(ROOT, 'seo', 'voice.md'), 'utf8');
const MODEL = 'gemini-2.5-pro';

function apiKey(): string {
  const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const line = env.split('\n').find((l) => l.startsWith('GEMINI_API_KEY='));
  if (!line) throw new Error('no GEMINI_API_KEY in .env');
  return line.split('=').slice(1).join('=').trim();
}
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey()}`;

const SCHEMA = {
  type: 'object',
  properties: {
    intro: { type: 'string' },
    sections: {
      type: 'array', minItems: 2, maxItems: 2,
      items: { type: 'object', properties: { heading: { type: 'string' }, body: { type: 'string' } }, required: ['heading', 'body'] },
    },
    faqs: {
      type: 'array', minItems: 3, maxItems: 3,
      items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'] },
    },
  },
  required: ['intro', 'sections', 'faqs'],
};

const BAN = ['unlock', 'harness', 'leverage', 'empower', 'supercharge', 'game-changer', 'cutting-edge', 'moreover', 'furthermore', 'robust', 'seamless', 'streamline', 'synergy', 'revolutionise', 'delve into'];

function prompt(p: typeof alternativePages[number]): string {
  const list = p.items.map((it, i) => `${i + 1}. ${it.name}${it.isQuoteMate ? ' (this is US, the recommended pick)' : ''} — best for: ${it.bestFor}; price: ${it.pricing}`).join('\n');
  const reasons = p.reasons.map((r) => `- ${r}`).join('\n');
  return `${VOICE}

---

Write fair, factual editorial for the page **"${p.h1}"** — a roundup helping an Australian tradie who is considering switching away from ${p.competitor}. QuoteMate is an AI quoting app for tradies (free plan; Pro $49/month or $328/year flat, no per-user fees; live Australian supplier pricing from Bunnings, Reece and Tradelink; Square tap-to-pay; automatic GST; Xero sync).

${p.competitor} context: ${p.competitor} pricing is "${p.competitorPricing}". Common reasons tradies look for an alternative:
${reasons}

The alternatives on this page, in ranked order (QuoteMate is the recommended pick):
${list}

Rules: Be even-handed and specific. Credit ${p.competitor} and the other tools where they are genuinely stronger. Only use the facts above — do not invent weaknesses, prices, or features. No legal or defamatory claims. Frame QuoteMate's edge around quoting speed, AI materials lists, live Australian supplier pricing, flat pricing, a free plan, and getting paid on site with Square.

Produce JSON:
- intro: 80-110 words. Who this guide is for (someone weighing up leaving ${p.competitor}), and the honest one-line verdict: QuoteMate is the top pick for sole traders and small crews who want fast quoting, but each alternative suits a different need.
- exactly 2 sections, each a specific H2 heading + a 90-130 word body:
  1. "Why QuoteMate is the best ${p.competitor} alternative" — concrete, grounded reasons, while acknowledging what ${p.competitor} does well.
  2. "How to choose the right ${p.competitor} alternative" — briefly walk through the OTHER options by name (not QuoteMate) and who each suits.
- faqs: exactly 3 specific to switching from ${p.competitor} (e.g. is there a free alternative, can I move my data, what is the cheapest option). Concrete 40-70 word answers grounded in the facts.

Australian English. Follow the voice guide and banlist strictly. Return ONLY the JSON object.`;
}

async function call(p: string): Promise<any | null> {
  const body = { contents: [{ parts: [{ text: p }] }], generationConfig: { temperature: 0.75, responseMimeType: 'application/json', responseSchema: SCHEMA } };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const json: any = await res.json();
      return JSON.parse(json.candidates[0].content.parts[0].text);
    } catch (e) {
      process.stderr.write(`  err ${e}\n`);
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
    }
  }
  return null;
}

async function main() {
  const force = process.argv.includes('--force');
  const store: Record<string, any> = fs.existsSync(OUT) && !force ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  console.log(`Alternatives content via ${MODEL}\n`);
  for (const p of alternativePages) {
    if (!force && store[p.slug]) continue;
    console.log(`-> ${p.slug}`);
    const res = await call(prompt(p));
    if (!res) { console.log('   FAIL'); continue; }
    const txt = JSON.stringify(res).toLowerCase();
    const hits = BAN.filter((w) => txt.includes(w));
    if (hits.length) console.log('   ⚠ banlist:', hits);
    store[p.slug] = res;
    fs.writeFileSync(OUT, JSON.stringify(store, null, 2));
  }
  console.log(`\nDone. ${Object.keys(store).length} entries in ${OUT}`);
}

main();
