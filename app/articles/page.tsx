import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import ArticleFilters from './ArticleFilters';
import { guides, trades } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Quoting Guides for Australian Tradies',
  description: 'Free quoting guides and tips for Australian tradies. Learn how to quote bathroom renovations, deck builds, fences, kitchens, and more — with real costs and pricing advice.',
  alternates: { canonical: 'https://quotemateapp.au/articles' },
};

export default function ArticlesIndex() {
  // Pass serialisable data to the client component
  const guidesData = guides.map((g) => ({
    slug: g.slug,
    title: g.title,
    trade: g.trade,
    description: g.description,
  }));

  const tradesData = trades.map((t) => ({
    slug: t.slug,
    name: t.name,
  }));

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Articles' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Quoting Guides &amp; Tips</h1>
              <p className="seo-hero-subtitle">Practical guides to help Australian tradies quote accurately, win more jobs, and get paid faster.</p>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <ArticleFilters guides={guidesData} trades={tradesData} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
