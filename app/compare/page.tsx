import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { competitors } from './data';

export const metadata: Metadata = {
  title: 'QuoteMate vs Competitors — Compare Quoting Apps',
  description: 'Compare QuoteMate with other quoting apps for tradies. See how QuoteMate stacks up against Tradify, ServiceM8, Fergus, and more on pricing, features, and ease of use.',
  alternates: { canonical: 'https://quotemateapp.au/compare' },
};

export default function ComparePage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Compare' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">QuoteMate vs The Rest</h1>
              <p className="seo-hero-subtitle">See how QuoteMate compares to other quoting and job management apps for Australian tradies.</p>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <div className="trade-directory-grid">
              {competitors.map((c) => (
                <Link key={c.slug} href={`/compare/${c.slug}`} className="trade-directory-card">
                  <h2>QuoteMate vs {c.name}</h2>
                  <p>{c.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "QuoteMate vs Other Quoting Apps",
        "description": "Side-by-side comparisons of QuoteMate against other quoting and job-management tools for Australian tradies.",
        "url": "https://quotemateapp.au/compare/",
        "hasPart": competitors.map((c) => ({
          "@type": "Article",
          "headline": `QuoteMate vs ${c.name}`,
          "url": `https://quotemateapp.au/compare/${c.slug}/`,
          "description": c.tagline,
        })),
      })}} />
    </>
  );
}
