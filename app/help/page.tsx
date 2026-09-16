import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import { getHelpArticles, getHelpCategories, getHelpLastUpdated } from '@/lib/help';

export const metadata: Metadata = {
  title: 'Help Centre',
  description: 'How to use QuoteMate: send your first quote, take card payments with Square, convert quotes to invoices, chase unpaid invoices, manage your subscription, and fix common problems.',
  alternates: { canonical: 'https://quotemateapp.au/help/' },
};

const CATEGORY_BLURB: Record<string, string> = {
  'getting-started': 'Sign up, set up your business, send the first one.',
  'quoting': 'Materials, prices, labour, GST and templates.',
  'invoicing-and-payments': 'Invoices, Square, pay links and chasing money.',
  'job-management': 'Jobs, stages and the pipeline.',
  'integrations': 'Xero, Square, Reece, Google Calendar and Katie.',
  'pricing-and-billing': 'Plans, the trial and your subscription.',
  'account-and-settings': 'Branding, your details and your data.',
  'troubleshooting': 'When something is not working.',
};

function secondsOf(duration: string): string {
  const m = duration.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
  return `${(Number(m?.[1] ?? 0) * 60) + Number(m?.[2] ?? 0)} s`;
}

export default function HelpIndex() {
  const groups = getHelpCategories();
  const faq = groups.find((g) => g.category.slug === 'faq')?.articles[0];
  const sections = groups.filter((g) => g.category.slug !== 'faq');
  const clips = getHelpArticles().flatMap((a) => a.videos.map((video) => ({ article: a, video })));
  const articleCount = getHelpArticles().length;

  return (
    <>
      <Header homeLinks />
      <main className="help-page">
        <section className="help-hero container">
          <div>
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Help' },
            ]} />
            <h1 className="help-title">Help Centre</h1>
            <p className="help-summary">Short, plain-English answers on quoting, getting paid, invoices, integrations and your account. Can&rsquo;t find it? Email <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a> and a real person replies.</p>
            <div className="help-hero-meta">
              <span>{articleCount} articles</span>
              <span>{clips.length} short videos</span>
              <span>Updated {new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(new Date(getHelpLastUpdated()))}</span>
            </div>
          </div>
          <nav className="help-jump" aria-label="Help topics">
            {faq && <Link href={`/help/${faq.slug}`} className="help-jump-faq">Quick answers &rarr;</Link>}
            {sections.map(({ category }) => (
              <a key={category.slug} href={`#${category.slug}`}>{category.name}</a>
            ))}
          </nav>
        </section>

        {clips.length > 0 && (
          <section className="help-watch container" aria-labelledby="help-watch-title">
            <div className="help-watch-head">
              <div>
                <h2 id="help-watch-title">Watch it done</h2>
                <p>Real screen recordings, under 30 seconds each.</p>
              </div>
              <span className="help-watch-hint" aria-hidden="true">Scroll &rarr;</span>
            </div>
            <div className="help-watch-grid">
              {clips.map(({ article, video }) => (
                <Link key={video.name} href={`/help/${article.slug}#video-${video.name}`} className="help-watch-card">
                  <span className="help-watch-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/assets/videos/help/${video.name}-poster.jpg`} alt="" loading="lazy" width={300} height={652} />
                    <span className="help-watch-play" aria-hidden="true">▶</span>
                    <span className="help-watch-len">{secondsOf(video.duration)}</span>
                  </span>
                  <span className="help-watch-title">{video.title.replace(/ (in|with) QuoteMate.*$/, '').replace(/ with Mate$/, '')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="help-categories container">
          {sections.map(({ category, articles }) => (
            <div key={category.slug} className="help-category-card" id={category.slug}>
              <h2>{category.name}</h2>
              {CATEGORY_BLURB[category.slug] && <p className="help-category-blurb">{CATEGORY_BLURB[category.slug]}</p>}
              <ul>
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link href={`/help/${article.slug}`}>
                      <span className="help-link-title">{article.title}{article.videos.length > 0 && <span className="help-link-video" title="Has a video">▶</span>}</span>
                      <span className="help-link-summary">{article.summary}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="help-footer-row container">
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
