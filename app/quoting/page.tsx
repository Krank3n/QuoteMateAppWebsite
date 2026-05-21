import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import { quotingHub } from '@/lib/data';

const url = 'https://quotemateapp.au/quoting';

export const metadata: Metadata = quotingHub
  ? {
      title: quotingHub.hub.metaTitle,
      description: quotingHub.hub.metaDescription,
      alternates: { canonical: url },
      keywords: [
        'tradie quoting app',
        'section based quoting',
        'voice to text quoting',
        'section templates quote',
        'trade pricing memory',
        'quoting tools tradie australia',
        'quote builder app',
      ],
      openGraph: {
        type: 'website',
        url,
        title: quotingHub.hub.metaTitle,
        description: quotingHub.hub.metaDescription,
      },
      twitter: {
        card: 'summary_large_image',
        title: quotingHub.hub.metaTitle,
        description: quotingHub.hub.metaDescription,
      },
    }
  : {};

export default function QuotingHubPage() {
  if (!quotingHub) notFound();
  const { hub, spokes } = quotingHub;

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Quoting' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Quoting Tools Hub</span>
              <h1 className="seo-hero-title">{hub.heroTitle}</h1>
              <p className="seo-hero-subtitle">{hub.heroSubtitle}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-pain-point">
          <div className="container">
            <div className="pain-point-card">
              <h2>The Problem</h2>
              <p>{hub.painPoint}</p>
            </div>
          </div>
        </section>

        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <p className="rich-content-intro">{hub.intro}</p>
            </div>
          </div>
        </section>

        <section className="seo-common-jobs">
          <div className="container">
            <h2 className="section-title">Pick Your Tool</h2>
            <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 32px' }}>{hub.spokeIntro}</p>
            <div className="jobs-grid">
              {spokes.map((spoke) => (
                <Link key={spoke.slug} href={`/quoting/${spoke.slug}`} className="job-card payment-spoke-card">
                  <h3>{spoke.shortLabel}</h3>
                  <p>{spoke.summary}</p>
                  <span className="payment-spoke-link">Read guide →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>Related Hubs</h3>
                <ul>
                  <li><Link href="/manage-jobs">Job Management Hub</Link></li>
                  <li><Link href="/get-paid">Payments Hub</Link></li>
                  <li><Link href="/integrations/reece">Reece × QuoteMate</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>QuoteMate</h3>
                <ul>
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/templates">Quote Templates</Link></li>
                  <li><Link href="/trades">Quoting Apps by Trade</Link></li>
                  <li><Link href="/articles">Articles</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: hub.metaTitle,
        description: hub.metaDescription,
        url,
        hasPart: spokes.map((spoke) => ({
          '@type': 'Article',
          headline: spoke.title,
          url: `https://quotemateapp.au/quoting/${spoke.slug}`,
          description: spoke.summary,
        })),
      })}} />
    </>
  );
}
