#!/usr/bin/env npx tsx
/**
 * Generates a new article using Gemini AI (text + image) and adds it to seo/data.json.
 *
 * Usage:
 *   npx tsx scripts/generate-article.ts               # auto-pick next topic
 *   npx tsx scripts/generate-article.ts "custom topic" # specify a topic
 *
 * Requires GEMINI_API_KEY in .env
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// ─── Config ─────────────────────────────────────────────────────────────────
const DATA_PATH = path.join(__dirname, '..', 'seo', 'data.json');
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'assets', 'articles');
const GEMINI_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';

// ─── Topic Pool ─────────────────────────────────────────────────────────────
// Each topic maps to a trade slug and optionally a related template slug
const TOPIC_POOL: { topic: string; trade: string; relatedTemplate: string }[] = [
  { topic: 'How to Quote a Carport Build', trade: 'carpenters', relatedTemplate: '' },
  { topic: 'How to Quote a Patio Extension', trade: 'builders', relatedTemplate: '' },
  { topic: 'How to Quote a Shed Build', trade: 'builders', relatedTemplate: '' },
  { topic: 'How to Quote a Driveway Gate Installation', trade: 'fencers', relatedTemplate: 'driveway-gate-quote-template' },
  { topic: 'How to Quote Gutter Replacement', trade: 'roofers', relatedTemplate: 'gutter-replacement-quote-template' },
  { topic: 'How to Quote an Epoxy Floor Coating', trade: 'flooring-installers', relatedTemplate: 'epoxy-floor-coating-quote-template' },
  { topic: 'How to Quote a Laundry Renovation', trade: 'builders', relatedTemplate: 'laundry-renovation-quote-template' },
  { topic: 'How to Quote Pool Fencing', trade: 'fencers', relatedTemplate: 'pool-fencing-quote-template' },
  { topic: 'How to Quote a Staircase Build', trade: 'carpenters', relatedTemplate: 'staircase-quote-template' },
  { topic: 'How to Quote Rendering a House', trade: 'renderers', relatedTemplate: 'render-house-quote-template' },
  { topic: 'How to Quote a Shower Screen Installation', trade: 'glaziers', relatedTemplate: 'shower-screen-quote-template' },
  { topic: 'How to Quote LED Downlight Installation', trade: 'electricians', relatedTemplate: 'led-downlight-installation-quote-template' },
  { topic: 'How to Quote Termite Treatment', trade: 'pest-controllers', relatedTemplate: 'termite-treatment-quote-template' },
  { topic: 'How to Quote a Concrete Slab', trade: 'concreters', relatedTemplate: 'concrete-slab-quote-template' },
  { topic: 'How to Quote Paving', trade: 'landscapers', relatedTemplate: 'paving-quote-template' },
  { topic: 'How to Quote Carpet Cleaning', trade: 'cleaners', relatedTemplate: 'carpet-cleaning-quote-template' },
  { topic: 'How to Quote a Kitchen Splashback', trade: 'tilers', relatedTemplate: 'kitchen-splashback-quote-template' },
  { topic: 'How to Quote Plasterboard Installation', trade: 'plasterers', relatedTemplate: 'plasterboard-installation-quote-template' },
  { topic: 'How to Quote Vinyl Plank Flooring', trade: 'flooring-installers', relatedTemplate: 'vinyl-plank-flooring-quote-template' },
  { topic: 'How to Quote an EV Charger Installation', trade: 'electricians', relatedTemplate: 'ev-charger-installation-quote-template' },
  { topic: 'How to Quote End of Lease Cleaning', trade: 'cleaners', relatedTemplate: 'end-of-lease-cleaning-quote-template' },
  { topic: 'How to Quote a Wardrobe Fitout', trade: 'cabinet-makers', relatedTemplate: 'wardrobe-fitout-quote-template' },
  { topic: 'How to Quote Stump Grinding', trade: 'arborists', relatedTemplate: 'stump-grinding-quote-template' },
  { topic: 'How to Quote Bathroom Waterproofing', trade: 'builders', relatedTemplate: 'bathroom-waterproofing-quote-template' },
  { topic: 'How to Quote Ducted Air Conditioning', trade: 'hvac-technicians', relatedTemplate: 'ducted-aircon-quote-template' },
  { topic: 'How to Quote a Garage Door Replacement', trade: 'garage-door-installers', relatedTemplate: 'garage-door-replacement-quote-template' },
  { topic: 'How to Quote an Outdoor Kitchen', trade: 'builders', relatedTemplate: 'outdoor-kitchen-quote-template' },
  { topic: 'How to Quote Window Replacement', trade: 'glaziers', relatedTemplate: 'window-replacement-quote-template' },
  { topic: 'How to Quote Timber Floor Sanding', trade: 'flooring-installers', relatedTemplate: 'timber-floor-sanding-quote-template' },
  { topic: 'How to Quote Smoke Alarm Installation', trade: 'electricians', relatedTemplate: 'smoke-alarm-installation-quote-template' },
  { topic: 'How to Quote Commercial Cleaning', trade: 'cleaners', relatedTemplate: 'commercial-cleaning-quote-template' },
  { topic: 'How to Quote a Hot Water System Replacement', trade: 'plumbers', relatedTemplate: 'hot-water-system-replacement-quote-template' },
  { topic: 'How to Quote Bathroom Tiling', trade: 'tilers', relatedTemplate: 'bathroom-tiling-quote-template' },
  { topic: 'How to Quote a Welding Job', trade: 'welders', relatedTemplate: '' },
  { topic: 'How to Quote Lock Replacement', trade: 'locksmiths', relatedTemplate: '' },
  { topic: 'How to Quote Demolition Work', trade: 'demolishers', relatedTemplate: '' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function loadData(): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function saveData(data: Record<string, unknown>) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickNextTopic(existingSlugs: string[]): (typeof TOPIC_POOL)[0] | null {
  for (const topic of TOPIC_POOL) {
    const slug = slugify(topic.topic);
    if (!existingSlugs.includes(slug)) {
      return topic;
    }
  }
  return null;
}

// ─── Article Generation ─────────────────────────────────────────────────────
async function generateArticle(
  ai: GoogleGenAI,
  topic: string,
  trade: string,
): Promise<{
  slug: string;
  title: string;
  trade: string;
  keyword: string;
  description: string;
  relatedTemplate: string;
  sections: { heading: string; body: string }[];
  tips: string[];
}> {
  const slug = slugify(topic);

  const prompt = `You are a content writer for QuoteMate, an Australian quoting app for tradies.

Write a detailed quoting guide article about: "${topic}"

The article must be written for Australian tradies. Use Australian English spelling. Reference Australian standards where applicable. Include real-world cost ranges in AUD.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "${topic} in Australia",
  "keyword": "the main SEO keyword phrase",
  "description": "A 1-2 sentence meta description under 160 characters for SEO",
  "sections": [
    {
      "heading": "Section heading",
      "body": "Detailed section content (3-5 sentences). Include specific materials, costs in AUD, and practical advice."
    }
  ],
  "tips": [
    "Practical tip 1",
    "Practical tip 2"
  ]
}

Requirements:
- Exactly 5 sections covering: what to include in the quote, typical costs, materials pricing, labour tips, common mistakes
- Exactly 6 practical tips
- All prices in AUD
- Mention major Australian suppliers where relevant
- Professional but approachable tone`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  const text = response.text?.trim() || '';

  // Strip markdown code fences if present
  let jsonStr = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');

  // Extract the JSON object even if there's trailing text after it
  const startIdx = jsonStr.indexOf('{');
  if (startIdx !== -1) {
    let depth = 0;
    let endIdx = startIdx;
    for (let i = startIdx; i < jsonStr.length; i++) {
      if (jsonStr[i] === '{') depth++;
      else if (jsonStr[i] === '}') depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
    jsonStr = jsonStr.slice(startIdx, endIdx + 1);
  }

  // Fix common LLM JSON issues: trailing commas before ] or }
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  let article: Record<string, unknown>;
  try {
    article = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse JSON response. Raw text:', text.slice(0, 500));
    throw err;
  }

  return {
    slug,
    title: article.title as string,
    trade,
    keyword: article.keyword as string,
    description: article.description as string,
    relatedTemplate: '',
    sections: article.sections as Array<{ heading: string; body: string }>,
    tips: article.tips as string[],
  };
}

// ─── Image Generation ───────────────────────────────────────────────────────
async function generateImage(
  ai: GoogleGenAI,
  title: string,
  slug: string,
): Promise<void> {
  const prompt = `A professional, clean photo for a blog article titled "${title}".
The image should show an Australian tradesperson at work on this type of job, on a real Australian job site.
Bright, natural lighting. No text overlays. Photorealistic style. Landscape orientation 800x450.`;

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data!, 'base64');
      const ext = part.inlineData.mimeType?.includes('png') ? 'png' : 'jpg';
      const imagePath = path.join(IMAGES_DIR, `${slug}.${ext}`);
      fs.writeFileSync(imagePath, buffer);

      // If it's PNG, convert to JPG using sips (macOS)
      if (ext === 'png') {
        const { execSync } = await import('child_process');
        const jpgPath = path.join(IMAGES_DIR, `${slug}.jpg`);
        try {
          execSync(`sips -s format jpeg "${imagePath}" --out "${jpgPath}" 2>/dev/null`);
          fs.unlinkSync(imagePath);
        } catch {
          // If sips fails, just rename
          fs.renameSync(imagePath, jpgPath);
        }
      }

      console.log(`  Image saved: public/assets/articles/${slug}.jpg`);
      return;
    }
  }

  console.warn('  Warning: No image generated. You may need to add one manually.');
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not set in .env');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });
  const data = loadData();
  const guides = (data.guides || []) as { slug: string }[];
  const existingSlugs = guides.map((g) => g.slug);

  // Determine topic
  const customTopic = process.argv[2];
  let topic: string;
  let trade: string;
  let relatedTemplate = '';

  if (customTopic) {
    topic = customTopic;
    // Try to match from pool
    const match = TOPIC_POOL.find(
      (t) => t.topic.toLowerCase() === customTopic.toLowerCase(),
    );
    trade = match?.trade || 'builders';
    relatedTemplate = match?.relatedTemplate || '';
  } else {
    const next = pickNextTopic(existingSlugs);
    if (!next) {
      console.log('All topics in the pool have been published. Add more topics to TOPIC_POOL.');
      process.exit(0);
    }
    topic = next.topic;
    trade = next.trade;
    relatedTemplate = next.relatedTemplate;
  }

  const slug = slugify(topic);
  if (existingSlugs.includes(slug)) {
    console.log(`Article "${slug}" already exists. Skipping.`);
    process.exit(0);
  }

  console.log(`Generating article: ${topic}`);
  console.log(`  Trade: ${trade}`);
  console.log(`  Slug: ${slug}`);

  // Generate article content
  console.log('  Generating content...');
  const article = await generateArticle(ai, topic, trade);
  article.relatedTemplate = relatedTemplate;

  // Generate hero image
  console.log('  Generating image...');
  await generateImage(ai, topic, slug);

  // Append to data.json
  guides.push(article as unknown as { slug: string });
  data.guides = guides;
  saveData(data);

  console.log(`  Article added to seo/data.json`);
  console.log(`Done! New article: /articles/${slug}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
