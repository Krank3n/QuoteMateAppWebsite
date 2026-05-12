import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import FAQ from '../components/FAQ';
import CTAButtons from '../components/CTAButtons';

const url = 'https://quotemateapp.au/shower-quoting-tool';
const title = 'Shower Quoting Tool — Free for Aussie Tradies | QuoteMate';
const description = 'Quote shower jobs in 2 minutes — waterproofing, tiles, screens, mixers, niches, drainage. AI-powered shower quoting tool for Australian tilers, plumbers and bathroom renovators.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  keywords: [
    'shower quoting tool',
    'shower quote calculator',
    'shower installation quote',
    'bathroom shower quote',
    'shower screen quote tool',
    'shower renovation quote app Australia',
  ],
  openGraph: {
    type: 'website',
    url,
    title,
    description,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
};

const CheckSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

const coverage = [
  'Waterproofing membrane (AS 3740)',
  'Wall and floor tile supply + lay',
  'Screen-to-floor fall and drainage',
  'Frameless, semi-frameless and framed shower screens',
  'Mixers, rails, rose heads and diverters',
  'Niches, hobs and recessed shelving',
  'Demolition, removal and skip hire',
  'Plumbing rough-in and connection',
];

const audiences = [
  { name: 'Tilers', desc: 'Quote tile supply, waterproofing, fall to drain, niches and grout finishes — fast.' },
  { name: 'Plumbers', desc: 'Quote shower mixer installs, wastes, hot/cold rough-in and screen waterproofing seal.' },
  { name: 'Bathroom Renovators', desc: 'Bundle shower demolition, waterproofing, tiling, screens and fixtures into one quote.' },
  { name: 'Builders', desc: 'Quote new-build showers across multiple ensuites or units with consistent line items.' },
];

const faqItems = [
  {
    question: 'Is the shower quoting tool actually free?',
    answer: 'Yes — QuoteMate has a free plan forever (customers pay online via Square, small platform fee added to their bill) plus a 14-day Pro trial with full access. No credit card required. Pro starts at $29/month and unlocks bank/PayID/BPAY/PayPal options plus a lower Square rate.',
  },
  {
    question: 'Does it cover frameless shower screens?',
    answer: 'Yes. Quote frameless, semi-frameless and framed screens with glass thickness, hinge type, wall channels, and waterproofing seal. Pricing pulls from major Australian glass and hardware suppliers.',
  },
  {
    question: 'Can it handle a full shower replacement quote?',
    answer: 'Yes. Describe the scope — for example, "demo existing shower, re-waterproof, tile 4sqm of walls and 1.2sqm of floor, supply and install frameless screen and chrome rail mixer" — and the AI itemises every line including labour, materials and GST.',
  },
  {
    question: 'How accurate is the material pricing?',
    answer: 'QuoteMate uses real-time pricing feeds from major Australian suppliers (Reece, Tradelink, Bunnings and others depending on category). You can override any line with your own trade pricing before sending.',
  },
  {
    question: 'Can I send the quote directly to the homeowner?',
    answer: 'Yes — generate a branded PDF and send it via email, SMS or WhatsApp directly from your phone. Clients can accept and sign the quote digitally.',
  },
  {
    question: 'Do I need to be a plumber or a tiler to use it?',
    answer: 'No. The tool is built for any Australian tradie or renovator quoting shower work. The AI scopes the job from your description and you can edit any line item.',
  },
];

export default function ShowerQuotingToolPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Shower Quoting Tool' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Shower Quoting Tool</span>
              <h1 className="seo-hero-title">Quote a Shower in 2 Minutes</h1>
              <p className="seo-hero-subtitle">QuoteMate is the shower quoting tool for Australian tilers, plumbers and bathroom renovators. Describe the job — the AI itemises waterproofing, tiles, screens, fixtures and labour with live supplier pricing.</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-pain-point">
          <div className="container">
            <div className="pain-point-card">
              <h2>The Problem</h2>
              <p>Shower quotes are fiddly. Waterproofing, fall to drain, screen sizing, niches, mixers and tile waste — miss one line and the job loses money. Most tradies still build shower quotes line-by-line in a notebook or a half-broken spreadsheet, and homeowners are stuck waiting days for a number.</p>
            </div>
          </div>
        </section>

        <section className="seo-features">
          <div className="container">
            <h2 className="section-title">What the Shower Quoting Tool Covers</h2>
            <div className="seo-features-grid">
              {coverage.map((item) => (
                <div key={item} className="seo-feature-item">
                  <CheckSvg />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-example">
          <div className="container">
            <h2 className="section-title">See It in Action</h2>
            <div className="example-card">
              <div className="example-prompt">
                <span className="example-label">You type</span>
                <p>&ldquo;Replace existing shower — demo, re-waterproof, tile 4sqm walls + 1.2sqm floor, supply and install 1200mm frameless screen and chrome rail mixer.&rdquo;</p>
              </div>
              <div className="example-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
              <div className="example-result">
                <span className="example-label">QuoteMate generates</span>
                <p>A complete itemised shower quote — demolition, waste removal, AS 3740 waterproofing, screed and fall, tile supply with 10% waste, adhesive and grout, frameless screen with hinges and channels, chrome mixer and rose, plumbing connection, labour, GST, and a branded PDF ready to send. Typical shower quotes range from $3,500 – $12,000.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="seo-common-jobs">
          <div className="container">
            <h2 className="section-title">Built for Aussie Trades</h2>
            <div className="jobs-grid">
              {audiences.map((aud) => (
                <div key={aud.name} className="job-card">
                  <h3>{aud.name}</h3>
                  <p>{aud.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={faqItems} />
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>Related Trades</h3>
                <ul>
                  <li><Link href="/quotes-for-tilers">Tilers Quoting App</Link></li>
                  <li><Link href="/quotes-for-plumbers">Plumbers Quoting App</Link></li>
                  <li><Link href="/quotes-for-builders">Builders Quoting App</Link></li>
                  <li><Link href="/quotes-for-glaziers">Glaziers Quoting App</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>Related Templates</h3>
                <ul>
                  <li><Link href="/templates/bathroom-renovation-quote-template">Bathroom Renovation Quote Template</Link></li>
                  <li><Link href="/templates/bathroom-tiling-quote-template">Bathroom Tiling Quote Template</Link></li>
                  <li><Link href="/templates/shower-screen-quote-template">Shower Screen Quote Template</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>More from QuoteMate</h3>
                <ul>
                  <li><Link href="/templates">All Quote Templates</Link></li>
                  <li><Link href="/trades">All Trades</Link></li>
                  <li><Link href="/pricing">Pricing</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Structured Data - FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })}} />

      {/* Structured Data - SoftwareApplication */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'QuoteMate Shower Quoting Tool',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'iOS, Android, Web',
        description,
        url,
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'AUD', name: 'Free' },
          { '@type': 'Offer', price: '29', priceCurrency: 'AUD', name: 'Pro', billingIncrement: 'month' },
        ],
        provider: {
          '@type': 'Organization',
          name: 'QuoteMate',
          url: 'https://quotemateapp.au',
          areaServed: { '@type': 'Country', name: 'Australia' },
        },
      })}} />
    </>
  );
}
