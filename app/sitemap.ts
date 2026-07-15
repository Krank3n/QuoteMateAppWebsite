import type { MetadataRoute } from 'next';
import { trades, cityPageCities, quoteTemplates, guides, paymentHub, manageJobsHub, quotingHub, reeceIntegration } from '@/lib/data';
import { competitors } from './compare/data';
import { alternativePages } from './alternatives/data';
import { bestPages } from './best/data';
import { TEMPLATES_WITH_VIDEOS, TRADES_WITH_VIDEOS } from '@/lib/videos';

export const dynamic = 'force-static';

// Next.js serializes video title/description into the sitemap XML without
// escaping, so raw `&`/`<` in trade or template names breaks the whole file.
const xmlEscape = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

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
    { url: `${baseUrl}/alternatives/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/best/`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/shower-quoting-tool/`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/get-paid/`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/manage-jobs/`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/quoting/`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/integrations/reece/`, lastModified, changeFrequency: 'monthly', priority: 0.85 },
  ];

  const paymentSpokePages: MetadataRoute.Sitemap = (paymentHub?.spokes ?? []).map((spoke) => ({
    url: `${baseUrl}/get-paid/${spoke.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const manageJobsSpokePages: MetadataRoute.Sitemap = (manageJobsHub?.spokes ?? []).map((spoke) => ({
    url: `${baseUrl}/manage-jobs/${spoke.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const quotingSpokePages: MetadataRoute.Sitemap = (quotingHub?.spokes ?? []).map((spoke) => ({
    url: `${baseUrl}/quoting/${spoke.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const reeceSpokePages: MetadataRoute.Sitemap = (reeceIntegration?.spokes ?? []).map((spoke) => ({
    url: `${baseUrl}/integrations/reece/${spoke.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const tradePages: MetadataRoute.Sitemap = trades.map((trade) => {
    const hasVideo = TRADES_WITH_VIDEOS.has(trade.slug);
    return {
      url: `${baseUrl}/quotes-for-${trade.slug}/`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: hasVideo ? 0.85 : 0.8,
      ...(hasVideo
        ? {
            videos: [
              {
                title: xmlEscape(`${trade.name} quote demo`),
                thumbnail_loc: `${baseUrl}/assets/videos/trades/${trade.slug}-poster.jpg`,
                description: xmlEscape(`Watch a real ${trade.name.toLowerCase()} quote built in under a minute with QuoteMate.`),
                content_loc: `${baseUrl}/assets/videos/trades/${trade.slug}.mp4`,
              },
            ],
          }
        : {}),
    };
  });

  const TIER_1_CITIES = new Set(['sydney', 'melbourne', 'brisbane']);
  const TIER_2_CITIES = new Set(['perth', 'adelaide']);
  const cityPriority = (slug: string): number => {
    if (TIER_1_CITIES.has(slug)) return 0.8;
    if (TIER_2_CITIES.has(slug)) return 0.75;
    return 0.7;
  };

  const tradeCityPages: MetadataRoute.Sitemap = trades.flatMap((trade) =>
    cityPageCities.map((city) => ({
      url: `${baseUrl}/quotes-for-${trade.slug}/${city.slug}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: cityPriority(city.slug),
    }))
  );

  const templatePages: MetadataRoute.Sitemap = quoteTemplates.map((template) => {
    const hasVideo = TEMPLATES_WITH_VIDEOS.has(template.slug);
    const jobName = template.name.replace(/ Quote Template$/i, '');
    return {
      url: `${baseUrl}/templates/${template.slug}/`,
      lastModified,
      changeFrequency: 'monthly',
      priority: hasVideo ? 0.8 : 0.7,
      ...(hasVideo
        ? {
            videos: [
              {
                title: xmlEscape(`${jobName} quote demo`),
                thumbnail_loc: `${baseUrl}/assets/videos/templates/${template.slug}-poster.jpg`,
                description: xmlEscape((template.description || `${jobName} quote demo`).slice(0, 200)),
                content_loc: `${baseUrl}/assets/videos/templates/${template.slug}.mp4`,
              },
            ],
          }
        : {}),
    };
  });

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

  const alternativesPages: MetadataRoute.Sitemap = alternativePages.map((p) => ({
    url: `${baseUrl}/alternatives/${p.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const bestOfPages: MetadataRoute.Sitemap = bestPages.map((p) => ({
    url: `${baseUrl}/best/${p.slug}/`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...staticPages, ...tradePages, ...tradeCityPages, ...templatePages, ...blogPages, ...comparePages, ...alternativesPages, ...bestOfPages, ...paymentSpokePages, ...manageJobsSpokePages, ...quotingSpokePages, ...reeceSpokePages];
}
