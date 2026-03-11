'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <div className="faq-list">
      {items.map((item, i) => (
        <div key={i} className={`faq-item${activeIndex === i ? ' active' : ''}`}>
          <button
            className="faq-question"
            aria-expanded={activeIndex === i}
            onClick={() => toggle(i)}
          >
            <span>{item.question}</span>
            <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div className="faq-answer" role="region">
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
