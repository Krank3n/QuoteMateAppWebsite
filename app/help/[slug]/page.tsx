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

function secondsOf(duration: string): string {
  const m = duration.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
  const s = (Number(m?.[1] ?? 0) * 60) + Number(m?.[2] ?? 0);
  return `${s} s`;
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
  const showContents = article.headings.length >= 3;

  return (
    <>
      <Header homeLinks />
      <main className="help-page">
        <section className="help-hero container">
          <div>
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Help', href: '/help' },
              ...(isFaq ? [] : [{ label: article.category.name, href: `/help/#${article.category.slug}` }]),
              { label: article.title },
            ]} />
            <div className="help-hero-meta">
              <span className="seo-badge">{article.category.name}</span>
              <span>Updated {formatMonthYear(article.lastUpdated)}</span>
              <span>{article.readingMinutes} min read</span>
              {article.videos.length > 0 && <span className="help-hero-video">{article.videos.length === 1 ? `${secondsOf(article.videos[0].duration)} video` : `${article.videos.length} short videos`}</span>}
            </div>
            <h1 className="help-title">{article.title}</h1>
          </div>
        </section>

        <section className="help-layout container">
          <aside className="help-side">
            {showContents && (
              <nav className="help-contents" aria-label="On this page">
                <h2>On this page</h2>
                <ol>
                  {article.headings.map((h) => (
                    <li key={h.id}><a href={`#${h.id}`}>{h.text}</a></li>
                  ))}
                </ol>
              </nav>
            )}
            {article.videos.map((video) => (
              <figure className="help-video-card" key={video.name} id={`video-${video.name}`}>
                <WalkthroughPlayer
                  basePath="help"
                  slug={video.name}
                  poster={`/assets/videos/help/${video.name}-poster.jpg`}
                  label={video.title}
                />
                <figcaption>
                  <strong>{video.title.replace(/ in QuoteMate.*$/, '')}</strong>
                  <span>{video.description}</span>
                </figcaption>
              </figure>
            ))}
          </aside>

          <div className="help-main">
            <article className="help-article" dangerouslySetInnerHTML={{ __html: article.html }} />

            <div className="help-contact">
              <div>
                <h2>Still stuck?</h2>
                <p>Email <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a> with what you were trying to do and a screenshot if you have one. You get a reply from the person who builds the app.</p>
              </div>
            </div>

            <div className="help-cta">
              <h2>New here? Send a quote in under 2 minutes</h2>
              <p>Free plan, no card needed. Describe the job, check the priced materials list, send it from your phone.</p>
              <CTAButtons showWebLink />
            </div>

            {(siblings.length > 0 || !isFaq) && (
              <div className="help-related">
                {siblings.length > 0 && (
                  <div>
                    <h3>More in {article.category.name}</h3>
                    <ul>
                      {siblings.map((a) => (
                        <li key={a.slug}><Link href={`/help/${a.slug}`}>{a.title}</Link></li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <h3>Help Centre</h3>
                  <ul>
                    <li><Link href="/help">All help articles</Link></li>
                    {!isFaq && <li><Link href="/help/faq">Frequently asked questions</Link></li>}
                    <li><Link href="/pricing">Pricing</Link></li>
                    <li><Link href="/get-paid">Get Paid Faster</Link></li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {article.videos.map((video) => (
        <script key={video.name} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: video.title,
          description: video.description,
          thumbnailUrl: `https://quotemateapp.au/assets/videos/help/${video.name}-poster.jpg`,
          uploadDate: video.uploadDate,
          duration: video.duration,
          contentUrl: `https://quotemateapp.au/assets/videos/help/${video.name}.mp4`,
          embedUrl: `https://quotemateapp.au/help/${article.slug}/`,
          inLanguage: 'en-AU',
          publisher: { '@type': 'Organization', name: 'QuoteMate', url: 'https://quotemateapp.au', logo: { '@type': 'ImageObject', url: 'https://quotemateapp.au/assets/logo.png' } },
        })}} />
      ))}
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
