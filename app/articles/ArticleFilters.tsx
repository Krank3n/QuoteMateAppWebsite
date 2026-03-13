'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Guide {
  slug: string;
  title: string;
  trade: string;
  description: string;
}

interface Trade {
  slug: string;
  name: string;
}

export default function ArticleFilters({ guides, trades }: { guides: Guide[]; trades: Trade[] }) {
  const [activeTrade, setActiveTrade] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Get only trades that have articles
  const tradesWithArticles = useMemo(() => {
    const tradeSlugs = new Set(guides.map((g) => g.trade));
    return trades.filter((t) => tradeSlugs.has(t.slug));
  }, [guides, trades]);

  const filtered = useMemo(() => {
    return guides.filter((guide) => {
      const matchesTrade = activeTrade === 'all' || guide.trade === activeTrade;
      const matchesSearch =
        !search ||
        guide.title.toLowerCase().includes(search.toLowerCase()) ||
        guide.description.toLowerCase().includes(search.toLowerCase());
      return matchesTrade && matchesSearch;
    });
  }, [guides, activeTrade, search]);

  return (
    <>
      <div className="article-filters">
        <div className="article-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="article-search-input"
            aria-label="Search articles"
          />
        </div>
        <div className="article-filter-pills">
          <button
            className={`filter-pill ${activeTrade === 'all' ? 'filter-pill-active' : ''}`}
            onClick={() => setActiveTrade('all')}
          >
            All ({guides.length})
          </button>
          {tradesWithArticles.map((trade) => {
            const count = guides.filter((g) => g.trade === trade.slug).length;
            return (
              <button
                key={trade.slug}
                className={`filter-pill ${activeTrade === trade.slug ? 'filter-pill-active' : ''}`}
                onClick={() => setActiveTrade(trade.slug)}
              >
                {trade.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="trade-directory-grid">
        {filtered.length === 0 ? (
          <p className="article-no-results">No articles found. Try a different search or filter.</p>
        ) : (
          filtered.map((guide) => {
            const trade = trades.find((t) => t.slug === guide.trade);
            return (
              <Link key={guide.slug} href={`/articles/${guide.slug}`} className="article-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/assets/articles/${guide.slug}.jpg`}
                  alt={guide.title}
                  className="article-card-image"
                  loading="lazy"
                  width={400}
                  height={225}
                />
                <div className="article-card-body">
                  <h2>{guide.title}</h2>
                  <p>{guide.description}</p>
                  {trade && (
                    <span className="trade-pill" style={{ marginTop: '12px', display: 'inline-block', fontSize: '0.75rem', padding: '4px 12px' }}>
                      {trade.name}
                    </span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
