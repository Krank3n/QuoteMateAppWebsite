'use client';

import { useId, useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
}

export default function FAQ({ items }: FAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const baseId = useId();

  function toggle(index: number) {
    setActiveIndex(activeIndex === index ? null : index);
  }

  return (
    <div className="faq-list">
      {items.map((item, i) => {
        const answerId = `${baseId}-answer-${i}`;
        const questionId = `${baseId}-question-${i}`;
        const isOpen = activeIndex === i;
        return (
          <div key={i} className={`faq-item${isOpen ? ' active' : ''}`}>
            <button
              id={questionId}
              className="faq-question"
              aria-expanded={isOpen}
              aria-controls={answerId}
              onClick={() => toggle(i)}
            >
              <span>{item.question}</span>
              <svg className="faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div id={answerId} role="region" aria-labelledby={questionId} className="faq-answer">
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
