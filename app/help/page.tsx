import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { getHelpCategories, getHelpLastUpdated } from '@/lib/help';

export const metadata: Metadata = {
  title: 'Help Centre',
  description: 'How to use QuoteMate: send your first quote, take card payments with Square, convert quotes to invoices, chase unpaid invoices, manage your subscription, and fix common problems.',
  alternates: { canonical: 'https://quotemateapp.au/help/' },
};

export default function HelpIndex() {
  const groups = getHelpCategories();
  const faq = groups.find((g) => g.category.slug === 'faq')?.articles[0];
  const sections = groups.filter((g) => g.category.slug !== 'faq');

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Help' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Help Centre</h1>
              <p className="seo-hero-subtitle">Short, plain-English answers on quoting, getting paid, invoices, integrations and your account. Can&rsquo;t find it? Email <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a> and a real person replies.</p>
              {faq && (
                <p className="help-faq-link"><Link href={`/help/${faq.slug}`}>Start with the quick answers &rarr;</Link></p>
              )}
            </div>
          </div>
        </section>

        {sections.map(({ category, articles }) => (
          <section key={category.slug} className="help-category" id={category.slug}>
            <div className="container">
              <h2 className="section-title">{category.name}</h2>
              <div className="jobs-grid">
                {articles.map((article) => (
                  <Link key={article.slug} href={`/help/${article.slug}`} className="job-card payment-spoke-card">
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <span className="payment-spoke-link">Read &rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>Get Paid</h3>
                <ul>
                  <li><Link href="/get-paid">Get Paid Faster</Link></li>
                  <li><Link href="/square">Square Payments</Link></li>
                  <li><Link href="/pricing">Pricing</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>Quoting</h3>
                <ul>
                  <li><Link href="/quoting">Quoting Tools Hub</Link></li>
                  <li><Link href="/templates">Quote Templates</Link></li>
                  <li><Link href="/articles">Quoting Guides</Link></li>
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
        name: 'QuoteMate Help Centre',
        description: metadata.description,
        url: 'https://quotemateapp.au/help/',
        dateModified: getHelpLastUpdated(),
        publisher: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au' },
      })}} />
    </>
  );
}
