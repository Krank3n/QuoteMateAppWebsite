import type { MetadataRoute } from 'next';
import { trades, cities, quoteTemplates, guides } from '@/lib/data';
import { competitors } from './compare/data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://quotemateapp.au';
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/terms/`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy/`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/trades/`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates/`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/articles/`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/pricing/`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about/`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/compare/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const tradePages: MetadataRoute.Sitemap = trades.map((trade) => ({
    url: `${baseUrl}/quotes-for-${trade.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const TIER_1_CITIES = new Set(['sydney', 'melbourne', 'brisbane']);
  const TIER_2_CITIES = new Set(['perth', 'adelaide']);
  const cityPriority = (slug: string): number => {
    if (TIER_1_CITIES.has(slug)) return 0.8;
    if (TIER_2_CITIES.has(slug)) return 0.75;
    return 0.7;
  };

  const tradeCityPages: MetadataRoute.Sitemap = trades.flatMap((trade) =>
    cities.map((city) => ({
      url: `${baseUrl}/quotes-for-${trade.slug}/${city.slug}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: cityPriority(city.slug),
    }))
  );

  const templatePages: MetadataRoute.Sitemap = quoteTemplates.map((template) => ({
    url: `${baseUrl}/templates/${template.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${baseUrl}/articles/${guide.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const comparePages: MetadataRoute.Sitemap = competitors.map((comp) => ({
    url: `${baseUrl}/compare/${comp.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...tradePages, ...tradeCityPages, ...templatePages, ...blogPages, ...comparePages];
}
