/**
 * Generate unique editorial content for /best/[slug] roundup pages via Gemini 2.5 Pro.
 * Per page: intro + 2 narrative sections + 3 FAQs, grounded on app/best/data.ts and the
 * QuoteMate voice guide. Stored in seo/best-content.json. Idempotent unless --force.
 *
 * Run: npx tsx scripts/gen_best.ts [--force]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bestPages } from '../app/best/data';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'seo', 'best-content.json');
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

function prompt(p: typeof bestPages[number]): string {
  const list = p.items.map((it, i) => `${i + 1}. ${it.name}${it.isQuoteMate ? ' (this is US, our top pick)' : ''} — best for: ${it.bestFor}; price: ${it.pricing}`).join('\n');
  return `${VOICE}

---

Write a fair, factual roundup for the guide **"${p.h1}"** — the best ${p.category}, for Australian tradies. QuoteMate is an AI quoting app for tradies (free plan; Pro $49/month or $328/year flat, no per-user fees; live Australian supplier pricing from Bunnings, Reece and Tradelink; Square tap-to-pay; automatic GST; Xero sync) and is our top pick.

The ranked shortlist (QuoteMate is #1):
${list}

Rules: This reads as an honest editor's roundup, not an ad. Credit every tool where it is genuinely stronger. Only use the facts above — do not invent prices, features, or weaknesses. Explain WHY QuoteMate is the top pick for this category on the merits (quoting speed, AI materials lists, live Australian supplier pricing, flat pricing, a free plan, getting paid on site), but be honest about who should pick one of the others instead.

Produce JSON:
- intro: 80-110 words. What this guide covers, how the tools were judged (on-site quoting speed, live local supplier pricing, pricing model, GST/ABN handling, getting paid), and the headline verdict naming QuoteMate as the top pick — while noting the shortlist suits different needs.
- exactly 2 sections, each a specific H2 heading + a 90-130 word body:
  1. "What makes the best ${p.category}" — the real decision factors a tradie should weigh.
  2. "The rest of the shortlist" — briefly walk through the OTHER tools by name (not QuoteMate) and who each is best for.
- faqs: exactly 3 specific to this category (e.g. the best free option, the cheapest option, whether you still need it if you already use Xero or MYOB). Concrete 40-70 word answers grounded in the facts.

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
  console.log(`Best-of content via ${MODEL}\n`);
  for (const p of bestPages) {
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
