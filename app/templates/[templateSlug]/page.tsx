import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import FAQ from '../../components/FAQ';
import CTAButtons from '../../components/CTAButtons';
import WalkthroughPlayer from '../../components/WalkthroughPlayer';
import { quoteTemplates, getTemplateBySlug, getTradeBySlug, getTradeFAQs, getTemplateContent, rotated, rotatedTrades } from '@/lib/data';
import { TEMPLATES_WITH_VIDEOS, VIDEO_UPLOAD_DATE } from '@/lib/videos';

interface Props {
  params: Promise<{ templateSlug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return quoteTemplates.map((t) => ({ templateSlug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { templateSlug } = await params;
  const template = getTemplateBySlug(templateSlug);
  if (!template) return {};
  const url = `https://quotemateapp.au/templates/${template.slug}`;
  const title = template.metaTitle ?? `Free ${template.name} (PDF & Excel)`;
  const description = template.metaDescription ?? `Free ${template.name.toLowerCase()} for Australian tradies. Itemised materials, GST, and pro PDF formatting — send quotes in minutes with QuoteMate.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    keywords: [
      template.name.toLowerCase(),
      `free ${template.keyword} quote template`,
      `${template.keyword} quote template Australia`,
      `${template.keyword} quote PDF`,
      `${template.keyword} quote example`,
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

export default async function TemplatePage({ params }: Props) {
  const { templateSlug } = await params;
  const template = getTemplateBySlug(templateSlug);
  if (!template) notFound();

  const trade = getTradeBySlug(template.trade);
  const content = getTemplateContent(template.slug);
  const hasVideo = TEMPLATES_WITH_VIDEOS.has(template.slug);
  const jobName = template.name.replace(/ Quote Template$/i, '');
  const faqItems = [
    ...(content?.faqs ?? []),
    ...(trade ? getTradeFAQs(trade) : []),
  ];

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Templates', href: '/templates' },
              { label: template.name },
            ]} />
            <div className={hasVideo ? 'seo-hero-layout' : undefined}>
              <div className="seo-hero-content">
                <span className="seo-badge">Free Template</span>
                <h1 className="seo-hero-title">{template.name}</h1>
                <p className="seo-hero-subtitle">{template.description}</p>
                <p className="seo-hero-videocue">▶ Watch a real {jobName.toLowerCase()} quote built in under a minute</p>
                <CTAButtons showWebLink />
              </div>
              {hasVideo && (
                <div className="seo-hero-media">
                  <WalkthroughPlayer basePath="templates" slug={template.slug} poster={`/assets/videos/templates/${template.slug}-poster.jpg`} label={`${jobName} quote demo`} />
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'VideoObject',
                      name: `${jobName} quote demo — real prices in under a minute`,
                      description: template.description,
                      thumbnailUrl: `https://quotemateapp.au/assets/videos/templates/${template.slug}-poster.jpg`,
                      uploadDate: VIDEO_UPLOAD_DATE,
                      duration: 'PT1M',
                      contentUrl: `https://quotemateapp.au/assets/videos/templates/${template.slug}.mp4`,
                      embedUrl: `https://quotemateapp.au/templates/${template.slug}`,
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

        {content && (
          <section className="seo-rich-content">
            <div className="container">
              <div className="rich-content-block">
                <p className="rich-content-intro">{content.intro}</p>
                {content.sections.map((sec, i) => (
                  <div key={i} className="rich-content-section">
                    <h2>{sec.heading}</h2>
                    <p>{sec.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="seo-template-details">
          <div className="container">
            <div className="template-grid">
              <div className="template-materials">
                <h2>Materials Included</h2>
                <ul>
                  {template.materials.map((mat, i) => (
                    <li key={i}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      {mat}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="template-steps">
                <h2>Quoting Steps</h2>
                <ol>
                  {template.steps.map((step, i) => (
                    <li key={i}>
                      <span className="step-num">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={faqItems} />
          </div>
        </section>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqItems.map((item) => ({
            "@type": "Question",
            "name": item.question,
            "acceptedAnswer": { "@type": "Answer", "text": item.answer }
          }))
        }) }} />

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              {trade && (
                <div className="links-column">
                  <h3>Related Trade</h3>
                  <ul>
                    <li><Link href={`/quotes-for-${trade.slug}`}>{trade.name} Quoting</Link></li>
                  </ul>
                </div>
              )}
              <div className="links-column">
                <h3>Other Templates</h3>
                <ul>
                  {rotated(quoteTemplates.filter(t => t.slug !== template.slug), template.slug, 8).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/templates/${t.slug}`}>{t.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>Browse by Trade</h3>
                <ul>
                  {rotatedTrades(template.slug, 8).map((t) => (
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
    </>
  );
}
