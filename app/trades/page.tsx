import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { trades, quoteTemplates } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Quoting Apps by Trade',
  description: 'Find the best quoting app for your trade. QuoteMate supports 24+ trades including electricians, plumbers, carpenters, builders, and more.',
  alternates: { canonical: 'https://quotemateapp.au/trades' },
};

export default function TradesDirectoryPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Trades' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">24+ Trades Supported</span>
              <h1 className="seo-hero-title">Quoting Apps by Trade</h1>
              <p className="seo-hero-subtitle">Find trade-specific quoting features, templates, and pricing tools for your industry. QuoteMate is built for Australian tradies across every trade.</p>
            </div>
          </div>
        </section>

        <section className="seo-trade-directory">
          <div className="container">
            <div className="trade-directory-grid">
              {trades.map((trade) => (
                <Link key={trade.slug} href={`/quotes-for-${trade.slug}`} className="trade-directory-card">
                  <h2>{trade.name}</h2>
                  <p>{trade.description.substring(0, 120)}...</p>
                  <span className="trade-directory-link">View quoting tools &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <h2 className="section-title">Quote Templates</h2>
            <div className="trade-directory-grid">
              {quoteTemplates.map((template) => (
                <Link key={template.slug} href={`/templates/${template.slug}`} className="trade-directory-card">
                  <h2>{template.name}</h2>
                  <p>{template.description.substring(0, 120)}...</p>
                  <span className="trade-directory-link">View template &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
