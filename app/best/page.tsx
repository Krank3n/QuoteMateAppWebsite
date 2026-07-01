import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { bestPages } from './data';

export const metadata: Metadata = {
  title: 'The Best Apps for Australian Tradies (2026 Guides)',
  description: 'Honest, up-to-date roundups of the best quoting apps, invoicing apps, and job-management software for Australian tradies, electricians and plumbers.',
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
              <h1 className="seo-hero-title">Best Apps for Australian Tradies</h1>
              <p className="seo-hero-subtitle">Straight-talking guides to the best quoting, invoicing and job-management tools for tradies — rated on price, speed and how they actually work on site.</p>
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
