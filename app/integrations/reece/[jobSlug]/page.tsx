import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Breadcrumbs from '../../../components/Breadcrumbs';
import FAQ from '../../../components/FAQ';
import CTAButtons from '../../../components/CTAButtons';
import { getReeceSpoke, getReeceSpokes } from '@/lib/data';

const SITE_URL = 'https://quotemateapp.au';

interface Props {
  params: Promise<{ jobSlug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return getReeceSpokes().map((s) => ({ jobSlug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobSlug } = await params;
  const spoke = getReeceSpoke(jobSlug);
  if (!spoke) return {};
  const url = `${SITE_URL}/integrations/reece/${spoke.slug}`;
  return {
    title: spoke.metaTitle,
    description: spoke.metaDescription,
    alternates: { canonical: url },
    keywords: [
      spoke.keyword,
      `${spoke.keyword} reece`,
      `${spoke.keyword} app`,
      `reece ${spoke.jobName.toLowerCase()}`,
      `quoting ${spoke.jobName.toLowerCase()}`,
    ],
    openGraph: {
      type: 'article',
      url,
      title: spoke.metaTitle,
      description: spoke.metaDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: spoke.metaTitle,
      description: spoke.metaDescription,
    },
  };
}

export default async function ReeceSpokePage({ params }: Props) {
  const { jobSlug } = await params;
  const spoke = getReeceSpoke(jobSlug);
  if (!spoke) notFound();

  const allSpokes = getReeceSpokes();
  const otherSpokes = allSpokes.filter(s => s.slug !== spoke.slug);
  const url = `${SITE_URL}/integrations/reece/${spoke.slug}`;
  const headline = `Quoting a ${spoke.jobName} with Reece Trade Prices`;

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Integrations' },
              { label: 'Reece', href: '/integrations/reece' },
              { label: spoke.jobName },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Reece × QuoteMate Guide</span>
              <h1 className="seo-hero-title">{headline}</h1>
              <p className="seo-hero-subtitle">{spoke.summary}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <p className="rich-content-intro">{spoke.intro}</p>
            </div>
          </div>
        </section>

        <section className="reece-spoke-why">
          <div className="container">
            <div className="reece-spoke-why-card">
              <h2>Why Reece pricing matters for {spoke.jobName.toLowerCase()}</h2>
              <p>{spoke.whyReeceMatters}</p>
            </div>
          </div>
        </section>

        <section className="seo-common-jobs">
          <div className="container">
            <h2 className="section-title">Materials priced at your trade rate</h2>
            <p className="reece-materials-intro">
              These materials prefill at your Reece trade rate when you describe a {spoke.jobName.toLowerCase()} in QuoteMate.
            </p>
            <div className="jobs-grid">
              {spoke.materials.map((m, i) => (
                <div key={i} className="job-card">
                  <h3>{m.name}</h3>
                  {m.note && <p>{m.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              {spoke.sections.map((sec, i) => (
                <div key={i} className="rich-content-section">
                  <h2>{sec.heading}</h2>
                  <p>{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={spoke.faqs} />
          </div>
        </section>

        <section className="reece-cta">
          <div className="container">
            <div className="pain-point-card reece-cta-card">
              <h2>Quote your next {spoke.jobName.toLowerCase()} with real Reece prices</h2>
              <p>Connect your Reece maX account in about a minute. Live now in QuoteMate.</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>More Reece × QuoteMate guides</h3>
                <ul>
                  <li><Link href="/integrations/reece">Reece integration overview</Link></li>
                  {otherSpokes.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/integrations/reece/${s.slug}`}>{s.jobName}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>For plumbers</h3>
                <ul>
                  <li><Link href="/quotes-for-plumbers">Quoting App for Plumbers</Link></li>
                  <li><Link href="/quotes-for-plumbers/sydney">Plumbers in Sydney</Link></li>
                  <li><Link href="/quotes-for-plumbers/melbourne">Plumbers in Melbourne</Link></li>
                  <li><Link href="/quotes-for-plumbers/brisbane">Plumbers in Brisbane</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline,
        description: spoke.metaDescription,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        publisher: {
          '@type': 'Organization',
          name: 'QuoteMate',
          url: SITE_URL,
        },
        author: {
          '@type': 'Organization',
          name: 'QuoteMate',
          url: SITE_URL,
        },
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: spoke.faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: headline,
        description: spoke.summary,
        step: spoke.sections.map((sec, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: sec.heading,
          text: sec.body,
        })),
      }) }} />
    </>
  );
}
