import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import FAQ from '../components/FAQ';
import CTAButtons from '../components/CTAButtons';
import { trades, cityPageCities, getTradeBySlug, getTemplatesForTrade, getTradeFAQs, rotatedTrades } from '@/lib/data';
import WalkthroughPlayer from '../components/WalkthroughPlayer';
import { TRADES_WITH_VIDEOS, VIDEO_UPLOAD_DATE } from '@/lib/videos';

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
  const title = trade.metaTitle ?? `Free Quoting App for ${trade.name} (2026)`;
  const description = trade.metaDescription ?? trade.description;
  const url = `https://quotemateapp.au/quotes-for-${trade.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      `${trade.keyword} quoting app`,
      `quoting app for ${trade.name.toLowerCase()}`,
      `free ${trade.keyword} quote template`,
      `${trade.keyword} quotes Australia`,
      `${trade.name.toLowerCase()} invoice app`,
      `${trade.keyword} quote app 2026`,
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
}

const CheckSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

export default async function TradePage({ params }: Props) {
  const { tradeSlug } = await params;
  const trade = getTradeBySlug(parseTradeSlug(tradeSlug));
  if (!trade) notFound();

  const templates = getTemplatesForTrade(trade.slug);
  const hasVideo = TRADES_WITH_VIDEOS.has(trade.slug);
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
            <div className={hasVideo ? 'seo-hero-layout' : undefined}>
              <div className="seo-hero-content">
                <span className="seo-badge">Quoting App for {trade.name}</span>
                {trade.partnerBadge && (
                  <Link href={trade.partnerBadge.href} className="seo-partner-badge">
                    <Image
                      src={trade.partnerBadge.logo}
                      alt=""
                      width={trade.partnerBadge.logoWidth ?? 48}
                      height={trade.partnerBadge.logoHeight ?? 32}
                      aria-hidden="true"
                    />
                    <span>{trade.partnerBadge.label}</span>
                  </Link>
                )}
                <h1 className="seo-hero-title">{trade.heroTitle}</h1>
                <p className="seo-hero-subtitle">{trade.description}</p>
                {hasVideo && <p className="seo-hero-videocue">▶ Watch a real {trade.name.toLowerCase()} quote built in under a minute</p>}
                <CTAButtons showWebLink />
              </div>
              {hasVideo && (
                <div className="seo-hero-media">
                  <WalkthroughPlayer basePath="trades" slug={trade.slug} poster={`/assets/videos/trades/${trade.slug}-poster.jpg`} label={`${trade.name} quote demo`} />
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'VideoObject',
                      name: `${trade.name} quote demo — real prices in under a minute`,
                      description: trade.description,
                      thumbnailUrl: `https://quotemateapp.au/assets/videos/trades/${trade.slug}-poster.jpg`,
                      uploadDate: VIDEO_UPLOAD_DATE,
                      duration: 'PT1M',
                      contentUrl: `https://quotemateapp.au/assets/videos/trades/${trade.slug}.mp4`,
                      embedUrl: `https://quotemateapp.au/quotes-for-${trade.slug}`,
                      publisher: {
                        '@type': 'Organization',
                        name: 'QuoteMate',
                        logo: { '@type': 'ImageObject', url: 'https://quotemateapp.au/assets/logo.png' },
                      },
                    }) }}
                  />
                </div>
              )}
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
                <p>A complete, itemised quote with materials, quantities, real-time supplier pricing, labour costs, GST, and a professional PDF — ready to send to your client. Typical {trade.keyword} quotes range from {trade.avgQuoteRange}.</p>
              </div>
            </div>
          </div>
        </section>

        {trade.richContent && (
          <section className="seo-rich-content">
            <div className="container">
              <div className="rich-content-block">
                <p className="rich-content-intro">{trade.richContent.intro}</p>
                {trade.richContent.sections.map((sec, i) => (
                  <div key={i} className="rich-content-section">
                    <h2>{sec.heading}</h2>
                    <p>{sec.body}</p>
                    {sec.link && (
                      <p className="rich-content-link">
                        <Link href={sec.link.href}>{sec.link.label}</Link>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <div className="rich-content-section">
                <h2>Manage Every {trade.singular} Job From Inquiry to Paid</h2>
                <p>
                  Quoting is only half the work. QuoteMate tracks every {trade.keyword.toLowerCase()} job through a 9-stage pipeline — inquiry, quoted, accepted, scheduled, in progress, completed, paid, closed, or cancelled — with timestamps stamped automatically so you can see where every dollar is sitting and where the bottleneck is. Schedule jobs in two taps with Google Calendar sync, snap and annotate on-site photos against the job (not lost in your camera roll), keep a brain-dump checklist of materials and to-dos for the day, and chase quotes automatically if a customer goes quiet.
                </p>
                <p className="rich-content-link">
                  <Link href="/manage-jobs">See how {trade.name.toLowerCase()} run jobs in QuoteMate →</Link>
                </p>
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
                  {cityPageCities.map((city) => (
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
                  {rotatedTrades(trade.slug, 8, trade.slug).map((t) => (
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

      {/* Structured Data - Service */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `QuoteMate for ${trade.name}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "iOS, Android, Web",
        "description": trade.description,
        "url": `https://quotemateapp.au/quotes-for-${trade.slug}`,
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "AUD", "name": "Free" },
          { "@type": "Offer", "price": "49", "priceCurrency": "AUD", "name": "Pro", "billingIncrement": "month" }
        ],
        "provider": {
          "@type": "Organization",
          "name": "QuoteMate",
          "url": "https://quotemateapp.au",
          "areaServed": { "@type": "Country", "name": "Australia" }
        }
      })}} />

    </>
  );
}
