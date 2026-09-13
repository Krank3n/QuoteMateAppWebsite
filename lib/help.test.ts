import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getHelpArticles, getHelpArticleBySlug, getHelpCategories, rewriteHelpHref } from './help';

describe('help centre loader', () => {
  it('publishes every knowledge-base article plus the FAQ under a unique slug', () => {
    const articles = getHelpArticles();
    const slugs = articles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain('faq');
    expect(slugs).toContain('getting-paid-with-square');
    // 26 articles in 8 folders + faq.md (README.md and manifest.json are not pages).
    expect(articles).toHaveLength(27);
    expect(slugs).not.toContain('README');
  });

  it('orders categories by folder number with the FAQ last', () => {
    const names = getHelpCategories().map((g) => g.category.name);
    expect(names[0]).toBe('Getting Started');
    expect(names[1]).toBe('Quoting');
    expect(names.at(-1)).toBe('FAQ');
    expect(getHelpCategories().find((g) => g.category.name === 'Getting Started')?.category.slug).toBe('getting-started');
  });

  it('rewrites cross-links between articles to /help/ URLs and leaves other links alone', () => {
    const known = new Set(['square-payments-integration', 'payment-methods']);
    expect(rewriteHelpHref('../05-integrations/square-payments-integration.md', known, 'x')).toBe('/help/square-payments-integration/');
    expect(rewriteHelpHref('payment-methods.md', known, 'x')).toBe('/help/payment-methods/');
    expect(rewriteHelpHref('payment-methods.md#fees', known, 'x')).toBe('/help/payment-methods/#fees');
    expect(rewriteHelpHref('https://squareup.com/au', known, 'x')).toBe('https://squareup.com/au');
    expect(rewriteHelpHref('mailto:tom@hansendev.com.au', known, 'x')).toBe('mailto:tom@hansendev.com.au');
    expect(() => rewriteHelpHref('../nope/missing-article.md', known, 'x')).toThrow(/unknown article/);
  });

  it('renders the Square article with its links, table and no duplicate H1', () => {
    const article = getHelpArticleBySlug('getting-paid-with-square');
    expect(article).toBeDefined();
    expect(article!.category.name).toBe('Invoicing & Payments');
    expect(article!.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(article!.summary.length).toBeGreaterThan(20);
    expect(article!.html).not.toContain('<h1');
    expect(article!.html).toContain('href="/help/square-payments-integration/"');
    expect(article!.html).not.toContain('.md');
    expect(article!.html).toContain('<div class="help-table-wrap"><table>');
    expect(article!.html).toContain('</table></div>');
  });

  it('never ships a raw .md link on any page', () => {
    for (const article of getHelpArticles()) {
      expect(article.html, article.slug).not.toMatch(/href="[^"]*\.md/);
      expect(article.html, article.slug).not.toContain('<h1');
      expect(article.title, article.slug).toBeTruthy();
    }
  });
});

describe('help centre videos', () => {
  it('attaches the take-payment clip to the Square article with files that exist on disk', () => {
    const article = getHelpArticleBySlug('getting-paid-with-square');
    expect(article?.video?.name).toBe('take-payment');
    expect(article?.video?.duration).toBe('PT15S');
    expect(article?.video?.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    for (const ext of ['.mp4', '.webm', '-poster.jpg']) {
      expect(fs.existsSync(path.join('public/assets/videos/help', `take-payment${ext}`)), ext).toBe(true);
    }
    // Only the articles that declare a video carry one.
    expect(getHelpArticles().filter((a) => a.video)).toHaveLength(1);
  });
});
