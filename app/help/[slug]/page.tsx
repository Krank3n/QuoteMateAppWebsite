import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import CTAButtons from '../../components/CTAButtons';
import WalkthroughPlayer from '../../components/WalkthroughPlayer';
import { getHelpArticles, getHelpArticleBySlug } from '@/lib/help';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

function formatMonthYear(iso: string): string {
  return new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(new Date(iso));
}

export async function generateStaticParams() {
  return getHelpArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} | QuoteMate Help`,
    description: article.summary,
    alternates: { canonical: `https://quotemateapp.au/help/${article.slug}/` },
  };
}

export default async function HelpArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);
  if (!article) notFound();

  const siblings = getHelpArticles().filter(
    (a) => a.category.slug === article.category.slug && a.slug !== article.slug,
  );
  const isFaq = article.category.slug === 'faq';

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Help', href: '/help' },
              ...(isFaq ? [] : [{ label: article.category.name, href: `/help/#${article.category.slug}` }]),
              { label: article.title },
            ]} />
            <div className="seo-hero-content">
              <div className="blog-meta">
                <span className="seo-badge">{article.category.name}</span>
                <span className="blog-meta-text">Updated {formatMonthYear(article.lastUpdated)}</span>
              </div>
              <h1 className="seo-hero-title">{article.title}</h1>
            </div>
          </div>
        </section>

        <section className="seo-guide-article">
          <div className="container">
            <div className="guide-content">
              {article.video && (
                <figure className="help-video">
                  <WalkthroughPlayer
                    basePath="help"
                    slug={article.video.name}
                    poster={`/assets/videos/help/${article.video.name}-poster.jpg`}
                    label={article.video.title}
                  />
                  <figcaption>{article.video.description}</figcaption>
                </figure>
              )}
              <article className="help-article" dangerouslySetInnerHTML={{ __html: article.html }} />

              <div className="help-contact">
                <h2>Still stuck?</h2>
                <p>Email <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a> with what you were trying to do and a screenshot if you have one. You get a reply from the person who builds the app.</p>
              </div>

              <div className="guide-cta-card">
                <h2>New here? Send a quote in under 2 minutes</h2>
                <p>Free plan, no card needed. Describe the job, check the priced materials list, send it from your phone.</p>
                <CTAButtons showWebLink />
              </div>
            </div>
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              {siblings.length > 0 && (
                <div className="links-column">
                  <h3>More in {article.category.name}</h3>
                  <ul>
                    {siblings.map((a) => (
                      <li key={a.slug}><Link href={`/help/${a.slug}`}>{a.title}</Link></li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="links-column">
                <h3>Help Centre</h3>
                <ul>
                  <li><Link href="/help">All help articles</Link></li>
                  {!isFaq && <li><Link href="/help/faq">Frequently asked questions</Link></li>}
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/get-paid">Get Paid Faster</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {article.video && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: article.video.title,
          description: article.video.description,
          thumbnailUrl: `https://quotemateapp.au/assets/videos/help/${article.video.name}-poster.jpg`,
          uploadDate: article.video.uploadDate,
          duration: article.video.duration,
          contentUrl: `https://quotemateapp.au/assets/videos/help/${article.video.name}.mp4`,
          embedUrl: `https://quotemateapp.au/help/${article.slug}/`,
          inLanguage: 'en-AU',
          publisher: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au', logo: { '@type': 'ImageObject', url: 'https://quotemateapp.au/assets/logo.png' } },
        })}} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: article.title,
        description: article.summary,
        dateModified: article.lastUpdated,
        keywords: article.keywords.join(', '),
        inLanguage: 'en-AU',
        mainEntityOfPage: `https://quotemateapp.au/help/${article.slug}/`,
        author: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au' },
        publisher: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au', logo: { '@type': 'ImageObject', url: 'https://quotemateapp.au/assets/logo.png' } },
      })}} />
    </>
  );
}
