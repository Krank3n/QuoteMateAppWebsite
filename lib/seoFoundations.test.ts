import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { parse } from 'yaml';
import * as XLSX from 'xlsx';
import sitemap from '../app/sitemap';
import { guides, quoteTemplates } from './data';
import { getHelpArticles, getHelpLastUpdated } from './help';
import data from '../seo/data.json';
import redirects from '../seo/redirects.json';
import { templateDownloadLinks, templateLineItems } from './templateDownloads';
import { createTemplatePdf, createTemplateWorkbook, pdfText } from '../scripts/lib/template-assets';

describe('retirement redirects', () => {
  const spec = parse(fs.readFileSync(path.resolve('.do/app.yaml'), 'utf8'));
  const rules = spec.ingress.rules;
  it('keeps the live-spec redirect configuration in sync with the reviewed map', () => {
    expect(rules.filter((r: any) => r.redirect).map((r: any) => ({ from: r.match.path.prefix, to: r.redirect.uri }))).toEqual(redirects);
    expect(rules.filter((r: any) => r.redirect).every((r: any) => r.redirect.redirect_code === 301)).toBe(true);
    expect(rules.at(-1).component.name).toBe('quotemate-web');
  });
  it('only redirects unlisted guides to active, self-canonical equivalents', () => {
    const urls = new Set(sitemap().map(page => new URL(page.url).pathname));
    const from = new Set(redirects.map(r => r.from));
    for (const r of redirects) {
      expect(data.guides.find(g => `/articles/${g.slug}` === r.from)?.unlisted).toBe(true);
      expect(guides.some(g => `/articles/${g.slug}/` === r.to)).toBe(true);
      expect(urls.has(r.to)).toBe(true);
      expect(urls.has(`${r.from}/`)).toBe(false);
      expect(from.has(r.to.replace(/\/$/, ''))).toBe(false); // no chains
      expect([...urls].some(url => url.startsWith(r.from))).toBe(false); // no live prefix collisions
    }
    expect(from.size).toBe(redirects.length);
  });
});

describe('honest sitemap dates', () => {
  it('is independent of build time and only uses explicit content dates', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2030-01-01')); const first = sitemap();
      vi.setSystemTime(new Date('2031-01-01')); expect(sitemap()).toEqual(first);
      for (const page of first) {
        const guide = guides.find(g => page.url.endsWith(`/articles/${g.slug}/`));
        const help = getHelpArticles().find(a => page.url.endsWith(`/help/${a.slug}/`));
        const helpIndex = page.url.endsWith('/help/') ? getHelpLastUpdated() : undefined;
        expect(page.lastModified).toBe(guide?.dateModified || guide?.datePublished || help?.lastUpdated || helpIndex);
      }
    } finally { vi.useRealTimers(); }
  });
});

describe('downloadable template assets', () => {
  it('defines unique PDF/XLSX assets for every advertised template, including extras', () => {
    const paths = quoteTemplates.flatMap(t => Object.values(templateDownloadLinks(t.slug)));
    expect(new Set(paths).size).toBe(quoteTemplates.length * 2);
    expect(() => templateDownloadLinks('../private')).toThrow();
  });
  it.each(quoteTemplates.map(t => [t.slug, t] as const))('builds a genuinely blank, editable workbook and valid PDF for %s', (_, template) => {
    const book = createTemplateWorkbook(template);
    const bytes = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
    const roundtrip = XLSX.read(bytes, { type: 'buffer' });
    expect(roundtrip.SheetNames).toEqual(['Quote worksheet', 'Instructions']);
    const sheet = roundtrip.Sheets['Quote worksheet'];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    expect(rows[0][0]).toBe(template.name);
    const firstRow = rows.findIndex(row => row[0] === 'Description') + 1;
    expect(rows.slice(firstRow, firstRow + templateLineItems(template).length).map(row => row[0])).toEqual(templateLineItems(template));
    expect(rows.slice(firstRow, firstRow + templateLineItems(template).length).every(row => row.slice(1).every(value => !value))).toBe(true);
    expect(Object.values(sheet).some(cell => typeof cell === 'object' && cell && 'f' in cell)).toBe(false);
    const pdf = Buffer.from(createTemplatePdf(template));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.toString('latin1')).toContain('Blank worksheet');
    expect(pdf.length).toBeGreaterThan(2000);
  });
  it('normalises punctuation unsupported by the PDF font', () => {
    expect(pdfText('Drainage — 10m² × 2m³')).toBe('Drainage - 10m2 x 2m3');
  });
});
