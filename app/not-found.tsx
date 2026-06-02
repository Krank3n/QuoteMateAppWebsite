import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import ReferralContent from './components/ReferralContent';

// SPA fallback for the Expo web app served from /app.
// The app is a single-page React Navigation build (only /app/index.html exists
// on disk), but in-app navigation pushes client-side URLs like /app/quotes.
// On a hard refresh DigitalOcean can't find that file and serves this 404
// page. This script catches any /app/* path, stashes the intended route, and
// bounces into /app/ where index.html restores it — so refresh stays inside
// the app instead of dead-ending on the marketing 404. Runs synchronously as
// the first element in the body, before any 404 UI paints.
const spaFallback = `(function(){try{var l=window.location,p=l.pathname;` +
  `if(p==='/app'||p.indexOf('/app/')===0){` +
  `var sub=p.replace(/^\\/app/,'')||'/';` +
  `sessionStorage.setItem('qm_spa_redirect',sub+l.search+l.hash);` +
  `l.replace('/app/');}}catch(e){}})();`;

export default function NotFound() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: spaFallback }} />
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
