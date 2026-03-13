import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `You've been referred to QuoteMate`,
    description: `Use referral code ${code} to get started with QuoteMate — the AI-powered quoting app for Australian tradies.`,
    alternates: { canonical: `https://quotemateapp.au/ref/${code}` },
  };
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;

  return (
    <>
      <Header />
      <main>
        <section style={{ padding: '80px 20px 60px', textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 520, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: '#1a1a2e' }}>
              You&apos;ve been invited to QuoteMate
            </h1>

            <p style={{ fontSize: 18, color: '#555', lineHeight: 1.6, marginBottom: 32 }}>
              A mate reckons you&apos;ll love QuoteMate — the fastest way to create professional quotes and invoices for your trade business.
            </p>

            <div style={{
              background: '#fff7ed',
              border: '2px dashed #f97316',
              borderRadius: 12,
              padding: '24px 32px',
              marginBottom: 32,
            }}>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 500 }}>
                Your referral code
              </p>
              <p style={{
                fontSize: 32,
                fontWeight: 800,
                color: '#f97316',
                letterSpacing: 3,
                margin: 0,
              }}>
                {code}
              </p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 8, margin: '8px 0 0' }}>
                Enter this code in the app after signing up
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div className="hero-ctas" style={{ justifyContent: 'center' }}>
                <a href="/app" className="btn btn-store" aria-label="Try QuoteMate on the App Store">
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                  <span>
                    <small>Coming soon on the</small>
                    App Store
                  </span>
                </a>
                <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn btn-store" aria-label="Get it on Google Play" target="_blank" rel="noopener">
                  <svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                  <span>
                    <small>Get it on</small>
                    Google Play
                  </span>
                </a>
              </div>
              <a href="/app" style={{ color: '#f97316', fontWeight: 600, fontSize: 15 }}>Or try it on the web &rarr;</a>
            </div>

            <div style={{
              marginTop: 40,
              padding: '20px 24px',
              background: '#f8f9fa',
              borderRadius: 12,
              textAlign: 'left',
            }}>
              <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: '#1a1a2e' }}>How to use your referral code:</p>
              <ol style={{ margin: 0, paddingLeft: 20, color: '#555', fontSize: 14, lineHeight: 2 }}>
                <li>Download QuoteMate from the App Store or Google Play</li>
                <li>Create your free account</li>
                <li>Go to Settings &rarr; Refer a Friend</li>
                <li>Enter the code <strong style={{ color: '#f97316' }}>{code}</strong></li>
              </ol>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
