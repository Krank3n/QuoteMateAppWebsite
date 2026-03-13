import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import CTAButtons from '../../components/CTAButtons';
import { competitors, getCompetitorBySlug } from '../data';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return competitors.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const comp = getCompetitorBySlug(slug);
  if (!comp) return {};
  return {
    title: `QuoteMate vs ${comp.name} — Compare Quoting Apps for Tradies`,
    description: `Compare QuoteMate and ${comp.name} side by side. See which quoting app is better for Australian tradies on pricing, features, AI quoting, and supplier integration.`,
    alternates: { canonical: `https://quotemateapp.au/compare/${comp.slug}` },
  };
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') return <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>{value}</span>;
  return value ? <CheckIcon /> : <CrossIcon />;
}

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params;
  const comp = getCompetitorBySlug(slug);
  if (!comp) notFound();

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Compare', href: '/compare' },
              { label: `vs ${comp.name}` },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Comparison</span>
              <h1 className="seo-hero-title">QuoteMate vs {comp.name}</h1>
              <p className="seo-hero-subtitle">{comp.tagline}</p>
            </div>
          </div>
        </section>

        <section className="seo-guide-article">
          <div className="container">
            <div className="guide-content">
              <div className="guide-section">
                <h2>What is {comp.name}?</h2>
                <p>{comp.description}</p>
              </div>

              <div className="guide-section">
                <h2>Pricing Comparison</h2>
                <p><strong>QuoteMate:</strong> Free plan available. Pro at $29/month or $199/year (save 43%). Flat pricing — no per-user fees.</p>
                <p style={{ marginTop: '8px' }}><strong>{comp.name}:</strong> {comp.pricing}</p>
              </div>

              <div className="guide-section">
                <h2>Feature Comparison</h2>
                <div className="comparison-table-wrap">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>QuoteMate</th>
                        <th>{comp.name}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.features.map((f, i) => (
                        <tr key={i}>
                          <td>{f.name}</td>
                          <td><FeatureCell value={f.quotemate} /></td>
                          <td><FeatureCell value={f.competitor} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="guide-section">
                <h2>The Bottom Line</h2>
                <p>{comp.summary}</p>
              </div>

              <div className="guide-cta-card">
                <h2>Try QuoteMate Free</h2>
                <p>Create your first professional quote in under 2 minutes. No credit card required.</p>
                <CTAButtons showWebLink />
              </div>
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>Other Comparisons</h3>
                <ul>
                  {competitors.filter(c => c.slug !== comp.slug).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/compare/${c.slug}`}>QuoteMate vs {c.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>QuoteMate</h3>
                <ul>
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/about">About</Link></li>
                  <li><Link href="/articles">Quoting Guides</Link></li>
                  <li><Link href="/trades">Browse by Trade</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
