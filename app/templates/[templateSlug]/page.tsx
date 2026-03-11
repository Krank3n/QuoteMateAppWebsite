import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import FAQ from '../../components/FAQ';
import CTAButtons from '../../components/CTAButtons';
import { quoteTemplates, trades, getTemplateBySlug, getTradeBySlug, getTradeFAQs } from '@/lib/data';

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
  return {
    title: template.name,
    description: template.description,
    alternates: { canonical: `https://quotemateapp.au/templates/${template.slug}` },
  };
}

export default async function TemplatePage({ params }: Props) {
  const { templateSlug } = await params;
  const template = getTemplateBySlug(templateSlug);
  if (!template) notFound();

  const trade = getTradeBySlug(template.trade);

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
            <div className="seo-hero-content">
              <span className="seo-badge">Free Template</span>
              <h1 className="seo-hero-title">{template.name}</h1>
              <p className="seo-hero-subtitle">{template.description}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

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
            <FAQ items={trade ? getTradeFAQs(trade) : []} />
          </div>
        </section>

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
                  {quoteTemplates.filter(t => t.slug !== template.slug).slice(0, 8).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/templates/${t.slug}`}>{t.name}</Link>
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
    </>
  );
}
