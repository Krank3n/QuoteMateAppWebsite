import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { quoteTemplates } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Free Quote Templates for Australian Tradies',
  description: 'Browse free quoting templates for decks, bathrooms, fences, kitchens, painting, concrete, solar, and more. Customise and send professional PDF quotes.',
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
              <p className="seo-hero-subtitle">Browse our library of free quoting templates. Each template includes common materials, steps, and pricing — ready to customise and send as a professional PDF.</p>
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
