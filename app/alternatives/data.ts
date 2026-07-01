import type { RoundupItem, RoundupContent } from '../components/RoundupArticle';
import contentRaw from '@/seo/alternatives-content.json';

const content = contentRaw as Record<string, RoundupContent>;
export function getAlternativeContent(slug: string): RoundupContent | undefined {
  return content[slug];
}

export interface AlternativePage {
  slug: string;        // competitor slug, e.g. "tradify"
  competitor: string;  // display name, e.g. "Tradify"
  title: string;       // meta title
  h1: string;
  tagline: string;
  metaDescription: string;
  competitorPricing: string;
  reasons: string[];   // why tradies look for an alternative
  items: RoundupItem[]; // QuoteMate first
}

const QUOTEMATE: RoundupItem = {
  name: 'QuoteMate',
  bestFor: 'Sole traders & small crews who want the fastest AI quoting with live Australian supplier pricing',
  pricing: 'Free plan; Pro $49/mo or $328/yr',
  isQuoteMate: true,
};

// Reusable competitor list items (linked to compare pages where one exists)
const ITEM = {
  tradify: { name: 'Tradify', slug: 'tradify', bestFor: 'Small crews needing timesheets & dispatch', pricing: 'From $48/user/mo' },
  servicem8: { name: 'ServiceM8', slug: 'servicem8', bestFor: 'iPhone-based teams wanting job cards & forms', pricing: 'Free then from $29/mo (per-job)' },
  fergus: { name: 'Fergus', slug: 'fergus', bestFor: 'Plumbing & electrical crews wanting job costing', pricing: 'From $53/mo (per-user)' },
  simpro: { name: 'simPRO', slug: 'simpro', bestFor: 'Mid-size & commercial contractors', pricing: 'Quoted per user + setup fee' },
  aroflo: { name: 'AroFlo', slug: 'aroflo', bestFor: 'Established teams needing deep supplier & compliance tools', pricing: 'From ~$45/user/mo + setup' },
  jobber: { name: 'Jobber', slug: 'jobber', bestFor: 'Small crews (best outside Australia)', pricing: 'From US$29/user/mo' },
  housecallpro: { name: 'Housecall Pro', slug: 'housecallpro', bestFor: 'US & Canada home-service businesses', pricing: 'From US$59/mo' },
  ascora: { name: 'Ascora', slug: 'ascora', bestFor: 'Growing crews on MYOB or QuickBooks', pricing: 'From $45/user/mo' },
  buildxact: { name: 'Buildxact', slug: 'buildxact', bestFor: 'Residential builders estimating off plans', pricing: 'From $169/mo' },
  invoice2go: { name: 'Invoice2go', slug: 'invoice2go', bestFor: 'Simple cross-industry invoicing', pricing: 'From ~$11/mo' },
  xero: { name: 'Xero', slug: 'xero', bestFor: 'Full accounting & BAS (pairs with QuoteMate)', pricing: 'From ~$35/mo' },
  quickbooks: { name: 'QuickBooks', slug: 'quickbooks', bestFor: 'Accounting with unlimited invoices low down', pricing: 'From ~$33/mo' },
} satisfies Record<string, RoundupItem>;

export const alternativePages: AlternativePage[] = [
  {
    slug: 'tradify',
    competitor: 'Tradify',
    title: 'Best Tradify Alternatives for Australian Tradies (2026)',
    h1: 'The Best Tradify Alternatives for Australian Tradies',
    tagline: 'Looking to switch from Tradify? Here are the best alternatives for quoting and job management, compared on price, features, and fit.',
    metaDescription: 'The best Tradify alternatives for Australian tradies in 2026. Compare QuoteMate, ServiceM8, Fergus, simPRO and AroFlo on pricing, AI quoting, supplier pricing and per-user fees.',
    competitorPricing: 'From $48/user/month, monthly only, no free plan',
    reasons: [
      'Per-user pricing that climbs every time you put on an apprentice',
      'No free plan and monthly-only billing',
      'No offline mode — a common gripe on sites with poor signal',
      'Quoting is manual, with no AI materials list or live supplier pricing',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.fergus, ITEM.aroflo, ITEM.simpro],
  },
  {
    slug: 'servicem8',
    competitor: 'ServiceM8',
    title: 'Best ServiceM8 Alternatives for Australian Tradies (2026)',
    h1: 'The Best ServiceM8 Alternatives for Australian Tradies',
    tagline: 'Switching from ServiceM8? Compare the best alternatives for quoting, Android support, and simple pricing.',
    metaDescription: 'The best ServiceM8 alternatives for Australian tradies in 2026. Compare QuoteMate, Tradify, Fergus and AroFlo on Android support, AI quoting, live supplier pricing and pricing model.',
    competitorPricing: 'Free (30 jobs) then $29–$349/month by job volume',
    reasons: [
      'The Android app has historically been weaker than the iPhone version',
      'The per-job credit model can surprise you when you get busy',
      'Add-ons stack up and inflate the monthly bill',
      'No live Australian supplier pricing — quotes are built manually',
    ],
    items: [QUOTEMATE, ITEM.tradify, ITEM.fergus, ITEM.aroflo, ITEM.ascora],
  },
  {
    slug: 'fergus',
    competitor: 'Fergus',
    title: 'Best Fergus Alternatives for Australian Tradies (2026)',
    h1: 'The Best Fergus Alternatives for Australian Tradies',
    tagline: 'Looking past Fergus? Here are the best alternatives for tradie quoting and job management, compared honestly.',
    metaDescription: 'The best Fergus alternatives for Australian tradies in 2026. Compare QuoteMate, Tradify, ServiceM8 and AroFlo on pricing, mobile app quality, AI quoting and supplier pricing.',
    competitorPricing: 'From $53/month, per-user, monthly only, no free plan',
    reasons: [
      'Per-user pricing plus regular price rises',
      'Features re-locked into higher tiers after you sign up',
      'The mobile app draws consistent complaints about slow loading',
      'Supplier price-books are static, not live, and not tied to AI quoting',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.aroflo, ITEM.simpro],
  },
  {
    slug: 'simpro',
    competitor: 'simPRO',
    title: 'Best simPRO Alternatives for Small Trade Businesses (2026)',
    h1: 'The Best simPRO Alternatives for Small Trade Businesses',
    tagline: 'simPRO too heavy for a small crew? These lighter, cheaper alternatives cover quoting and job management without the onboarding project.',
    metaDescription: 'The best simPRO alternatives for small Australian trade businesses in 2026. Compare QuoteMate, ServiceM8, Tradify, Fergus and AroFlo on price, complexity and setup.',
    competitorPricing: 'Quoted per user plus a large one-off implementation fee',
    reasons: [
      'Priced per user with a significant upfront implementation cost',
      'Multi-year commitments and steep learning curve',
      'Far more platform than a sole trader or small crew needs',
      'Long onboarding before you can send your first quote',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.aroflo],
  },
  {
    slug: 'aroflo',
    competitor: 'AroFlo',
    title: 'Best AroFlo Alternatives for Sole Traders & Small Crews (2026)',
    h1: 'The Best AroFlo Alternatives for Sole Traders & Small Crews',
    tagline: 'AroFlo built for a bigger operation than yours? Here are simpler, cheaper alternatives for quoting and getting paid.',
    metaDescription: 'The best AroFlo alternatives for Australian sole traders and small crews in 2026. Compare QuoteMate, ServiceM8, Tradify and Fergus on price, setup fees and ease of use.',
    competitorPricing: 'From ~$45/user/month plus a $899–$2,900 onboarding fee',
    reasons: [
      'Per-user pricing with a three-user minimum on the full product',
      'One-off onboarding fees commonly $899–$2,900',
      'Powerful but complex — built for teams with dedicated admin',
      'The full product is aimed above the sole trader and micro crew',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.ascora],
  },
  {
    slug: 'jobber',
    competitor: 'Jobber',
    title: 'Best Jobber Alternatives for Australian Tradies (2026)',
    h1: 'The Best Jobber Alternatives for Australian Tradies',
    tagline: 'Jobber not built for Australia? These alternatives handle AUD pricing, GST and in-person payments properly.',
    metaDescription: 'The best Jobber alternatives for Australian tradies in 2026. Compare QuoteMate, ServiceM8, Tradify and Fergus on AUD pricing, GST handling, in-person payments and supplier pricing.',
    competitorPricing: 'From US$29/user/month, billed in US dollars',
    reasons: [
      'Billed in US dollars with no genuine Australian-dollar plan',
      'No native in-person card payments in Australia',
      'GST is a manual setup rather than automatic',
      'No live Australian supplier pricing',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.aroflo],
  },
  {
    slug: 'housecallpro',
    competitor: 'Housecall Pro',
    title: 'Best Housecall Pro Alternatives in Australia (2026)',
    h1: 'The Best Housecall Pro Alternatives in Australia',
    tagline: 'Housecall Pro does not really work in Australia. Here are the local alternatives built for GST, Xero and Aussie payments.',
    metaDescription: 'The best Housecall Pro alternatives for Australian tradies in 2026. Compare QuoteMate, ServiceM8, Tradify and Fergus on Australian availability, GST, Xero and in-person payments.',
    competitorPricing: 'From US$59/month, focused on the US and Canada',
    reasons: [
      'Built for the US and Canada, with no proper Australian sign-up',
      'No GST handling and no Xero integration',
      'Priced in US dollars',
      'Payment rails do not operate in Australia',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.jobber],
  },
  {
    slug: 'invoice2go',
    competitor: 'Invoice2go',
    title: 'Best Invoice2go Alternatives for Australian Tradies (2026)',
    h1: 'The Best Invoice2go Alternatives for Australian Tradies',
    tagline: 'Outgrowing Invoice2go? These alternatives add real quoting, supplier pricing and job management to the invoicing you already do.',
    metaDescription: 'The best Invoice2go alternatives for Australian tradies in 2026. Compare QuoteMate, Xero, ServiceM8 and QuickBooks on quoting, supplier pricing, job management and getting paid.',
    competitorPricing: 'From ~$11/month, invoicing only, with invoice caps on lower tiers',
    reasons: [
      'Invoicing only — no AI quoting, supplier pricing or job pipeline',
      'Invoice caps on the cheaper plans',
      'Reports of held payouts and renewal price rises',
      'Not built specifically for Australian trades',
    ],
    items: [QUOTEMATE, ITEM.servicem8, ITEM.xero, ITEM.quickbooks, ITEM.tradify],
  },
  {
    slug: 'xero',
    competitor: 'Xero',
    title: 'Best Xero Alternatives (and Companions) for Tradies (2026)',
    h1: 'The Best Xero Alternatives & Companions for Tradies',
    tagline: 'Xero is great for the books but not for quoting on site. Here is what tradies use for quoting, plus how it pairs with Xero.',
    metaDescription: 'The best Xero alternatives and companion apps for Australian tradies in 2026. Compare QuoteMate, MYOB, QuickBooks and Invoice2go for on-site quoting, invoicing and accounting.',
    competitorPricing: 'From ~$35/month; accounting software, not a trade quoting app',
    reasons: [
      'Accounting-first — no AI materials list or live supplier pricing',
      'Not built for quoting on site from your phone',
      'Invoice caps on the entry plan',
      'No trade job pipeline (inquiry to paid)',
    ],
    items: [QUOTEMATE, ITEM.quickbooks, ITEM.invoice2go, ITEM.servicem8, ITEM.tradify],
  },
];

export function getAlternativeBySlug(slug: string): AlternativePage | undefined {
  return alternativePages.find(p => p.slug === slug);
}
