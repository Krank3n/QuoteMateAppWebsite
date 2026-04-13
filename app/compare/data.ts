export interface Competitor {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricing: string;
  features: { name: string; quotemate: boolean | string; competitor: boolean | string }[];
  summary: string;
}

export const competitors: Competitor[] = [
  {
    slug: 'tradify',
    name: 'Tradify',
    tagline: 'Compare quoting features, pricing, and ease of use for Australian tradies.',
    description: 'Tradify is a job management platform for trade businesses covering quoting, scheduling, timesheets, and invoicing.',
    pricing: 'Tradify starts at $35/user/month with per-user pricing that scales up for teams.',
    features: [
      { name: 'AI-powered quoting', quotemate: true, competitor: false },
      { name: 'Real-time supplier pricing', quotemate: true, competitor: false },
      { name: 'Professional PDF quotes', quotemate: true, competitor: true },
      { name: 'Invoicing', quotemate: true, competitor: true },
      { name: 'Job scheduling', quotemate: false, competitor: true },
      { name: 'Timesheets', quotemate: false, competitor: true },
      { name: 'Offline mode', quotemate: true, competitor: false },
      { name: 'Voice-to-text quoting', quotemate: true, competitor: false },
      { name: 'Flat pricing (no per-user fees)', quotemate: '$29/month', competitor: '$35/user/month' },
      { name: 'Free plan available', quotemate: true, competitor: false },
    ],
    summary: 'Tradify is a solid job management platform for larger teams that need scheduling and timesheets. QuoteMate is the better choice if your priority is fast, accurate quoting with AI-powered material suggestions and real-time supplier pricing — at a fraction of the cost.',
  },
  {
    slug: 'servicem8',
    name: 'ServiceM8',
    tagline: 'See how QuoteMate and ServiceM8 compare for quoting and invoicing.',
    description: 'ServiceM8 is a field service management app covering job management, quoting, scheduling, invoicing, and client communication.',
    pricing: 'ServiceM8 plans range from $0 to $379/month depending on job volume and features.',
    features: [
      { name: 'AI-powered quoting', quotemate: true, competitor: false },
      { name: 'Real-time supplier pricing', quotemate: true, competitor: false },
      { name: 'Professional PDF quotes', quotemate: true, competitor: true },
      { name: 'Invoicing', quotemate: true, competitor: true },
      { name: 'Job scheduling & dispatch', quotemate: false, competitor: true },
      { name: 'Client communication (SMS/email)', quotemate: 'Share via SMS/email/WhatsApp', competitor: true },
      { name: 'Offline mode', quotemate: true, competitor: true },
      { name: 'Voice-to-text quoting', quotemate: true, competitor: false },
      { name: 'Simple flat pricing', quotemate: '$29/month', competitor: '$0–$379/month' },
      { name: 'Australian supplier integration', quotemate: 'Major suppliers', competitor: false },
    ],
    summary: 'ServiceM8 is a comprehensive field service platform ideal for businesses managing crews and complex scheduling. QuoteMate is purpose-built for fast, accurate quoting — describe any job and get an AI-generated materials list with live supplier pricing, all for a simple flat rate.',
  },
  {
    slug: 'fergus',
    name: 'Fergus',
    tagline: 'Compare QuoteMate and Fergus for tradie quoting and job management.',
    description: 'Fergus is a job management platform designed for trade businesses, offering quoting, scheduling, timesheets, purchase orders, and invoicing.',
    pricing: 'Fergus pricing starts at $55/month for basic features, scaling up for larger teams.',
    features: [
      { name: 'AI-powered quoting', quotemate: true, competitor: false },
      { name: 'Real-time supplier pricing', quotemate: true, competitor: false },
      { name: 'Professional PDF quotes', quotemate: true, competitor: true },
      { name: 'Invoicing', quotemate: true, competitor: true },
      { name: 'Job scheduling', quotemate: false, competitor: true },
      { name: 'Purchase orders', quotemate: false, competitor: true },
      { name: 'Offline mode', quotemate: true, competitor: false },
      { name: 'Voice-to-text quoting', quotemate: true, competitor: false },
      { name: 'Flat pricing', quotemate: '$29/month', competitor: 'From $55/month' },
      { name: 'Free plan available', quotemate: true, competitor: false },
    ],
    summary: 'Fergus offers deep job management features including purchase orders and detailed job costing. QuoteMate wins on speed and simplicity — create accurate quotes with AI material suggestions and real-time pricing in under 2 minutes, at about half the monthly cost.',
  },
  {
    slug: 'invoice2go',
    name: 'Invoice2go',
    tagline: 'Compare quoting and invoicing features between QuoteMate and Invoice2go.',
    description: 'Invoice2go is a general-purpose invoicing app used across many industries, offering estimates, invoices, and payment tracking.',
    pricing: 'Invoice2go starts at $5.99/month for basic invoicing, up to $39.99/month for the premium plan.',
    features: [
      { name: 'AI-powered quoting', quotemate: true, competitor: false },
      { name: 'Real-time supplier pricing', quotemate: true, competitor: false },
      { name: 'Trade-specific templates', quotemate: true, competitor: false },
      { name: 'Professional PDF quotes', quotemate: true, competitor: true },
      { name: 'Invoicing', quotemate: true, competitor: true },
      { name: 'Payment tracking', quotemate: true, competitor: true },
      { name: 'Offline mode', quotemate: true, competitor: false },
      { name: 'Built for Australian tradies', quotemate: true, competitor: false },
      { name: 'GST calculations', quotemate: 'Automatic', competitor: 'Manual setup' },
      { name: 'Voice-to-text quoting', quotemate: true, competitor: false },
    ],
    summary: 'Invoice2go is a capable general invoicing tool, but it\'s not built for tradies. QuoteMate understands trade jobs, suggests materials automatically, and integrates with Australian suppliers — making it faster and more accurate for quoting construction and trade work.',
  },
];

export function getCompetitorBySlug(slug: string): Competitor | undefined {
  return competitors.find(c => c.slug === slug);
}
