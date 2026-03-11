import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import FAQ from '../components/FAQ';
import CTAButtons from '../components/CTAButtons';
import { trades, cities, getTradeBySlug, getTemplatesForTrade, getTradeFAQs } from '@/lib/data';

interface Props {
  params: Promise<{ tradeSlug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return trades.map((trade) => ({ tradeSlug: `quotes-for-${trade.slug}` }));
}

function parseTradeSlug(slug: string) {
  return slug.replace(/^quotes-for-/, '');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tradeSlug } = await params;
  const trade = getTradeBySlug(parseTradeSlug(tradeSlug));
  if (!trade) return {};
  return {
    title: `${trade.heroTitle} — Quoting App for ${trade.name}`,
    description: trade.description,
    alternates: { canonical: `https://quotemateapp.au/quotes-for-${trade.slug}` },
  };
}

const CheckSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

export default async function TradePage({ params }: Props) {
  const { tradeSlug } = await params;
  const trade = getTradeBySlug(parseTradeSlug(tradeSlug));
  if (!trade) notFound();

  const templates = getTemplatesForTrade(trade.slug);
  const faqItems = getTradeFAQs(trade);

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Trades', href: '/trades' },
              { label: trade.name },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Quoting App for {trade.name}</span>
              <h1 className="seo-hero-title">{trade.heroTitle}</h1>
              <p className="seo-hero-subtitle">{trade.description}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-pain-point">
          <div className="container">
            <div className="pain-point-card">
              <h2>The Problem</h2>
              <p>{trade.painPoint}</p>
            </div>
          </div>
        </section>

        <section className="seo-features">
          <div className="container">
            <h2 className="section-title">How QuoteMate Helps {trade.name}</h2>
            <div className="seo-features-grid">
              {trade.features.map((feature, i) => (
                <div key={i} className="seo-feature-item">
                  <CheckSvg />
                  <span>{feature}</span>
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
                <p>&ldquo;{trade.templateSnippet}&rdquo;</p>
              </div>
              <div className="example-arrow">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </div>
              <div className="example-result">
                <span className="example-label">QuoteMate generates</span>
                <p>A complete, itemised quote with materials, quantities, real-time Bunnings &amp; Mitre 10 pricing, labour costs, GST, and a professional PDF — ready to send to your client. Typical {trade.keyword} quotes range from {trade.avgQuoteRange}.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="seo-common-jobs">
          <div className="container">
            <h2 className="section-title">Common {trade.keyword.charAt(0).toUpperCase() + trade.keyword.slice(1)} Jobs</h2>
            <div className="jobs-grid">
              {trade.commonJobs.map((job, i) => {
                const jobName = typeof job === 'string' ? job : job.name;
                const jobDesc = typeof job === 'string' ? `Create a professional quote for ${job.toLowerCase()} in under 2 minutes with QuoteMate.` : job.desc;
                return (
                  <div key={i} className="job-card">
                    <h3>{jobName}</h3>
                    <p>{jobDesc}</p>
                  </div>
                );
              })}
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
                <h3>{trade.name} by City</h3>
                <ul>
                  {cities.map((city) => (
                    <li key={city.slug}>
                      <Link href={`/quotes-for-${trade.slug}/${city.slug}`}>
                        {trade.name} in {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {templates.length > 0 && (
                <div className="links-column">
                  <h3>Templates</h3>
                  <ul>
                    {templates.map((t) => (
                      <li key={t.slug}>
                        <Link href={`/templates/${t.slug}`}>{t.name}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="links-column">
                <h3>Other Trades</h3>
                <ul>
                  {trades.filter(t => t.slug !== trade.slug).slice(0, 8).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/quotes-for-${t.slug}`}>{t.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Structured Data - FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      })}} />
    </>
  );
}
