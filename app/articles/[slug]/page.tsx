import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import CTAButtons from '../../components/CTAButtons';
import { guides, trades, getGuideBySlug, getTradeBySlug, getTemplateBySlug } from '@/lib/data';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `https://quotemateapp.au/articles/${guide.slug}` },
    openGraph: {
      images: [{ url: `/assets/articles/${guide.slug}.jpg`, width: 800, height: 450, alt: guide.title }],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const trade = getTradeBySlug(guide.trade);
  const relatedTemplate = guide.relatedTemplate ? getTemplateBySlug(guide.relatedTemplate) : undefined;

  // Calculate reading time from all text content
  const wordCount = [guide.description, ...guide.sections.map(s => s.heading + ' ' + s.body), ...guide.tips].join(' ').split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Articles', href: '/articles' },
              { label: guide.title },
            ]} />
            <div className="seo-hero-content">
              <div className="blog-meta">
                {trade && <span className="seo-badge">{trade.name}</span>}
                <span className="blog-meta-text">Updated March 2026 &middot; {readingTime} min read</span>
              </div>
              <h1 className="seo-hero-title">{guide.title}</h1>
              <p className="seo-hero-subtitle">{guide.description}</p>
            </div>
          </div>
        </section>

        <section className="seo-guide-article">
          <div className="container">
            <div className="guide-content">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="article-hero-image"
                src={`/assets/articles/${guide.slug}.jpg`}
                alt={guide.title}
                width={800}
                height={450}
                loading="eager"
              />
              {guide.sections.map((section, i) => (
                <div key={i} className="guide-section">
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </div>
              ))}

              {guide.tips.length > 0 && (
                <div className="guide-tips">
                  <h2>Pro Tips</h2>
                  <ul>
                    {guide.tips.map((tip, i) => (
                      <li key={i}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="guide-cta-card">
                <h2>Quote This Job in Under 2 Minutes</h2>
                <p>Skip the spreadsheet. QuoteMate&rsquo;s AI pulls real-time Bunnings &amp; Mitre 10 prices and generates a professional PDF quote you can send on the spot.</p>
                <CTAButtons showWebLink />
              </div>
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              {relatedTemplate && (
                <div className="links-column">
                  <h3>Related Template</h3>
                  <ul>
                    <li><Link href={`/templates/${relatedTemplate.slug}`}>{relatedTemplate.name}</Link></li>
                  </ul>
                </div>
              )}
              {trade && (
                <div className="links-column">
                  <h3>Related Trade</h3>
                  <ul>
                    <li><Link href={`/quotes-for-${trade.slug}`}>{trade.name} Quoting</Link></li>
                  </ul>
                </div>
              )}
              <div className="links-column">
                <h3>More Guides</h3>
                <ul>
                  {guides.filter(g => g.slug !== guide.slug).slice(0, 8).map((g) => (
                    <li key={g.slug}>
                      <Link href={`/articles/${g.slug}`}>{g.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>Browse by Trade</h3>
                <ul>
                  {trades.slice(0, 8).map((t) => (
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": guide.title,
        "description": guide.description,
        "image": `https://quotemateapp.au/assets/articles/${guide.slug}.jpg`,
        "datePublished": "2026-03-01",
        "dateModified": "2026-03-13",
        "author": { "@type": "Organization", "name": "QuoteMate", "url": "https://quotemateapp.au" },
        "publisher": { "@type": "Organization", "name": "QuoteMate", "url": "https://quotemateapp.au", "logo": { "@type": "ImageObject", "url": "https://quotemateapp.au/assets/logo.png" } },
      })}} />
    </>
  );
}
