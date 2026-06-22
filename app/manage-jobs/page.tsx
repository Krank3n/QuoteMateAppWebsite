import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import { manageJobsHub } from '@/lib/data';
import { OG_IMAGES } from '@/lib/seo';

const url = 'https://quotemateapp.au/manage-jobs';

export const metadata: Metadata = manageJobsHub
  ? {
      title: manageJobsHub.hub.metaTitle,
      description: manageJobsHub.hub.metaDescription,
      alternates: { canonical: url },
      keywords: [
        'tradie job management app',
        'job tracking for tradies',
        'job scheduling app australia',
        'tradie jobs board',
        'quote to job conversion',
        'on site job checklist app',
        'tradie job photos app',
        'google calendar tradie',
      ],
      openGraph: {
        type: 'website',
        url,
        title: manageJobsHub.hub.metaTitle,
        description: manageJobsHub.hub.metaDescription,
        images: OG_IMAGES,
      },
      twitter: {
        card: 'summary_large_image',
        title: manageJobsHub.hub.metaTitle,
        description: manageJobsHub.hub.metaDescription,
        images: OG_IMAGES,
      },
    }
  : {};

export default function ManageJobsHubPage() {
  if (!manageJobsHub) notFound();
  const { hub, spokes } = manageJobsHub;

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Manage Jobs' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Job Management Hub</span>
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
                <Link key={spoke.slug} href={`/manage-jobs/${spoke.slug}`} className="job-card payment-spoke-card">
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
                  <li><Link href="/quoting">Quoting Tools Hub</Link></li>
                  <li><Link href="/get-paid">Payments Hub</Link></li>
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
          url: `https://quotemateapp.au/manage-jobs/${spoke.slug}`,
          description: spoke.summary,
        })),
      })}} />
    </>
  );
}
