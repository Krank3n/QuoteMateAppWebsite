import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import FAQ from '../../components/FAQ';
import CTAButtons from '../../components/CTAButtons';
import { getReeceHub, getReeceSpokes, cities } from '@/lib/data';

const SITE_URL = 'https://quotemateapp.au';
const PAGE_URL = `${SITE_URL}/integrations/reece`;

export async function generateMetadata(): Promise<Metadata> {
  const hub = getReeceHub();
  if (!hub) return {};
  return {
    title: hub.metaTitle,
    description: hub.metaDescription,
    alternates: { canonical: PAGE_URL },
    keywords: [
      'reece quotemate',
      'reece max integration',
      'reece trade prices app',
      'order from reece app',
      'plumbing quoting app reece',
      'reece pricing in quotes',
    ],
    openGraph: {
      type: 'website',
      url: PAGE_URL,
      title: hub.metaTitle,
      description: hub.metaDescription,
      images: [{ url: `${SITE_URL}${hub.heroImage}`, alt: hub.heroImageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: hub.metaTitle,
      description: hub.metaDescription,
      images: [`${SITE_URL}${hub.heroImage}`],
    },
  };
}

const TIER_1_CITIES = new Set(['sydney', 'melbourne', 'brisbane', 'perth']);

export default function ReeceHubPage() {
  const hub = getReeceHub();
  const spokes = getReeceSpokes();
  if (!hub) notFound();

  const cityLinks = cities.filter(c => TIER_1_CITIES.has(c.slug));

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Integrations' },
              { label: 'Reece' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-partner-badge seo-partner-badge--inline" aria-label={hub.heroBadge}>
                <Image
                  src="/assets/partners/reece.png"
                  alt=""
                  width={48}
                  height={32}
                  aria-hidden="true"
                />
                <span>{hub.heroBadge}</span>
              </span>
              <h1 className="seo-hero-title">{hub.heroTitle}</h1>
              <p className="seo-hero-subtitle">{hub.heroSubtitle}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="reece-hero-image-section">
          <div className="container">
            <div className="reece-screenshot reece-screenshot--hero">
              <Image
                src={hub.heroImage}
                alt={hub.heroImageAlt}
                width={1080}
                height={720}
                priority
                sizes="(max-width: 768px) 92vw, 720px"
              />
            </div>
          </div>
        </section>

        <section className="seo-pain-point">
          <div className="container">
            <div className="pain-point-card">
              <h2>Why this matters for plumbers</h2>
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

        <section className="seo-features">
          <div className="container">
            <h2 className="section-title">What you get</h2>
            <p className="section-subtitle">Six things the Reece × QuoteMate integration changes about quoting plumbing.</p>
            <div className="jobs-grid">
              {hub.features.map((f, i) => (
                <div key={i} className="job-card">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="reece-how-it-works">
          <div className="container">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">From OAuth to the first quote with real Reece pricing.</p>
            <ol className="reece-steps">
              {hub.howItWorks.map((s) => (
                <li key={s.step} className="reece-step">
                  <span className="reece-step-num" aria-hidden="true">{s.step}</span>
                  <div className="reece-step-body">
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {hub.screenshots[1] && (
          <section className="reece-screenshot-section">
            <div className="container">
              <figure className="reece-screenshot">
                <Image
                  src={hub.screenshots[1].src}
                  alt={hub.screenshots[1].alt}
                  width={1080}
                  height={720}
                  sizes="(max-width: 768px) 92vw, 900px"
                />
                <figcaption>{hub.screenshots[1].caption}</figcaption>
              </figure>
            </div>
          </section>
        )}

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={hub.faqs} />
          </div>
        </section>

        <section className="reece-cta">
          <div className="container">
            <div className="pain-point-card reece-cta-card">
              <h2>{hub.ctaTitle}</h2>
              <p>{hub.ctaSubtitle}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>For plumbers</h3>
                <ul>
                  <li><Link href="/quotes-for-plumbers">Quoting App for Plumbers</Link></li>
                  {cityLinks.map((city) => (
                    <li key={city.slug}>
                      <Link href={`/quotes-for-plumbers/${city.slug}`}>
                        Plumbers in {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>Job-specific guides</h3>
                <ul>
                  {spokes.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/integrations/reece/${s.slug}`}>{s.jobName}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>More from QuoteMate</h3>
                <ul>
                  <li><Link href="/get-paid">Get paid faster</Link></li>
                  <li><Link href="/templates">Quote templates</Link></li>
                  <li><Link href="/pricing">Pricing</Link></li>
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
        '@type': 'SoftwareApplication',
        name: 'QuoteMate × Reece maX',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'iOS, Android, Web',
        description: hub.metaDescription,
        url: PAGE_URL,
        image: `${SITE_URL}${hub.heroImage}`,
        featureList: hub.features.map(f => f.title),
        offers: [
          { '@type': 'Offer', price: '0', priceCurrency: 'AUD', name: 'Free trial' },
          { '@type': 'Offer', price: '29', priceCurrency: 'AUD', name: 'Pro', billingIncrement: 'month' },
        ],
        provider: {
          '@type': 'Organization',
          name: 'QuoteMate',
          url: SITE_URL,
          areaServed: { '@type': 'Country', name: 'Australia' },
        },
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: hub.faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      }) }} />
    </>
  );
}
