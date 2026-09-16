'use client';

import { useEffect, useRef, useState } from 'react';

// Filters the server-rendered Help Centre index as you type. Every article
// <li> carries data-search (title + summary + keywords, lower-cased); a
// category card hides when none of its articles match. No data is fetched:
// the whole index is already in the page.
export default function HelpSearch({ total }: { total: number }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(total);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-search]'));
    let visible = 0;
    for (const item of items) {
      const hay = item.dataset.search ?? '';
      const match = terms.every((t) => hay.includes(t));
      item.hidden = !match;
      if (match) visible += 1;
    }
    for (const card of Array.from(document.querySelectorAll<HTMLElement>('.help-category-card'))) {
      const any = Array.from(card.querySelectorAll<HTMLElement>('[data-search]')).some((i) => !i.hidden);
      card.hidden = !any;
    }
    document.body.classList.toggle('help-searching', terms.length > 0);
    setShown(visible);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="help-search">
      <label className="help-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help, e.g. Xero, refund, GST"
          aria-label="Search help articles"
          autoComplete="off"
        />
        {query ? (
          <button type="button" className="help-search-clear" onClick={() => setQuery('')} aria-label="Clear search">Clear</button>
        ) : (
          <kbd aria-hidden="true">/</kbd>
        )}
      </label>
      <p className="help-search-status" role="status" aria-live="polite">
        {query.trim()
          ? (shown === 0 ? 'No articles match. Try another word, or email us below.' : `${shown} of ${total} articles`)
          : `${total} articles`}
      </p>
    </div>
  );
}
