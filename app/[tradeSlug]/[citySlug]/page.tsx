import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import FAQ from '../../components/FAQ';
import CTAButtons from '../../components/CTAButtons';
import { trades, cities, getTradeBySlug, getCityBySlug, getTradeFAQs } from '@/lib/data';

interface Props {
  params: Promise<{ tradeSlug: string; citySlug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const params: { tradeSlug: string; citySlug: string }[] = [];
  for (const trade of trades) {
    for (const city of cities) {
      params.push({ tradeSlug: `quotes-for-${trade.slug}`, citySlug: city.slug });
    }
  }
  return params;
}

function parseTradeSlug(slug: string) {
  return slug.replace(/^quotes-for-/, '');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tradeSlug, citySlug } = await params;
  const trade = getTradeBySlug(parseTradeSlug(tradeSlug));
  const city = getCityBySlug(citySlug);
  if (!trade || !city) return {};
  return {
    title: `${trade.name} Quoting App in ${city.name} ${city.state}`,
    description: `Create professional ${trade.keyword} quotes in ${city.name}. QuoteMate helps ${trade.name.toLowerCase()} in ${city.name} create accurate quotes with real-time Bunnings & Mitre 10 pricing.`,
    alternates: { canonical: `https://quotemateapp.au/quotes-for-${trade.slug}/${city.slug}` },
  };
}

const CheckSvg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

export default async function TradeCityPage({ params }: Props) {
  const { tradeSlug, citySlug } = await params;
  const trade = getTradeBySlug(parseTradeSlug(tradeSlug));
  const city = getCityBySlug(citySlug);
  if (!trade || !city) notFound();

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Trades', href: '/trades' },
              { label: trade.name, href: `/quotes-for-${trade.slug}` },
              { label: city.name },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">{trade.name} in {city.name}</span>
              <h1 className="seo-hero-title">{trade.heroTitle} in {city.name}</h1>
              <p className="seo-hero-subtitle">{trade.description.replace(/\.$/, '')} — tailored for {trade.name.toLowerCase()} working in {city.name}, {city.state}.</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-local">
          <div className="container">
            <div className="local-card">
              <h2>{trade.name} in {city.name}, {city.state}</h2>
              <p>{city.name} ({city.description}) is home to {city.population} residents. {city.localNote}, {trade.name.toLowerCase()} rely on QuoteMate to create professional quotes quickly and accurately.</p>
              <p>Whether you&rsquo;re quoting a small repair or a major {trade.keyword} project, QuoteMate&rsquo;s AI-powered quoting engine helps you price jobs accurately with real-time material costs from Bunnings and Mitre 10.</p>
            </div>
          </div>
        </section>

        <section className="seo-pain-point">
          <div className="container">
            <div className="pain-point-card">
              <h2>The Problem</h2>
              <p>{trade.painPoint}</p>
            </div>
          </div>
        </section>

        <section className="seo-features">
          <div className="container">
            <h2 className="section-title">How QuoteMate Helps {trade.name} in {city.name}</h2>
            <div className="seo-features-grid">
              {trade.features.map((feature, i) => (
                <div key={i} className="seo-feature-item">
                  <CheckSvg />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-common-jobs">
          <div className="container">
            <h2 className="section-title">Common {trade.keyword.charAt(0).toUpperCase() + trade.keyword.slice(1)} Jobs in {city.name}</h2>
            <div className="jobs-grid">
              {trade.commonJobs.map((job, i) => {
                const jobName = typeof job === 'string' ? job : job.name;
                const jobDesc = typeof job === 'string' ? `Quote ${job.toLowerCase()} jobs in ${city.name} quickly with QuoteMate.` : job.desc;
                return (
                  <div key={i} className="job-card">
                    <h3>{jobName}</h3>
                    <p>{jobDesc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={getTradeFAQs(trade)} />
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>{trade.name} in Other Cities</h3>
                <ul>
                  {cities.filter(c => c.slug !== city.slug).map((c) => (
                    <li key={c.slug}>
                      <Link href={`/quotes-for-${trade.slug}/${c.slug}`}>
                        {trade.name} in {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>Other Trades in {city.name}</h3>
                <ul>
                  {trades.filter(t => t.slug !== trade.slug).slice(0, 8).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/quotes-for-${t.slug}/${city.slug}`}>
                        {t.name} in {city.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="links-column">
                <h3>More {trade.name} Pages</h3>
                <ul>
                  <li><Link href={`/quotes-for-${trade.slug}`}>All {trade.name} Quoting</Link></li>
                  {trades.filter(t => t.slug !== trade.slug).slice(0, 6).map((t) => (
                    <li key={t.slug}>
                      <Link href={`/quotes-for-${t.slug}`}>{t.name}</Link>
                    </li>
                  ))}
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
