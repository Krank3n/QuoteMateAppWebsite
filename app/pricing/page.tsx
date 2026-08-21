import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';
import FoundingPriceNote from '../components/FoundingPriceNote';

export const metadata: Metadata = {
  title: 'Pricing — Quoting App for Australian Tradies',
  description: 'QuoteMate pricing plans: Free forever with no credit card (Square payments), Pro Monthly at $49/month, or Pro Annual at $328/year (save 44%). 14-day Pro trial included. Unlimited quotes, invoices, AI materials, and more.',
  alternates: { canonical: 'https://quotemateapp.au/pricing' },
};

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

const CrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const features = [
  { name: 'Unlimited quotes & invoices', free: true, pro: true },
  { name: 'Professional PDF template', free: true, pro: true },
  { name: 'Live supplier pricing', free: true, pro: true },
  { name: 'Cloud sync', free: true, pro: true },
  { name: 'Online card payments via Square', free: true, pro: true },
  { name: 'Bank Transfer, PayID, BPAY, PayPal', free: false, pro: true },
  { name: 'Lower Square fee (1% vs 1.7%)', free: false, pro: true },
  { name: 'AI material & title generation', free: false, pro: true },
  { name: 'All PDF templates', free: false, pro: true },
  { name: 'Business logo on documents', free: false, pro: true },
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
                  <p className="pricing-desc">No credit card. Customers pay online via Square (1.7% platform fee added to their bill).</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Unlimited quotes &amp; invoices</li>
                  <li><CheckIcon /> Online card payments via Square</li>
                  <li><CheckIcon /> Professional PDF template</li>
                  <li><CheckIcon /> Live supplier pricing</li>
                  <li><CheckIcon /> Cloud sync</li>
                </ul>
                <a href="/app" className="btn btn-secondary pricing-btn">Get Started Free</a>
              </div>
              <div className="pricing-card pricing-card-pro">
                <div className="pricing-badge">MOST POPULAR</div>
                <div className="pricing-card-header">
                  <h2>Pro Monthly</h2>
                  <div className="pricing-amount">
                    <span className="price">$49</span>
                    <span className="period">/month</span>
                  </div>
                  <p className="pricing-desc"><FoundingPriceNote period="monthly" />14-day free trial. Cancel anytime.</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Everything in Free</li>
                  <li><CheckIcon /> Bank Transfer, PayID, BPAY, PayPal</li>
                  <li><CheckIcon /> Lower Square fee (1% vs 1.7%)</li>
                  <li><CheckIcon /> AI material &amp; title generation</li>
                  <li><CheckIcon /> All PDF templates</li>
                  <li><CheckIcon /> Business logo on documents</li>
                  <li><CheckIcon /> Priority support</li>
                </ul>
                <a href="/app" className="btn btn-primary pricing-btn">Start 14-Day Free Trial</a>
              </div>
              <div className="pricing-card pricing-card-annual">
                <div className="pricing-badge pricing-badge-save">BEST VALUE</div>
                <div className="pricing-card-header">
                  <h2>Pro Annual</h2>
                  <div className="pricing-amount">
                    <span className="price">$328</span>
                    <span className="period">/year</span>
                  </div>
                  <p className="pricing-desc"><FoundingPriceNote period="yearly" />Equivalent to $27.33/month, billed annually.</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Everything in Pro Monthly</li>
                  <li><CheckIcon /> Save $260 per year</li>
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
                { q: 'Is there really a free plan?', a: 'Yes — fully free forever. Send unlimited quotes and invoices and let customers pay online via Square (a small 1.7% platform fee is added to the customer’s bill). New users also get a 14-day Pro trial so you can try every feature before deciding.' },
                { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel your Pro subscription anytime from the app. You\'ll keep Pro access until the end of your billing period, then revert to Free.' },
                { q: 'Do I need to pay separately for each device?', a: 'No. One subscription works across iOS, Android, and Web. Buy on any platform, use on all of them.' },
                { q: 'Is GST included in the pricing?', a: 'The prices shown are in AUD. GST is included where applicable.' },
                { q: 'What payment methods do you accept?', a: 'All major credit and debit cards through our secure web checkout, or Google Pay and Apple Pay if you subscribe inside the app. One subscription works across web, iOS, and Android.' },
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
              <p className="section-subtitle">Join hundreds of Australian tradies creating professional quotes with QuoteMate.</p>
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
          { "@type": "Offer", "price": "0", "priceCurrency": "AUD", "name": "Free", "description": "Free forever. Customers pay online via Square (1.7% platform fee added to their bill). No credit card required." },
          { "@type": "Offer", "price": "49", "priceCurrency": "AUD", "name": "Pro Monthly", "billingIncrement": "month" },
          { "@type": "Offer", "price": "328", "priceCurrency": "AUD", "name": "Pro Annual", "billingIncrement": "year" }
        ]
      })}} />
    </>
  );
}
