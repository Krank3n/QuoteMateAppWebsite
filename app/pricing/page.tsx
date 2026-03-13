import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';

export const metadata: Metadata = {
  title: 'Pricing — Quoting App for Australian Tradies',
  description: 'QuoteMate pricing plans: Free trial with no credit card, Pro Monthly at $29/month, or Pro Annual at $199/year (save 43%). Unlimited quotes, invoices, AI materials, and more.',
  alternates: { canonical: 'https://quotemateapp.au/pricing' },
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const features = [
  { name: 'Create quotes', free: true, pro: true },
  { name: 'Professional PDF template', free: true, pro: true },
  { name: 'Bunnings & Mitre 10 pricing', free: true, pro: true },
  { name: 'Cloud sync', free: true, pro: true },
  { name: 'Unlimited quotes & invoices', free: false, pro: true },
  { name: 'AI material & title generation', free: false, pro: true },
  { name: 'All PDF templates', free: false, pro: true },
  { name: 'Business logo on documents', free: false, pro: true },
  { name: 'Online quote acceptance', free: false, pro: true },
  { name: 'Invoice & payment tracking', free: false, pro: true },
  { name: 'Priority support', free: false, pro: true },
];

export default function PricingPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Pricing' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">Simple, Transparent Pricing</h1>
              <p className="seo-hero-subtitle">Start free with no credit card. Upgrade to Pro when you&rsquo;re ready to unlock everything.</p>
            </div>
          </div>
        </section>

        <section className="pricing" style={{ paddingTop: '48px' }}>
          <div className="container">
            <div className="pricing-grid pricing-grid-3">
              <div className="pricing-card">
                <div className="pricing-card-header">
                  <h2>Free</h2>
                  <div className="pricing-amount">
                    <span className="price">$0</span>
                    <span className="period">forever</span>
                  </div>
                  <p className="pricing-desc">Get started &mdash; no credit card required</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Create quotes (7-day trial)</li>
                  <li><CheckIcon /> Professional PDF template</li>
                  <li><CheckIcon /> Bunnings &amp; Mitre 10 pricing</li>
                  <li><CheckIcon /> Cloud sync</li>
                </ul>
                <a href="/app" className="btn btn-secondary pricing-btn">Get Started Free</a>
              </div>
              <div className="pricing-card pricing-card-pro">
                <div className="pricing-badge">MOST POPULAR</div>
                <div className="pricing-card-header">
                  <h2>Pro Monthly</h2>
                  <div className="pricing-amount">
                    <span className="price">$29</span>
                    <span className="period">/month</span>
                  </div>
                  <p className="pricing-desc">Cancel anytime</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Unlimited quotes &amp; invoices</li>
                  <li><CheckIcon /> AI material &amp; title generation</li>
                  <li><CheckIcon /> All PDF templates</li>
                  <li><CheckIcon /> Business logo on documents</li>
                  <li><CheckIcon /> Online quote acceptance</li>
                  <li><CheckIcon /> Priority support</li>
                </ul>
                <a href="/app" className="btn btn-primary pricing-btn">Subscribe to Pro</a>
              </div>
              <div className="pricing-card pricing-card-annual">
                <div className="pricing-badge pricing-badge-save">BEST VALUE</div>
                <div className="pricing-card-header">
                  <h2>Pro Annual</h2>
                  <div className="pricing-amount">
                    <span className="price">$199</span>
                    <span className="period">/year</span>
                  </div>
                  <p className="pricing-desc">That&rsquo;s just $16.58/month &mdash; save 43%</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Everything in Pro Monthly</li>
                  <li><CheckIcon /> Save $149 per year</li>
                  <li><CheckIcon /> Cancel anytime</li>
                </ul>
                <a href="/app" className="btn btn-primary pricing-btn">Subscribe Annually</a>
              </div>
            </div>

            {/* Feature comparison table */}
            <div className="comparison-table-wrap" style={{ marginTop: '64px' }}>
              <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>Feature Comparison</h2>
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Free</th>
                    <th>Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f, i) => (
                    <tr key={i}>
                      <td>{f.name}</td>
                      <td>{f.free ? <CheckIcon /> : <CrossIcon />}</td>
                      <td><CheckIcon /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="seo-faq" style={{ paddingBottom: '48px' }}>
          <div className="container">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '32px' }}>Pricing FAQ</h2>
            <div className="guide-content" style={{ maxWidth: '720px', margin: '0 auto' }}>
              {[
                { q: 'Is there really a free plan?', a: 'Yes! Sign up and start creating quotes immediately with no credit card. Free users get a 7-day trial to create quotes with real-time material pricing.' },
                { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your Pro subscription anytime from the app. You\'ll keep Pro access until the end of your billing period, then revert to Free.' },
                { q: 'Do I need to pay separately for each device?', a: 'No. One subscription works across iOS, Android, and Web. Buy on any platform, use on all of them.' },
                { q: 'Is GST included in the pricing?', a: 'The prices shown are in AUD. GST is included where applicable.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, Google Pay, and Apple Pay through the respective app stores.' },
              ].map((item, i) => (
                <div key={i} className="guide-section">
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="final-cta">
          <div className="container">
            <div className="final-cta-content">
              <h2 className="section-title">Ready to Get Started?</h2>
              <p className="section-subtitle">Join thousands of Australian tradies creating professional quotes with QuoteMate.</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "QuoteMate",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "iOS, Android, Web",
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "AUD", "name": "Free", "description": "7-day trial, no credit card required" },
          { "@type": "Offer", "price": "29", "priceCurrency": "AUD", "name": "Pro Monthly", "billingIncrement": "month" },
          { "@type": "Offer", "price": "199", "priceCurrency": "AUD", "name": "Pro Annual", "billingIncrement": "year" }
        ]
      })}} />
    </>
  );
}
