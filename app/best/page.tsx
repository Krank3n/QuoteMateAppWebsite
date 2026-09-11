import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { bestPages } from './data';

export const metadata: Metadata = {
  title: 'Quoting, Invoicing & Job Management Software for Tradies: Compared (2026)',
  description: 'Six buyer\'s guides comparing quoting apps, invoicing apps, job management software and trade-specific apps for Australian tradies, with real monthly costs and honest fits.',
  alternates: { canonical: 'https://quotemateapp.au/best' },
};

export default function BestHub() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Best' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Software for Australian Tradies, Compared</h1>
              <p className="seo-hero-subtitle">Six buyer&apos;s guides to quoting apps, invoicing apps, job management software and trade-specific apps. Real monthly costs for one person and a crew, and an honest line on where a quoting-first app stops and the bigger platforms start.</p>
            </div>
          </div>
        </section>

        {/* Search Console shows this hub for the broad category terms
            ("job management software", "quoting app", "invoicing app") rather
            than "best of" searches. Route each search to the guide that
            answers it, in one screen. */}
        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <div className="rich-content-section">
                <h2>Which guide answers your search</h2>
                <ul>
                  <li><Link href="/best/job-management-software-for-tradies">Job management software</Link>: scheduling, tracking and dispatch for crews, and where a quoting-first app is enough.</li>
                  <li><Link href="/best/quoting-app-for-tradies">Quoting apps</Link>: two-minute itemised quotes on site with live supplier pricing, and when you need takeoffs instead.</li>
                  <li><Link href="/best/invoicing-app-for-tradies">Quoting and invoicing software</Link>: closing the quote-to-invoice-to-payment loop, and what an invoicing app cannot replace.</li>
                  <li><Link href="/best/tradie-app-australia">Tradie apps</Link>: the five that run a trade business and the two most sole traders end up on.</li>
                  <li><Link href="/best/app-for-plumbers">Plumbing software</Link>: quoting at real Reece maX trade prices, invoicing from the van, job costing for bigger firms.</li>
                  <li><Link href="/best/app-for-electricians">Electrician software</Link>: per-point and hourly quoting with the compliance line items on, through to commercial contractor platforms.</li>
                </ul>
                <p>
                  Every guide uses the same rule: a quoting-first app is the right tool for the tradie who is also the office, and a job management platform is the right tool once there is a crew to dispatch. QuoteMate is the first kind, and each guide says where it stops.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <div className="trade-directory-grid">
              {bestPages.map((p) => (
                <Link key={p.slug} href={`/best/${p.slug}`} className="trade-directory-card">
                  <h2>{p.h1.replace('The Best', 'Best')}</h2>
                  <p>{p.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Best Apps for Australian Tradies',
        description: 'Roundup guides to the best quoting, invoicing and job-management apps for Australian tradies.',
        url: 'https://quotemateapp.au/best/',
        hasPart: bestPages.map((p) => ({
          '@type': 'Article',
          headline: p.h1.replace('The Best', 'Best'),
          url: `https://quotemateapp.au/best/${p.slug}/`,
          description: p.tagline,
        })),
      }) }} />
    </>
  );
}
