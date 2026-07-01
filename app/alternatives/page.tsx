import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { alternativePages } from './data';

export const metadata: Metadata = {
  title: 'Quoting & Job Management App Alternatives for Tradies',
  description: 'Thinking of switching? Compare the best alternatives to Tradify, ServiceM8, Fergus, simPRO, AroFlo, Jobber and more — built for Australian tradies.',
  alternates: { canonical: 'https://quotemateapp.au/alternatives' },
};

export default function AlternativesHub() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Alternatives' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Tradie App Alternatives</h1>
              <p className="seo-hero-subtitle">Switching quoting or job-management software? These honest roundups compare the leading tools for Australian tradies — and where QuoteMate fits.</p>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <div className="trade-directory-grid">
              {alternativePages.map((p) => (
                <Link key={p.slug} href={`/alternatives/${p.slug}`} className="trade-directory-card">
                  <h2>{p.competitor} alternatives</h2>
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
        name: 'Tradie App Alternatives',
        description: 'Roundups of the best alternatives to the leading tradie quoting and job-management apps in Australia.',
        url: 'https://quotemateapp.au/alternatives/',
        hasPart: alternativePages.map((p) => ({
          '@type': 'Article',
          headline: `${p.competitor} alternatives`,
          url: `https://quotemateapp.au/alternatives/${p.slug}/`,
          description: p.tagline,
        })),
      }) }} />
    </>
  );
}
