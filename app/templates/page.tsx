import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { quoteTemplates } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Free Quote Templates for Tradies (Australia 2026)',
  description: 'Download free PDF and Excel quote worksheets for Australian tradies. Suggested line items and blank quantities, rates and GST fields. No signup required.',
  alternates: { canonical: 'https://quotemateapp.au/templates' },
};

export default function TemplatesDirectoryPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Templates' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Free Templates</span>
              <h1 className="seo-hero-title">Quote Templates for Australian Tradies</h1>
              <p className="seo-hero-subtitle">Download free PDF and Excel worksheets with suggested line items. Enter your own quantities, rates and GST treatment — no signup required. Use QuoteMate when you want to build and send quotes in the app.</p>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <h2 className="section-title">All Templates</h2>
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
