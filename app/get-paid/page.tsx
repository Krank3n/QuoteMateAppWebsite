import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import { paymentHub } from '@/lib/data';

const url = 'https://quotemateapp.au/get-paid';

export const metadata: Metadata = paymentHub
  ? {
      title: paymentHub.hub.metaTitle,
      description: paymentHub.hub.metaDescription,
      alternates: { canonical: url },
      keywords: [
        'tradie payment app',
        'get paid faster tradie',
        'tap to pay iphone tradie',
        'unpaid invoices australia',
        'tradie deposit australia',
        'automated payment reminders',
      ],
      openGraph: {
        type: 'website',
        url,
        title: paymentHub.hub.metaTitle,
        description: paymentHub.hub.metaDescription,
      },
      twitter: {
        card: 'summary_large_image',
        title: paymentHub.hub.metaTitle,
        description: paymentHub.hub.metaDescription,
      },
    }
  : {};

export default function GetPaidHubPage() {
  if (!paymentHub) notFound();
  const { hub, spokes } = paymentHub;

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Get Paid' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Payments Hub</span>
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
            <h2 className="section-title">Pick Your Topic</h2>
            <p className="section-subtitle" style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 32px' }}>{hub.spokeIntro}</p>
            <div className="jobs-grid">
              {spokes.map((spoke) => (
                <Link key={spoke.slug} href={`/get-paid/${spoke.slug}`} className="job-card payment-spoke-card">
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
                <h3>Quoting Tools</h3>
                <ul>
                  <li><Link href="/shower-quoting-tool">Shower Quoting Tool</Link></li>
                  <li><Link href="/templates">All Quote Templates</Link></li>
                  <li><Link href="/trades">Quoting Apps by Trade</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>QuoteMate</h3>
                <ul>
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/about">About</Link></li>
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
          url: `https://quotemateapp.au/get-paid/${spoke.slug}`,
          description: spoke.summary,
        })),
      })}} />
    </>
  );
}
