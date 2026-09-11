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

// Titles and descriptions follow the queries Search Console shows each page
// for, which are category terms ("job management software", "plumbing
// software", "quoting and invoicing software"), not "best of" searches.
export const bestPages: BestPage[] = [
  {
    slug: 'quoting-app-for-tradies',
    title: 'Quoting Apps for Tradies: 6 Job Quoting Apps Compared (2026)',
    h1: 'Quoting Apps for Australian Tradies',
    tagline: 'A quoting app earns its keep on one thing: an accurate, itemised quote sent while you are still on site. Six job quoting apps compared on speed, supplier pricing, GST and what they cost a sole trader.',
    metaDescription: 'Quoting apps for tradies compared: QuoteMate, Tradify, ServiceM8, Fergus, Buildxact and Quotient on quote speed, live Australian supplier pricing, GST and real cost for one person or a small crew.',
    category: 'quoting app for Australian tradies',
    items: [
      { ...QUOTEMATE, bestFor: 'Sole traders and small crews: itemised quote in under 2 minutes, live supplier prices' },
      ITEM.tradify, ITEM.servicem8, ITEM.fergus, ITEM.buildxact, ITEM.quotient,
    ],
  },
  {
    slug: 'invoicing-app-for-tradies',
    title: 'Quoting and Invoicing Software for Tradies: 6 Apps Compared (2026)',
    h1: 'Quoting and Invoicing Software for Australian Tradies',
    tagline: 'One app for the quote, the invoice and the payment, or a quoting app beside an accounting package? The six options Australian tradies actually run, with GST, tap-to-pay fees and monthly cost spelled out.',
    metaDescription: 'Quoting and invoicing software for Australian tradies compared: QuoteMate, Invoice2go, Xero, MYOB, QuickBooks and Rounded on quote-to-invoice speed, GST, tap-to-pay fees and monthly cost.',
    category: 'invoicing app for Australian tradies',
    items: [
      { ...QUOTEMATE, bestFor: 'Tradies who quote: accepted quote becomes the invoice in one tap, paid on site' },
      ITEM.invoice2go, ITEM.xero, ITEM.myob, ITEM.quickbooks, ITEM.rounded,
    ],
  },
  {
    slug: 'job-management-software-for-tradies',
    title: 'Job Management Software for Tradies: 6 Apps Compared (2026)',
    h1: 'Job Management Software for Australian Tradies',
    tagline: 'What job management software actually does for a one-person or small-crew trade business, what the six main Australian options cost, and which fits. Honest about where a quoting-first app stops and the bigger systems start.',
    metaDescription: 'Job management software for Australian tradies compared: QuoteMate, ServiceM8, Tradify, Fergus, AroFlo and simPRO on quoting, scheduling, pricing model and real monthly cost for a one or three-person crew.',
    category: 'job management software for Australian tradies',
    items: [
      { ...QUOTEMATE, bestFor: 'Sole traders: 2-minute quotes plus a simple job pipeline, flat fee' },
      ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.aroflo, ITEM.simpro,
    ],
  },
  {
    slug: 'tradie-app-australia',
    title: 'Tradie Apps in Australia: The 5 That Run a Trade Business (2026)',
    h1: 'Tradie Apps in Australia',
    tagline: 'There are dozens of apps for tradies. Five of them actually run an Australian trade business: quoting, jobs, invoicing, accounts and getting paid. What each is for, what it costs, and the two most sole traders end up on.',
    metaDescription: 'Tradie apps in Australia compared: QuoteMate, ServiceM8, Tradify, Fergus and Xero. What each does for a sole trader or small crew, real monthly cost, and which two you actually need.',
    category: 'app for Australian tradies',
    items: [
      { ...QUOTEMATE, bestFor: 'Quoting, invoicing and getting paid on site for sole traders and small crews' },
      ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.xero,
    ],
  },
  {
    slug: 'app-for-electricians',
    title: 'Electrician Software and Apps in Australia: 6 Compared (2026)',
    h1: 'Electrician Software and Apps in Australia',
    tagline: 'Software for electricians has to price a switchboard upgrade properly, carry the compliance line items, and get you paid on site. Six Australian options compared, from a sole-trader quoting app to commercial contractor platforms.',
    metaDescription: 'Electrician software and apps compared for Australian electrical contractors: QuoteMate, ServiceM8, Tradify, Fergus, simPRO and AroFlo on quoting, AS/NZS 3000 compliance line items, job costing and cost.',
    category: 'app for Australian electricians',
    items: [
      { ...QUOTEMATE, bestFor: 'Sole-trader sparkies: per-point or hourly quotes with compliance items built in' },
      ITEM.servicem8, ITEM.tradify, ITEM.fergus, ITEM.simpro, ITEM.aroflo,
    ],
  },
  {
    slug: 'app-for-plumbers',
    title: 'Plumbing Software for Australian Plumbers: 6 Apps Compared (2026)',
    h1: 'Plumbing Software for Australian Plumbers',
    tagline: 'The plumbing software that quotes at your real Reece trade prices, invoices from the van and gets you paid on site, compared with the job-management and estimating platforms plumbers also ask about.',
    metaDescription: 'Plumbing software compared for Australian plumbers: QuoteMate (live Reece maX prices), Fergus, ServiceM8, AroFlo, Tradify and Buildxact on quoting, invoicing, job costing and monthly cost.',
    category: 'app for Australian plumbers',
    items: [
      { ...QUOTEMATE, bestFor: 'Plumbers and gasfitters: quotes at your real Reece maX trade prices, order from the quote' },
      ITEM.fergus, ITEM.servicem8, ITEM.aroflo, ITEM.tradify, ITEM.buildxact,
    ],
  },
];

export function getBestBySlug(slug: string): BestPage | undefined {
  return bestPages.find(p => p.slug === slug);
}
