import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { guides, getTradeBySlug } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Quoting Guides for Australian Tradies',
  description: 'Free quoting guides and tips for Australian tradies. Learn how to quote bathroom renovations, deck builds, fences, kitchens, and more — with real costs and pricing advice.',
  alternates: { canonical: 'https://quotemateapp.au/blog' },
};

export default function BlogIndex() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Blog' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Quoting Guides &amp; Tips</h1>
              <p className="seo-hero-subtitle">Practical guides to help Australian tradies quote accurately, win more jobs, and get paid faster.</p>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <div className="trade-directory-grid">
              {guides.map((guide) => {
                const trade = getTradeBySlug(guide.trade);
                return (
                  <Link key={guide.slug} href={`/blog/${guide.slug}`} className="trade-directory-card">
                    <h2>{guide.title}</h2>
                    <p>{guide.description}</p>
                    {trade && <span className="trade-pill" style={{ marginTop: '12px', display: 'inline-block', fontSize: '0.75rem', padding: '4px 12px' }}>{trade.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
