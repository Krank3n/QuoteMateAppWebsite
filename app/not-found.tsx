import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import ReferralContent from './components/ReferralContent';

export default function NotFound() {
  return (
    <>
      <Header homeLinks />
      <ReferralContent />
      <main id="not-found-content">
        <section className="seo-hero" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center' }}>
          <div className="container">
            <div className="seo-hero-content" style={{ textAlign: 'center' }}>
              <h1 className="seo-hero-title">Page Not Found</h1>
              <p className="seo-hero-subtitle">Sorry, we couldn&rsquo;t find what you&rsquo;re looking for. It might have been moved or no longer exists.</p>
              <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <Link href="/" className="btn btn-primary">Back to Home</Link>
                <Link href="/articles" className="btn btn-secondary">Read Quoting Guides</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
