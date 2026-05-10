#!/usr/bin/env npx tsx
/**
 * Generates a new QuoteMate article using:
 *   1. seo/keywords.csv — keyword pipeline (primary + secondary cluster)
 *   2. seo/voice.md     — voice & anti-slop rules
 *   3. seo/checklist.md — on-page SEO rules
 *   4. SERP grounding   — Gemini googleSearch tool fetches top-3 outline
 *   5. checklist.ts     — programmatic validation, regen on failure
 *   6. cross-links.ts   — deterministic CallKatie cross-link decision
 *
 * Usage:
 *   npx tsx scripts/generate-article.ts                     # next pending keyword in CSV
 *   npx tsx scripts/generate-article.ts "custom topic"      # custom title (best-effort match against CSV)
 *   npx tsx scripts/generate-article.ts --slug=foo-bar      # regenerate a specific slug
 *   npx tsx scripts/generate-article.ts --dry-run           # don't write data.json or image
 *   npx tsx scripts/generate-article.ts --no-image          # skip image gen
 *   npx tsx scripts/generate-article.ts --no-serp           # skip SERP fetch (faster, lower quality)
 *
 * Requires GEMINI_API_KEY in .env.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { validate, summarize, type ArticleDraft } from './lib/checklist';
import { fetchSerpOutline, outlineBriefing, type SerpOutline } from './lib/serp';
import { buildCrossLinkContext } from './lib/cross-links';

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'seo', 'data.json');
const KEYWORDS_PATH = path.join(ROOT, 'seo', 'keywords.csv');
const VOICE_PATH = path.join(ROOT, 'seo', 'voice.md');
const CHECKLIST_PATH = path.join(ROOT, 'seo', 'checklist.md');
const IMAGES_DIR = path.join(ROOT, 'public', 'assets', 'articles');

const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image-preview';
const MAX_REGEN_ATTEMPTS = 2;

interface CliArgs {
  customTopic?: string;
  slug?: string;
  dryRun: boolean;
  noImage: boolean;
  noSerp: boolean;
}

function parseArgs(): CliArgs {
  const args: CliArgs = { dryRun: false, noImage: false, noSerp: false };
  for (const arg of process.argv.slice(2)) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--no-image') args.noImage = true;
    else if (arg === '--no-serp') args.noSerp = true;
    else if (arg.startsWith('--slug=')) args.slug = arg.slice('--slug='.length);
    else if (!arg.startsWith('--')) args.customTopic = arg;
  }
  return args;
}

interface KeywordRow {
  primary: string;
  secondaries: string[];
  trade: string;
  relatedTemplate: string;
  kd: number;
  volume: number;
  intent: string;
}

function parseCsv(raw: string): KeywordRow[] {
  const lines = raw.trim().split(/\r?\n/);
  const rows: KeywordRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || line.startsWith('#')) continue;
    const cols = line.split(',');
    if (cols.length < 7) {
      console.warn(`  CSV row ${i + 1} has ${cols.length} columns, expected 7 — skipping`);
      continue;
    }
    rows.push({
      primary: cols[0].trim(),
      secondaries: cols[1].split('|').map((s) => s.trim()).filter(Boolean),
      trade: cols[2].trim(),
      relatedTemplate: cols[3].trim(),
      kd: Number(cols[4]) || 0,
      volume: Number(cols[5]) || 0,
      intent: cols[6].trim(),
    });
  }
  return rows;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickNextKeyword(rows: KeywordRow[], existingSlugs: Set<string>): KeywordRow | null {
  for (const row of rows) {
    if (!existingSlugs.has(slugify(row.primary))) return row;
  }
  return null;
}

function loadData(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function saveData(data: Record<string, unknown>) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
}

function loadFile(p: string): string {
  return fs.readFileSync(p, 'utf-8');
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING },
          body: { type: Type.STRING },
        },
        required: ['heading', 'body'],
      },
    },
    tips: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['title', 'description', 'sections', 'tips'],
};

function buildPrompt(
  row: KeywordRow,
  voice: string,
  checklist: string,
  serpBriefing: string,
  crossLinkInstruction: string,
  retryNotes: string,
): string {
  return `You are writing an article for QuoteMate, the Australian quoting and invoicing app for tradies.

# Voice & Style

${voice}

# On-page SEO Checklist

${checklist}

# SERP Briefing — what is winning for this query

${serpBriefing}

# ${crossLinkInstruction}

# This Article

Primary keyword: "${row.primary}"
Secondary keywords (weave AT LEAST 2 of these into the body, naturally, as topical proof):
${row.secondaries.map((s) => `  - ${s}`).join('\n')}
Trade: ${row.trade}
Search intent: ${row.intent}

Title MUST contain the primary keyword. Australian English. AUD only. Cover most of the SERP H2 themes in your own framing — do not copy headings verbatim. Lead each section with the answer.

Return ONLY a JSON object matching the schema (no markdown, no code fences):
{
  "title": "An H1 title that contains the primary keyword and reads naturally",
  "description": "120-160 char meta description ending with a benefit",
  "sections": [
    { "heading": "Specific H2", "body": "90-350 words leading with the answer" }
  ],
  "tips": [ "5-8 short, concrete pro tips" ]
}

${retryNotes}`;
}

async function generateArticleBody(
  ai: GoogleGenAI,
  row: KeywordRow,
  voice: string,
  checklist: string,
  serpBriefing: string,
  crossLinkInstruction: string,
): Promise<ArticleDraft> {
  let lastFailures: string[] = [];
  for (let attempt = 0; attempt <= MAX_REGEN_ATTEMPTS; attempt++) {
    const retryNotes = attempt === 0
      ? ''
      : `# Retry — previous attempt failed these checks, fix them now:\n${lastFailures.join('\n')}`;

    const prompt = buildPrompt(row, voice, checklist, serpBriefing, crossLinkInstruction, retryNotes);

    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: 'application/json', responseSchema },
    });

    const text = res.text?.trim() ?? '';
    let parsed: Partial<ArticleDraft>;
    try {
      parsed = JSON.parse(text);
    } catch {
      console.warn(`  Attempt ${attempt + 1}: JSON parse failed — retrying`);
      lastFailures = ['Previous response was not valid JSON. Return ONLY the JSON object, no prose.'];
      continue;
    }

    const draft: ArticleDraft = {
      title: parsed.title ?? '',
      description: parsed.description ?? '',
      keyword: row.primary,
      secondaryKeywords: row.secondaries,
      sections: parsed.sections ?? [],
      tips: parsed.tips ?? [],
    };

    const failures = validate(draft);
    if (failures.length === 0) {
      console.log(`  ✓ Validation passed on attempt ${attempt + 1}`);
      return draft;
    }

    console.warn(`  Attempt ${attempt + 1}: ${failures.length} validation failures:\n${summarize(failures)}`);
    lastFailures = failures.map((f) => `  - [${f.rule}] ${f.detail}`);

    if (attempt === MAX_REGEN_ATTEMPTS) {
      console.warn(`  Returning best-effort draft despite ${failures.length} validation failures`);
      return draft;
    }
  }
  throw new Error('Unreachable');
}

async function generateImage(ai: GoogleGenAI, title: string, slug: string): Promise<void> {
  const prompt = `A professional, clean photo for a blog article titled "${title}".
The image should show an Australian tradesperson at work on this type of job, on a real Australian job site.
Bright, natural lighting. No text overlays. Photorealistic style. Landscape orientation 800x450.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: { responseModalities: ['TEXT', 'IMAGE'] },
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, 'base64');
      const ext = part.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
      const imagePath = path.join(IMAGES_DIR, `${slug}.${ext}`);
      fs.writeFileSync(imagePath, buffer);

      if (ext === 'png') {
        const { execSync } = await import('child_process');
        const jpgPath = path.join(IMAGES_DIR, `${slug}.jpg`);
        try {
          execSync(`sips -s format jpeg "${imagePath}" --out "${jpgPath}" 2>/dev/null`);
          fs.unlinkSync(imagePath);
        } catch {
          fs.renameSync(imagePath, jpgPath);
        }
      }

      console.log(`  Image saved: public/assets/articles/${slug}.jpg`);
      return;
    }
  }

  console.warn('  Warning: No image generated. You may need to add one manually.');
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not set in .env');
    process.exit(1);
  }

  const args = parseArgs();
  const ai = new GoogleGenAI({ apiKey });

  const data = loadData();
  const guides = (data.guides || []) as { slug: string }[];
  const existingSlugs = new Set(guides.map((g) => g.slug));

  const csvRaw = fs.readFileSync(KEYWORDS_PATH, 'utf-8');
  const rows = parseCsv(csvRaw);

  let row: KeywordRow | null = null;

  if (args.slug) {
    const found = rows.find((r) => slugify(r.primary) === args.slug);
    if (!found) { console.error(`No CSV row found for slug "${args.slug}"`); process.exit(1); }
    row = found;
  } else if (args.customTopic) {
    const lower = args.customTopic.toLowerCase();
    row = rows.find((r) => r.primary.toLowerCase() === lower) ?? {
      primary: args.customTopic,
      secondaries: [],
      trade: 'builders',
      relatedTemplate: '',
      kd: 0,
      volume: 0,
      intent: 'informational',
    };
  } else {
    row = pickNextKeyword(rows, existingSlugs);
    if (!row) {
      console.log('All keywords in seo/keywords.csv have been published. Add more rows.');
      process.exit(0);
    }
  }

  const slug = slugify(row.primary);
  if (!args.slug && existingSlugs.has(slug)) {
    console.log(`Article "${slug}" already exists. Pass --slug=${slug} to force regenerate.`);
    process.exit(0);
  }

  console.log(`\nGenerating: ${row.primary}`);
  console.log(`  Slug: ${slug} | Trade: ${row.trade} | KD: ${row.kd} | Vol: ${row.volume}`);

  const voice = loadFile(VOICE_PATH);
  const checklist = loadFile(CHECKLIST_PATH);

  let serpOutline: SerpOutline;
  if (args.noSerp) {
    console.log('  Skipping SERP fetch (--no-serp)');
    serpOutline = { keyword: row.primary, targetWordCount: 1500, topResults: [], sharedH2s: [], notes: '' };
  } else {
    console.log('  Fetching SERP outline…');
    serpOutline = await fetchSerpOutline(ai, row.primary);
  }
  const serpBriefing = outlineBriefing(serpOutline);

  const cross = buildCrossLinkContext(row.primary, row.secondaries, row.trade);
  console.log(`  Cross-link to CallKatie: ${cross.shouldLink ? 'YES' : 'no'}`);

  console.log('  Generating article body…');
  const draft = await generateArticleBody(ai, row, voice, checklist, serpBriefing, cross.promptInstruction);

  const guide = {
    slug,
    title: draft.title,
    trade: row.trade,
    keyword: row.primary,
    secondaryKeywords: row.secondaries,
    description: draft.description,
    relatedTemplate: row.relatedTemplate,
    sections: draft.sections,
    tips: draft.tips,
    datePublished: new Date().toISOString().slice(0, 10),
    dateModified: new Date().toISOString().slice(0, 10),
  };

  if (args.dryRun) {
    console.log('\n--- DRY RUN ---');
    console.log(JSON.stringify(guide, null, 2));
    process.exit(0);
  }

  if (!args.noImage) {
    console.log('  Generating image…');
    await generateImage(ai, draft.title, slug);
  }

  const idx = guides.findIndex((g) => g.slug === slug);
  if (idx >= 0) {
    (data.guides as object[])[idx] = guide;
  } else {
    (data.guides as object[]).push(guide);
  }
  saveData(data);

  console.log(`\nDone: /articles/${slug}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
