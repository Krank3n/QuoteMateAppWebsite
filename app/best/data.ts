import type { RoundupItem, RoundupContent } from '../components/RoundupArticle';
import contentRaw from '@/seo/best-content.json';

const content = contentRaw as Record<string, RoundupContent>;
export function getBestContent(slug: string): RoundupContent | undefined {
  return content[slug];
}

export interface BestPage {
  slug: string;      // e.g. "quoting-app-for-tradies"
  title: string;     // meta title
  h1: string;
  tagline: string;
  metaDescription: string;
  category: string;  // used in the generation prompt, e.g. "quoting app for tradies"
  items: RoundupItem[]; // ranked, QuoteMate first
}

const QUOTEMATE: RoundupItem = {
  name: 'QuoteMate',
  bestFor: 'Fast AI quoting with live Australian supplier pricing',
  pricing: 'Free plan; Pro $49/mo or $328/yr',
  isQuoteMate: true,
};

const ITEM = {
  tradify: { name: 'Tradify', slug: 'tradify', bestFor: 'Small crews needing timesheets & dispatch', pricing: 'From $48/user/mo' },
  servicem8: { name: 'ServiceM8', slug: 'servicem8', bestFor: 'iPhone teams wanting job cards & forms', pricing: 'Free then from $29/mo' },
  fergus: { name: 'Fergus', slug: 'fergus', bestFor: 'Plumbing & electrical job costing', pricing: 'From $53/mo' },
  simpro: { name: 'simPRO', slug: 'simpro', bestFor: 'Mid-size & commercial contractors', pricing: 'Quoted per user + setup' },
  aroflo: { name: 'AroFlo', slug: 'aroflo', bestFor: 'Deep supplier & compliance tools', pricing: 'From ~$45/user/mo + setup' },
  buildxact: { name: 'Buildxact', slug: 'buildxact', bestFor: 'Builders estimating off plans', pricing: 'From $169/mo' },
  quotient: { name: 'Quotient', slug: 'quotient', bestFor: 'Simple cross-industry online quotes', pricing: 'From US$28/mo' },
  invoice2go: { name: 'Invoice2go', slug: 'invoice2go', bestFor: 'Simple cross-industry invoicing', pricing: 'From ~$11/mo' },
  xero: { name: 'Xero', slug: 'xero', bestFor: 'Full accounting & BAS', pricing: 'From ~$35/mo' },
  myob: { name: 'MYOB', slug: 'myob', bestFor: 'Accounting with a sole-trader app', pricing: 'From ~$11/mo' },
  quickbooks: { name: 'QuickBooks', slug: 'quickbooks', bestFor: 'Accounting with unlimited invoices', pricing: 'From ~$33/mo' },
  rounded: { name: 'Rounded', bestFor: 'Sole-trader invoicing & BAS', pricing: 'From $23.95/mo' },
  hnry: { name: 'Hnry', bestFor: 'Hands-off tax, GST & invoicing', pricing: '1% of income, capped' },
} satisfies Record<string, RoundupItem>;

export const bestPages: BestPage[] = [
  {
    slug: 'quoting-app-for-tradies',
    title: 'The Best Quoting App for Australian Tradies (2026)',
    h1: 'The Best Quoting App for Australian Tradies',
    tagline: 'We compared the main quoting and job-management apps on speed, supplier pricing, and price. Here is how they stack up for a sole trader or small crew.',
    metaDescription: 'The best quoting apps for Australian tradies in 2026, compared. QuoteMate, Tradify, ServiceM8, Fergus, Buildxact and Quotient rated on AI quoting, live supplier pricing and cost.',
    category: 'quoting app for Australian tradies',
    items: [QUOTEMATE, ITEM.tradify, ITEM.servicem8, ITEM.fergus, ITEM.buildxact, ITEM.quotient],
  },
  {
    slug: 'invoicing-app-for-tradies',
    title: 'The Best Invoicing App for Australian Tradies (2026)',
    h1: 'The Best Invoicing App for Australian Tradies',
    tagline: 'From simple invoicing to full accounting, here are the best ways for an Aussie tradie to invoice and get paid — with GST handled properly.',
    metaDescription: 'The best invoicing apps for Australian tradies in 2026. Compare QuoteMate, Invoice2go, Xero, MYOB, QuickBooks and Rounded on quoting, GST, payments and price.',
    category: 'invoicing app for Australian tradies',
    items: [QUOTEMATE, ITEM.invoice2go, ITEM.xero, ITEM.myob, ITEM.quickbooks, ITEM.rounded],
  },
  {
    slug: 'job-management-software-for-tradies',
    title: 'The Best Job Management Software for Australian Tradies (2026)',
    h1: 'The Best Job Management Software for Australian Tradies',
    tagline: 'Quoting is only half the job. Here are the best tools to run every job from inquiry to paid, compared on price and complexity.',
    metaDescription: 'The best job management software for Australian tradies in 2026. Compare QuoteMate, ServiceM8, Tradify, Fergus, AroFlo and simPRO on features, pricing model and fit.',
    category: 'job management software for Australian tradies',
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.aroflo, ITEM.simpro],
  },
  {
    slug: 'tradie-app-australia',
    title: 'The Best Tradie App in Australia (2026)',
    h1: 'The Best Tradie Apps in Australia',
    tagline: 'The apps Australian tradies actually use to quote, manage jobs, and get paid — rated for sole traders and small crews.',
    metaDescription: 'The best tradie apps in Australia for 2026. Compare QuoteMate, ServiceM8, Tradify, Fergus and Xero on quoting, job management, GST and getting paid.',
    category: 'app for Australian tradies',
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.xero],
  },
  {
    slug: 'app-for-electricians',
    title: 'The Best App for Electricians in Australia (2026)',
    h1: 'The Best Apps for Electricians in Australia',
    tagline: 'From quoting a switchboard upgrade to getting paid on site, here are the best apps for Australian electricians and electrical contractors.',
    metaDescription: 'The best apps for electricians in Australia in 2026. Compare QuoteMate, ServiceM8, Tradify, Fergus, simPRO and AroFlo on quoting, supplier pricing and job management.',
    category: 'app for Australian electricians',
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.simpro, ITEM.aroflo],
  },
  {
    slug: 'app-for-plumbers',
    title: 'The Best App for Plumbers in Australia (2026)',
    h1: 'The Best Apps for Plumbers in Australia',
    tagline: 'Quote off live Reece and Tradelink pricing, manage the job, and get paid. Here are the best apps for Australian plumbers.',
    metaDescription: 'The best apps for plumbers in Australia in 2026. Compare QuoteMate, Fergus, ServiceM8, AroFlo, Tradify and Buildxact on Reece pricing, quoting and job management.',
    category: 'app for Australian plumbers',
    items: [QUOTEMATE, ITEM.fergus, ITEM.servicem8, ITEM.aroflo, ITEM.tradify, ITEM.buildxact],
  },
];

export function getBestBySlug(slug: string): BestPage | undefined {
  return bestPages.find(p => p.slug === slug);
}
