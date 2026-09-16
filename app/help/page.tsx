import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import HelpSearch from '../components/HelpSearch';
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
  'job-management': 'Jobs, stages, photos and the pipeline.',
  'integrations': 'Xero, Square, Reece, Google Calendar and Katie.',
  'pricing-and-billing': 'Plans, the trial and your subscription.',
  'account-and-settings': 'Branding, your details and your data.',
  'troubleshooting': 'When something is not working.',
};

// One line icon per category (24px grid, stroke only).
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'getting-started': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  'quoting': <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h5" /></>,
  'invoicing-and-payments': <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M6 15h4" /></>,
  'job-management': <><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3 6 1.5 1.5L7 5" /><path d="m3 12 1.5 1.5L7 11" /><circle cx="4.5" cy="18" r="1" /></>,
  'integrations': <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></>,
  'pricing-and-billing': <><circle cx="12" cy="12" r="9" /><path d="M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.5 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5" /><path d="M12 6v2M12 16v2" /></>,
  'account-and-settings': <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  'troubleshooting': <><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.1-2.1z" /></>,
};

function secondsOf(duration: string): string {
  const m = duration.match(/^PT(?:(\d+)M)?(?:(\d+)S)?$/);
  return `${(Number(m?.[1] ?? 0) * 60) + Number(m?.[2] ?? 0)} s`;
}

function searchText(a: { title: string; summary: string; keywords: string[]; category: { name: string } }): string {
  return [a.title, a.summary, a.category.name, ...a.keywords].join(' ').toLowerCase();
}

export default function HelpIndex() {
  const groups = getHelpCategories();
  const faq = groups.find((g) => g.category.slug === 'faq')?.articles[0];
  const sections = groups.filter((g) => g.category.slug !== 'faq');
  const articles = getHelpArticles();
  const clips = articles.flatMap((a) => a.videos.map((video) => ({ article: a, video })));
  const updated = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(new Date(getHelpLastUpdated()));

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
            <h1 className="help-title">How can we help?</h1>
            <p className="help-summary">Short, plain-English answers on quoting, getting paid, invoices, integrations and your account. Written by the person who builds the app.</p>
            <HelpSearch total={articles.length} />
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
            <div className="help-watch-panel">
              <div className="help-watch-head">
                <div>
                  <h2 id="help-watch-title">Watch it done</h2>
                  <p>{clips.length} real screen recordings, each under 30 seconds.</p>
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
            </div>
          </section>
        )}

        <section className="help-categories container" aria-label="Help articles by topic">
          {sections.map(({ category, articles: list }) => (
            <div key={category.slug} className="help-category-card" id={category.slug}>
              <div className="help-category-head">
                <span className="help-category-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{CATEGORY_ICON[category.slug]}</svg>
                </span>
                <div>
                  <h2>{category.name}</h2>
                  {CATEGORY_BLURB[category.slug] && <p className="help-category-blurb">{CATEGORY_BLURB[category.slug]}</p>}
                </div>
              </div>
              <ul>
                {list.map((article) => (
                  <li key={article.slug} data-search={searchText(article)}>
                    <Link href={`/help/${article.slug}`}>
                      <span className="help-link-title">{article.title}{article.videos.length > 0 && <span className="help-link-video" title="Has a video">▶</span>}</span>
                      <span className="help-link-summary">{article.summary}</span>
                      <span className="help-link-arrow" aria-hidden="true">&rarr;</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="help-search-empty">Nothing matches that search. Try a different word, or ask below.</p>
        </section>

        <section className="help-footer-row container">
          <div className="help-contact">
            <div>
              <h2>Still stuck?</h2>
              <p>Email <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a> with what you were trying to do and a screenshot if you have one. You get a reply from the person who builds the app.</p>
              <p className="help-contact-meta">Help Centre updated {updated}.</p>
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
