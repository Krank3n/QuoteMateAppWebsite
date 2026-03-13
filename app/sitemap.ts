import type { MetadataRoute } from 'next';
import { trades, cities, quoteTemplates, guides } from '@/lib/data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://quotemateapp.au';
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/terms`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/trades`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/templates`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const tradePages: MetadataRoute.Sitemap = trades.map((trade) => ({
    url: `${baseUrl}/quotes-for-${trade.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const tradeCityPages: MetadataRoute.Sitemap = trades.flatMap((trade) =>
    cities.map((city) => ({
      url: `${baseUrl}/quotes-for-${trade.slug}/${city.slug}`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    }))
  );

  const templatePages: MetadataRoute.Sitemap = quoteTemplates.map((template) => ({
    url: `${baseUrl}/templates/${template.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${baseUrl}/blog/${guide.slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...tradePages, ...tradeCityPages, ...templatePages, ...blogPages];
}
