// Help Centre: publishes knowledge-base/*.md as /help/<slug>/ pages.
//
// The knowledge base is the customer-facing source of truth (see
// knowledge-base/README.md). Until now it only fed the support chat widget;
// this loader turns the same files into static pages so the content is
// readable, linkable and indexable. One fact still lives in one place: edit
// the markdown, and both the chat bot and the website pick it up.
//
// Build-time only (fs). Import from server components, generateStaticParams,
// and the sitemap, never from a client component.

import fs from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { Marked } from 'marked';

export interface HelpCategory {
  slug: string;
  name: string;
  order: number;
}

export interface HelpArticle {
  slug: string;
  id: string;
  title: string;
  category: HelpCategory;
  lastUpdated: string;
  keywords: string[];
  questionExamples: string[];
  /** One-sentence description for meta tags and index cards. */
  summary: string;
  /** Rendered body, H1 removed, .md links rewritten to /help/ URLs. */
  html: string;
}

const KB_DIR = path.join(process.cwd(), 'knowledge-base');
const FAQ_CATEGORY: HelpCategory = { slug: 'faq', name: 'FAQ', order: 99 };

interface Frontmatter {
  id: string;
  title: string;
  category: string;
  last_updated: string | Date;
  keywords?: string[];
  question_examples?: string[];
}

interface ManifestDoc { path: string; summary?: string }

function splitFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error('Help article is missing YAML frontmatter');
  return { meta: parseYaml(match[1]) as Frontmatter, body: match[2] };
}

function isoDate(value: string | Date): string {
  // `yaml` parses an unquoted 2026-07-05 as a Date; normalise to YYYY-MM-DD.
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

/** Folder `03-invoicing-and-payments` → order 3, slug `invoicing-and-payments`. */
function categoryFromFolder(folder: string, name: string): HelpCategory {
  const match = folder.match(/^(\d+)-(.+)$/);
  if (!match) throw new Error(`Help category folder "${folder}" needs an NN- prefix`);
  return { slug: match[2], name, order: Number(match[1]) };
}

/** The first body paragraph, markdown stripped, as a plain-text fallback summary. */
function firstParagraph(body: string): string {
  const para = body
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith('#') && !p.startsWith('>') && !p.startsWith('|') && !p.startsWith('-'));
  return (para ?? '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface RawArticle {
  file: string;
  slug: string;
  meta: Frontmatter;
  body: string;
  category: HelpCategory;
}

function readRawArticles(): RawArticle[] {
  const out: RawArticle[] = [];
  for (const entry of fs.readdirSync(KB_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const folder = path.join(KB_DIR, entry.name);
      for (const file of fs.readdirSync(folder).filter((f) => f.endsWith('.md')).sort()) {
        const { meta, body } = splitFrontmatter(fs.readFileSync(path.join(folder, file), 'utf8'));
        out.push({
          file: `${entry.name}/${file}`,
          slug: file.replace(/\.md$/, ''),
          meta,
          body,
          category: categoryFromFolder(entry.name, meta.category),
        });
      }
    } else if (entry.name === 'faq.md') {
      const { meta, body } = splitFrontmatter(fs.readFileSync(path.join(KB_DIR, entry.name), 'utf8'));
      out.push({ file: entry.name, slug: 'faq', meta, body, category: FAQ_CATEGORY });
    }
  }
  return out;
}

function readManifestSummaries(): Map<string, string> {
  const summaries = new Map<string, string>();
  const manifestPath = path.join(KB_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return summaries;
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { documents?: ManifestDoc[] };
  for (const doc of manifest.documents ?? []) {
    if (doc.summary) summaries.set(doc.path, doc.summary);
  }
  return summaries;
}

/**
 * Rewrites a knowledge-base link target (`../05-integrations/x.md`, `x.md`,
 * `x.md#section`) to its /help/ URL. Anything else (http, mailto, anchors)
 * passes through untouched. Throws on a .md target that is not a published
 * article so a broken cross-link fails the build instead of shipping a 404.
 */
export function rewriteHelpHref(href: string, knownSlugs: Set<string>, from: string): string {
  const match = href.match(/^(?:[./]*\/)?(?:[\w-]+\/)*([\w-]+)\.md(#.*)?$/);
  if (!match) return href;
  const [, slug, anchor = ''] = match;
  if (!knownSlugs.has(slug)) {
    throw new Error(`Help article ${from} links to unknown article "${href}"`);
  }
  return `/help/${slug}/${anchor}`;
}

function stripLeadingH1(body: string): string {
  return body.replace(/^\s*# [^\n]*\r?\n/, '');
}

function renderMarkdown(body: string, knownSlugs: Set<string>, from: string): string {
  const md = new Marked({
    gfm: true,
    walkTokens(token) {
      if (token.type === 'link') token.href = rewriteHelpHref(token.href, knownSlugs, from);
    },
  });
  const html = md.parse(stripLeadingH1(body), { async: false }) as string;
  // Tables are the only thing allowed to be wider than a phone screen, and
  // only inside their own scroll container.
  return html
    .replace(/<table>/g, '<div class="help-table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

let cache: HelpArticle[] | undefined;

export function getHelpArticles(): HelpArticle[] {
  if (cache) return cache;
  const raw = readRawArticles();
  const slugs = new Set<string>();
  for (const a of raw) {
    if (slugs.has(a.slug)) throw new Error(`Duplicate help article slug "${a.slug}" (${a.file})`);
    slugs.add(a.slug);
  }
  const summaries = readManifestSummaries();
  cache = raw
    .map((a): HelpArticle => ({
      slug: a.slug,
      id: a.meta.id,
      title: a.meta.title,
      category: a.category,
      lastUpdated: isoDate(a.meta.last_updated),
      keywords: a.meta.keywords ?? [],
      questionExamples: a.meta.question_examples ?? [],
      summary: summaries.get(a.file) ?? firstParagraph(a.body),
      html: renderMarkdown(a.body, slugs, a.file),
    }))
    .sort((x, y) => x.category.order - y.category.order || x.title.localeCompare(y.title));
  return cache;
}

export function getHelpArticleBySlug(slug: string): HelpArticle | undefined {
  return getHelpArticles().find((a) => a.slug === slug);
}

/** Categories in folder order, each with its articles. */
export function getHelpCategories(): { category: HelpCategory; articles: HelpArticle[] }[] {
  const groups = new Map<string, { category: HelpCategory; articles: HelpArticle[] }>();
  for (const article of getHelpArticles()) {
    const group = groups.get(article.category.slug) ?? { category: article.category, articles: [] };
    group.articles.push(article);
    groups.set(article.category.slug, group);
  }
  return [...groups.values()].sort((a, b) => a.category.order - b.category.order);
}

/** The most recent last_updated across the whole Help Centre (for the index page). */
export function getHelpLastUpdated(): string {
  return getHelpArticles().map((a) => a.lastUpdated).sort().at(-1) ?? '';
}
