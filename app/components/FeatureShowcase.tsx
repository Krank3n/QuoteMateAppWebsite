import { ReactNode } from 'react';

interface FeatureShowcaseProps {
  id: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  features: string[];
  reversed?: boolean;
  icon?: ReactNode;
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

export default function FeatureShowcase({ id, title, titleAccent, subtitle, features, reversed = false, icon }: FeatureShowcaseProps) {
  return (
    <section className={`feature-showcase${reversed ? ' feature-showcase-reversed' : ''}`} id={id}>
      <div className="container">
        <div className="feature-showcase-grid">
          <div className="feature-showcase-content" data-reveal="">
            {icon && <div className="feature-showcase-icon">{icon}</div>}
            <h2 className="section-title">{title} <span className="text-gradient">{titleAccent}</span></h2>
            <p className="feature-showcase-subtitle">{subtitle}</p>
          </div>
          <div className="feature-showcase-list" data-reveal="">
            {features.map((feature, i) => (
              <div key={i} className="feature-showcase-item">
                <CheckIcon />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
