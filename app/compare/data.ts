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
    slug: 'chatgpt',
    name: 'ChatGPT (and other AI chatbots)',
    tagline: 'Why ChatGPT, Gemini and Claude can\'t replace a real quoting app for Australian tradies.',
    description: 'ChatGPT, Google Gemini, Microsoft Copilot, and Anthropic Claude are general-purpose AI chatbots. Tradies sometimes paste a job description in and ask for a "quote", but the result is a chat reply — not a branded PDF, not an invoice, and not grounded in current Australian supplier pricing.',
    pricing: 'ChatGPT Plus, Gemini Advanced, and Claude Pro are each ~$30 AUD/month — and you still need a separate quoting app to actually send the quote.',
    features: [
      { name: 'Generates a job description', quotemate: 'AI-assisted, voice-to-text', competitor: true },
      { name: 'Live, accurate supplier prices (Bunnings, Reece, Tradelink, etc.)', quotemate: true, competitor: 'Hallucinated / outdated' },
      { name: 'Consistent output between runs', quotemate: 'Reusable templates', competitor: 'Different every time' },
      { name: 'Branded PDF quote with your logo & ABN', quotemate: true, competitor: false },
      { name: 'Convert quote to invoice in one tap', quotemate: true, competitor: false },
      { name: 'Customer can accept the quote from email', quotemate: true, competitor: false },
      { name: 'Take card payment on-site (tap-to-pay)', quotemate: true, competitor: false },
      { name: 'Send Australian payment links (PayID, BPAY, bank transfer)', quotemate: true, competitor: false },
      { name: 'Push to Xero', quotemate: true, competitor: false },
      { name: 'Auto GST & ABN handling', quotemate: 'Built in', competitor: 'Manual, prone to error' },
      { name: 'Track sent / accepted / paid status', quotemate: true, competitor: false },
      { name: 'Works offline on remote sites', quotemate: true, competitor: false },
      { name: 'Pricing', quotemate: 'Free or $29/month Pro', competitor: '~$30/month + still need a quoting app' },
    ],
    summary: 'A general-purpose chatbot can help you brainstorm a job description, but it can\'t produce a quote you can stand behind on a contract. The prices are hallucinated, the output changes every time you ask, and there\'s no PDF, no payment, and no Xero. QuoteMate uses AI in the same way (describe a job, get a materials list) but grounds every line item in live Australian supplier pricing, produces a branded PDF, and gives you one-tap invoicing, payment, and Xero sync. If you want AI to help you quote, use AI built into a quoting app — not a chatbot.',
  },
  {
    slug: 'spreadsheets',
    name: 'Excel & Google Sheets',
    tagline: 'See why a spreadsheet quote leaks money on every job.',
    description: 'Many tradies still quote in Excel, Google Sheets, or Numbers. It works for the first 10 jobs, but it doesn\'t scale: prices go stale, GST gets miscalculated, the file lives on one laptop, and you can\'t take payment from a spreadsheet.',
    pricing: 'Excel ~$9.95/month for Microsoft 365, Google Sheets free with a Google account.',
    features: [
      { name: 'Branded PDF quotes', quotemate: true, competitor: 'Manual setup' },
      { name: 'AI material list generation', quotemate: true, competitor: false },
      { name: 'Live supplier pricing (auto-updates)', quotemate: true, competitor: false },
      { name: 'Reusable templates', quotemate: 'Built in', competitor: 'Copy/paste a file' },
      { name: 'Quote-to-invoice conversion', quotemate: 'One tap', competitor: 'Manual rewrite' },
      { name: 'Track sent / accepted / paid', quotemate: true, competitor: false },
      { name: 'GST & ABN handling', quotemate: 'Automatic', competitor: 'Manual formulas' },
      { name: 'Online quote acceptance', quotemate: true, competitor: false },
      { name: 'Take card payment on-site', quotemate: true, competitor: false },
      { name: 'Xero integration', quotemate: 'One-tap sync', competitor: 'Manual export' },
      { name: 'Works on phone on-site', quotemate: 'Native app', competitor: 'Awkward on mobile' },
    ],
    summary: 'A spreadsheet is fine until you realise your prices are six months stale, your last quote went out without GST, and your customer has nowhere to pay it. QuoteMate gives you all the flexibility of a spreadsheet (custom line items, your own labour rates, your own markup) but adds AI material generation, live supplier pricing, branded PDFs, online acceptance, payment links, and Xero sync. Tradies who switch from spreadsheets typically save 1–3 hours per quote and start charging GST correctly.',
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
