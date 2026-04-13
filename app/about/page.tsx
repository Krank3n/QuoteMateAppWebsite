import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import CTAButtons from '../components/CTAButtons';

export const metadata: Metadata = {
  title: 'About QuoteMate — Built for Australian Tradies',
  description: 'QuoteMate is an Australian-made quoting and invoicing app built specifically for tradies. Learn about our mission to help tradies quote smarter and win more jobs.',
  alternates: { canonical: 'https://quotemateapp.au/about' },
};

export default function AboutPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'About' },
            ]} />
            <div className="seo-hero-content">
              <h1 className="seo-hero-title">About QuoteMate</h1>
              <p className="seo-hero-subtitle">Australian-made software helping tradies quote smarter, win more jobs, and get paid faster.</p>
            </div>
          </div>
        </section>

        <section className="seo-guide-article">
          <div className="container">
            <div className="guide-content">
              <div className="guide-section">
                <h2>Our Story</h2>
                <p>QuoteMate was born out of a simple observation: Australian tradies spend too long on quotes. After talking to carpenters, electricians, plumbers, and builders across the country, one thing was clear &mdash; the existing tools were either too complicated, too expensive, or not built with tradies in mind.</p>
                <p style={{ marginTop: '16px' }}>So we built QuoteMate. A fast, simple quoting app that uses AI to suggest materials and pulls real-time pricing from major Australian suppliers. No spreadsheets, no complicated software &mdash; just professional quotes in under 2 minutes.</p>
              </div>

              <div className="guide-section">
                <h2>Built in Australia, for Australia</h2>
                <p>QuoteMate is designed from the ground up for the Australian market. That means GST calculations are built in, ABN support on every document, AUD pricing throughout, and integration with the suppliers Australian tradies actually use. We understand the way tradies work because we built this alongside them.</p>
              </div>

              <div className="guide-section">
                <h2>Our Mission</h2>
                <p>We believe every tradie deserves professional-looking quotes without needing an accounting degree or hours of admin time. Our mission is to help tradies spend less time on paperwork and more time doing what they do best &mdash; quality work.</p>
              </div>

              <div className="guide-section">
                <h2>What Makes Us Different</h2>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                  {[
                    'AI-powered material suggestions — describe any job and get an instant materials list',
                    'Real-time supplier pricing — no more guessing or using outdated price lists',
                    'Built for mobile — create quotes on-site, even offline',
                    'Simple pricing — no per-user fees, no hidden costs',
                    'Works across iOS, Android, and Web with one subscription',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', color: 'var(--color-text-tertiary)', fontSize: '0.9375rem', lineHeight: 1.7 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true" style={{ flexShrink: 0, marginTop: '3px' }}><polyline points="20 6 9 17 4 12"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="guide-section">
                <h2>Get in Touch</h2>
                <p>We&rsquo;d love to hear from you. Whether it&rsquo;s a feature request, a question, or just to say g&rsquo;day &mdash; drop us a line at <a href="mailto:hello@quotemateapp.au" style={{ color: 'var(--color-accent)' }}>hello@quotemateapp.au</a>.</p>
              </div>

              <div className="guide-cta-card">
                <h2>Ready to Try QuoteMate?</h2>
                <p>Start creating professional quotes in under 2 minutes. No credit card required.</p>
                <CTAButtons showWebLink />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
