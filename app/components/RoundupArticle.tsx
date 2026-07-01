import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';
import CTAButtons from './CTAButtons';
import FAQ from './FAQ';

export interface RoundupItem {
  name: string;
  slug?: string; // compare-page slug for internal linking, if one exists
  bestFor: string;
  pricing: string;
  isQuoteMate?: boolean;
}

export interface RoundupContent {
  intro: string;
  sections: { heading: string; body: string }[];
  faqs?: { question: string; answer: string }[];
}

export interface RelatedLinkGroup {
  heading: string;
  links: { label: string; href: string }[];
}

export interface RoundupArticleProps {
  badge: string;
  breadcrumb: { label: string; href?: string }[];
  h1: string;
  tagline: string;
  tableTitle: string;
  items: RoundupItem[];
  reasons?: { heading: string; points: string[] };
  content?: RoundupContent;
  canonical: string;
  schemaName: string;
  schemaDescription: string;
  related: RelatedLinkGroup[];
}

export default function RoundupArticle({
  badge, breadcrumb, h1, tagline, tableTitle, items, reasons, content, canonical, schemaName, schemaDescription, related,
}: RoundupArticleProps) {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={breadcrumb} />
            <div className="seo-hero-content">
              <span className="seo-badge">{badge}</span>
              <h1 className="seo-hero-title">{h1}</h1>
              <p className="seo-hero-subtitle">{tagline}</p>
            </div>
          </div>
        </section>

        <section className="seo-guide-article">
          <div className="container">
            <div className="guide-content">
              {content?.intro && <p className="rich-content-intro">{content.intro}</p>}

              {reasons && reasons.points.length > 0 && (
                <div className="guide-section">
                  <h2>{reasons.heading}</h2>
                  <ul>
                    {reasons.points.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}

              {content?.sections?.[0] && (
                <div className="guide-section">
                  <h2>{content.sections[0].heading}</h2>
                  <p>{content.sections[0].body}</p>
                </div>
              )}

              <div className="guide-section">
                <h2>{tableTitle}</h2>
                <div className="comparison-table-wrap">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>App</th>
                        <th>Best for</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={it.name} style={it.isQuoteMate ? { background: 'rgba(249, 115, 22, 0.06)' } : undefined}>
                          <td style={{ fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ fontWeight: it.isQuoteMate ? 700 : 600 }}>
                            {it.isQuoteMate
                              ? <>{it.name} <span style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700 }}>★ Top pick</span></>
                              : it.slug
                                ? <Link href={`/compare/${it.slug}`}>{it.name}</Link>
                                : it.name}
                          </td>
                          <td style={{ fontSize: '0.875rem' }}>{it.bestFor}</td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>{it.pricing}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {content?.sections?.slice(1).map((sec, i) => (
                <div key={i} className="guide-section">
                  <h2>{sec.heading}</h2>
                  <p>{sec.body}</p>
                </div>
              ))}

              {content?.faqs && content.faqs.length > 0 && (
                <div className="guide-section">
                  <h2>Frequently Asked Questions</h2>
                  <FAQ items={content.faqs} />
                </div>
              )}

              <div className="guide-cta-card">
                <h2>Try QuoteMate Free</h2>
                <p>Build your first professional quote in under 2 minutes with AI and live Australian supplier pricing. No credit card required.</p>
                <CTAButtons showWebLink />
              </div>
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              {related.map((group) => (
                <div key={group.heading} className="links-column">
                  <h3>{group.heading}</h3>
                  <ul>
                    {group.links.map((l) => (
                      <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: schemaName,
        description: schemaDescription,
        url: canonical,
        itemListElement: items.map((it, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: it.name,
        })),
      }) }} />

      {content?.faqs && content.faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        }) }} />
      )}
    </>
  );
}
