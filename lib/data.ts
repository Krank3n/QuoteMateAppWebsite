import rawData from '@/seo/data.json';

export interface Trade {
  slug: string;
  name: string;
  singular: string;
  keyword: string;
  icon: string;
  description: string;
  heroTitle: string;
  painPoint: string;
  features: string[];
  commonJobs: (string | { name: string; desc: string })[];
  avgQuoteRange: string;
  templateSnippet: string;
}

export interface City {
  slug: string;
  name: string;
  state: string;
  population: string;
  description: string;
  localNote: string;
}

export interface QuoteTemplate {
  slug: string;
  name: string;
  trade: string;
  keyword: string;
  description: string;
  materials: string[];
  steps: string[];
}

export interface GuideSection {
  heading: string;
  body: string;
}

export interface Guide {
  slug: string;
  title: string;
  trade: string;
  keyword: string;
  description: string;
  relatedTemplate: string;
  sections: GuideSection[];
  tips: string[];
  datePublished?: string;
  dateModified?: string;
}

export interface SiteData {
  url: string;
  name: string;
  tagline: string;
  appStoreUrl: string;
  playStoreUrl: string;
  webAppUrl: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

const data = rawData as unknown as {
  site: SiteData;
  trades: Trade[];
  cities: City[];
  quoteTemplates: QuoteTemplate[];
  guides: Guide[];
  faqData?: FAQ[];
};

export const { site, trades, cities, quoteTemplates, guides } = data;
export const faqData: FAQ[] = data.faqData || [];

export function getTradeFAQs(trade: Trade): FAQ[] {
  return [
    {
      question: `How does QuoteMate help ${trade.name.toLowerCase()}?`,
      answer: `QuoteMate is an AI-powered quoting app that helps ${trade.name.toLowerCase()} create professional quotes in under 2 minutes. Describe any ${trade.keyword.toLowerCase()} job, and the AI suggests materials with real-time pricing from major Australian suppliers. Send branded PDF quotes via email, SMS, or WhatsApp.`,
    },
    {
      question: `What ${trade.keyword.toLowerCase()} jobs can I quote with QuoteMate?`,
      answer: `QuoteMate covers all types of ${trade.keyword.toLowerCase()} jobs including ${trade.commonJobs.map(j => typeof j === 'string' ? j : j.name).join(', ')}. You can also describe any custom job and the AI will suggest appropriate materials and quantities.`,
    },
    {
      question: `How much do ${trade.name.toLowerCase()} typically quote?`,
      answer: `${trade.name} typically quote between ${trade.avgQuoteRange} depending on the scope of work. QuoteMate ensures every quote is accurate with real-time material pricing and proper GST calculations.`,
    },
    {
      question: `Is QuoteMate free for ${trade.name.toLowerCase()}?`,
      answer: `QuoteMate offers a free 7-day trial so you can create quotes immediately — no credit card required. Pro plans start at $29/month or $199/year (save 43%) for unlimited quotes, invoicing, and all premium features.`,
    },
  ];
}

export function getTradeBySlug(slug: string): Trade | undefined {
  return trades.find(t => t.slug === slug);
}

export function getCityBySlug(slug: string): City | undefined {
  return cities.find(c => c.slug === slug);
}

export function getTemplateBySlug(slug: string): QuoteTemplate | undefined {
  return quoteTemplates.find(t => t.slug === slug);
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return guides.find(g => g.slug === slug);
}

export function getTemplatesForTrade(tradeSlug: string): QuoteTemplate[] {
  return quoteTemplates.filter(t => t.trade === tradeSlug);
}
