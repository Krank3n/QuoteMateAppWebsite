import type { Metadata } from 'next';
import Link from 'next/link';
import './home-engineered.css';
import EngHomeClient from './components/EngHomeClient';
import EngEmailSignup from './components/EngEmailSignup';
import EngContactForm from './components/EngContactForm';

export const metadata: Metadata = {
  alternates: { canonical: 'https://quotemateapp.au' },
};

const faqItems = [
  { question: 'What trades does QuoteMate support?', answer: "QuoteMate is built for all trades including carpentry, plumbing, electrical, building, cleaning, and general contracting. Our smart templates cover common jobs like decks, fences, pergolas, bathroom renovations, and more." },
  { question: 'How does the AI quoting work?', answer: "Simply describe the job in plain English — like 'Build a 4x3 metre hardwood deck with stairs' — and QuoteMate's AI will suggest all the materials and quantities you need, with real-time pricing from major Australian suppliers." },
  { question: 'How does live supplier pricing work?', answer: 'QuoteMate pulls real-time prices directly from leading Australian hardware and trade suppliers. You can also import your own supplier price lists from a photo or PDF, save personal trade rates, and search the web for pricing on specialty items.' },
  { question: 'Does QuoteMate integrate with Xero?', answer: 'Yes! Push invoices to Xero in one tap, auto-create contacts, record payments, and bulk sync multiple invoices. You can also export Xero-compatible CSVs if you prefer manual import.' },
  { question: 'Is my data secure?', answer: 'Absolutely. QuoteMate uses Firebase with enterprise-grade encryption. Your data is securely stored in the cloud and synced across your devices. We never share your business data with third parties.' },
  { question: 'Can I use it offline?', answer: "Yes! Create and edit quotes without an internet connection. Everything syncs automatically when you're back online — perfect for remote job sites." },
  { question: 'How does the free plan and trial work?', answer: "Sign up with no credit card. You're on the Free plan forever — send unlimited quotes and invoices, with customers paying online via Square (a small 1.7% platform fee is added to their bill). New users also get a 14-day Pro trial automatically when they create their first quote, so you can try every feature (bank/PayID/BPAY/PayPal options, AI material generation, all PDF templates, lower Square rate) before deciding whether to upgrade." },
  { question: 'Can I track invoices and payments?', answer: 'Yes. Track invoice status (draft, sent, paid, partial, overdue), record partial payments and deposits, and get automatic overdue detection. Support for bank transfer, PayID, BPAY, PayPal, card, cash, and cheque.' },
  { question: 'Can I manage jobs after the quote is sent?', answer: 'Yes. QuoteMate tracks every job through a 9-stage pipeline (inquiry, quoted, accepted, scheduled, in progress, completed, paid, closed, cancelled) with scheduling, on-site photos with annotation, job checklists, and automated quote follow-ups. Scheduled jobs sync to Google Calendar so they show up on your phone, ute, and any shared calendars.' },
  { question: 'Does it calculate GST?', answer: 'Yes. QuoteMate automatically calculates and displays GST on all quotes and invoices, keeping you compliant with Australian tax requirements.' },
  { question: 'Can I add my business logo?', answer: 'Yes! Upload your logo and add your business name, ABN, and payment details. Every quote and invoice you send will look professional and on-brand.' },
];

const trades = [
  { slug: 'electricians', name: 'Electricians' },
  { slug: 'plumbers', name: 'Plumbers' },
  { slug: 'carpenters', name: 'Carpenters' },
  { slug: 'painters', name: 'Painters' },
  { slug: 'landscapers', name: 'Landscapers' },
  { slug: 'builders', name: 'Builders' },
  { slug: 'roofers', name: 'Roofers' },
  { slug: 'tilers', name: 'Tilers' },
  { slug: 'concreters', name: 'Concreters' },
  { slug: 'fencers', name: 'Fencers' },
  { slug: 'cleaners', name: 'Cleaners' },
  { slug: 'hvac-technicians', name: 'HVAC Techs' },
  { slug: 'renderers', name: 'Renderers' },
  { slug: 'glaziers', name: 'Glaziers' },
  { slug: 'solar-installers', name: 'Solar Installers' },
  { slug: 'cabinet-makers', name: 'Cabinet Makers' },
  { slug: 'plasterers', name: 'Plasterers' },
  { slug: 'flooring-installers', name: 'Flooring' },
  { slug: 'locksmiths', name: 'Locksmiths' },
  { slug: 'pest-controllers', name: 'Pest Control' },
  { slug: 'demolishers', name: 'Demolition' },
  { slug: 'garage-door-installers', name: 'Garage Doors' },
  { slug: 'welders', name: 'Welders' },
  { slug: 'arborists', name: 'Arborists' },
];

const CheckSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function HomePage() {
  return (
    <div className="eng-home">
      {/* ── TOPBAR ── */}
      <header className="topbar">
        <input type="checkbox" id="navtoggle" className="navtoggle" />
        <div className="brand">
          <img className="mark" src="/assets/logo.png" alt="QuoteMate logo" />
          <span className="name">QuoteMate</span>
        </div>
        <nav className="nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#trades">Trades</a>
          <a href="#faq">FAQ</a>
          <a href="/articles">Articles</a>
        </nav>
        <div className="nav-cta">
          <a href="/portal" className="btn ghost">Supplier Portal</a>
          <a href="#download" className="btn prim">Download App</a>
        </div>
        <label className="hamburger" htmlFor="navtoggle" aria-label="Toggle menu">
          <span></span><span></span><span></span>
        </label>
        <div className="mobile-menu">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#trades">Trades</a>
          <a href="#faq">FAQ</a>
          <a href="/articles">Articles</a>
          <a href="/portal" className="btn ghost">Supplier Portal</a>
          <a href="#download" className="btn prim">Download App</a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero" id="hero">
        <div className="bg">
          <div className="grid-bg"></div>
          <div className="glow"></div>
          <div className="glow2"></div>
          <div className="grain"></div>
          <div className="radar"></div>
          <span className="cross" style={{ top: '33%', left: '32%' }}></span>
          <span className="cross" style={{ top: '62%', left: '21%' }}></span>
          <span className="cross" style={{ top: '22%', left: '54%' }}></span>
          <span className="bp" style={{ top: '26px', left: '28px' }}>QM // EST.2026 · AU</span>
          <span className="bp" style={{ bottom: '96px', right: '30px' }}>fig.01 — quote pipeline</span>
          <div className="dim" style={{ bottom: '120px', left: '34px', width: '150px' }}>
            <i></i>2400mm<i></i>
          </div>
        </div>
        <div className="hero-wrap">
          <div>
            <span className="tag">
              <span className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
              <span><b>5.0</b> on Google Reviews</span>
            </span>
            <h1>Don&apos;t quote at night <span className="moon"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg></span><br />Quote <span className="hl">On-site</span></h1>
            <p className="sub">Describe the work in plain English. QuoteMate resolves the materials, pulls today&apos;s supplier prices, computes GST and markup, and ships a branded quote.</p>
            <div className="ctas">
              <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn btn-store-lg">
                <svg width="18" height="22" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true">
                  <path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z" />
                </svg>
                <span><small>Download on the</small>App Store</span>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn btn-store-lg">
                <svg width="18" height="20" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true">
                  <path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z" />
                </svg>
                <span><small>Get it on</small>Google Play</span>
              </a>
            </div>
            <a href="/app" className="hero-web">Try it free on the web &rarr;</a>
          </div>

          {/* Quote window */}
          <div className="win">
            <div className="win-bar">
              <div className="dots"><i></i><i></i><i></i></div>
              <span className="tab">Q-016 — Door hanging</span>
              <span className="live"><span className="d"></span> live pricing</span>
            </div>
            <div className="win-body">
              {/* Screen 1: Materials */}
              <div className="screen s-mat">
                <div className="doc-sec">
                  <span className="h">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#009868" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    {' '}Materials (9)
                  </span>
                  <span className="edit">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </span>
                </div>
                <div className="sectag">Internal Door Opening</div>
                <div className="li">
                  <div><div className="nm">Internal Hollow Core Door 2040&times;820</div><div className="meta">4 each &times; $48.60 <span className="src bunnings">Bunnings</span></div></div>
                  <div className="amt">$194.40</div>
                </div>
                <div className="li">
                  <div><div className="nm">Chrome Lever-on-Rose Handle Set</div><div className="meta">4 each &times; $45.75 <span className="src reece">Reece</span></div></div>
                  <div className="amt">$183.00</div>
                </div>
                <div className="li">
                  <div><div className="nm">Tubular Latch + Chrome Striker 60mm</div><div className="meta">4 each &times; $9.28 <span className="src custom">Custom</span></div></div>
                  <div className="amt">$37.12</div>
                </div>
                <div className="li">
                  <div><div className="nm">Primed Pine Architrave 66&times;18mm</div><div className="meta">6 m &times; $16.38 <span className="src bunnings">Bunnings</span></div></div>
                  <div className="amt">$98.28</div>
                </div>
                <div className="more">+ 5 more items</div>
                <div className="docdiv"></div>
                <div className="drow"><span className="l">Materials subtotal</span><span className="v">$602.01</span></div>
              </div>

              {/* Screen 2: PDF */}
              <div className="screen s-pdf">
                <div className="pdf-page">
                  <div className="pdf-top"><b>QuoteMate</b><span>QUOTE</span></div>
                  <div className="pdf-meta"><b>Q-016</b> &middot; 23 Jun 2026<br />For: Jacinta M.</div>
                  <div className="pdf-line"><span>Door hanging — materials</span><span>$602.01</span></div>
                  <div className="pdf-line"><span>Labour &middot; 8 hrs</span><span>$680.00</span></div>
                  <div className="pdf-line"><span>GST (10%)</span><span>$128.20</span></div>
                  <div className="pdf-total"><span>Total</span><span>$1,410.21</span></div>
                  <div className="pdf-foot">Valid 30 days &middot; Prices incl. GST &middot; ABN 12 345 678 901</div>
                </div>
              </div>

              {/* Screen 3: Email */}
              <div className="screen s-email">
                <div className="mail-hd">New message</div>
                <div className="mail-row"><span className="mk">To</span><span>jacinta.m@email.com</span></div>
                <div className="mail-row"><span className="mk">Subject</span><span>Your quote — door hanging</span></div>
                <div className="mail-body">Hi Jacinta,<br /><br />Thanks for the opportunity. Your quote for the door hanging is attached — happy to talk it through whenever suits.</div>
                <div className="mail-attach">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                  {' '}Quote-Q016.pdf &middot; 142 KB
                </div>
                <div className="mail-send">
                  <span className="btn-send">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {' '}Send
                  </span>
                </div>
              </div>

              {/* Screen 4: Sent */}
              <div className="screen s-sent">
                <div className="sent-ic">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#009868" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="sent-h">Sent to Jacinta</div>
                <div className="sent-sub">Q-016 &middot; $1,410.21 &middot; just now</div>
                <div className="sent-status"><span className="d"></span> Awaiting response</div>
              </div>

              {/* Screen 5: Tap to Pay */}
              <div className="screen s-pay">
                <div className="pay-amt">$1,410.21</div>
                <div className="pay-sub">Q-016 &middot; Jacinta M.</div>
                <div className="pay-nfc">
                  <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 8.5a9 9 0 0 1 0 7" />
                    <path d="M10 6a14 14 0 0 1 0 12" />
                    <path d="M14 4.5a18 18 0 0 1 0 15" />
                  </svg>
                </div>
                <div className="pay-hint">Tap card or phone to pay</div>
                <div className="pay-sq">Powered by Square</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="stats">
          <div><b>99.9%</b> uptime</div>
          <div><b>&lt; 2 min</b> / quote</div>
          <div><b>24</b> trades</div>
          <div><b>GST</b>-ready</div>
          <div><b>live</b> supplier pricing</div>
        </div>
      </section>

      {/* ── INTEGRATIONS ── */}
      <section className="section" id="integrations">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// integrations &amp; partners</span>
            <h2 className="sectitle">Works with the tools you <span className="acc">already use</span></h2>
          </div>
        </div>
        <div className="marquee">
          <div className="mtrack">
            <ul className="mgroup">
              <li className="mcard"><img src="/assets/partners/xero.png" alt="Xero" /></li>
              <li className="mcard"><img src="/assets/partners/square.png" alt="Square" /></li>
              <li className="mcard"><img src="/assets/partners/callkatie.svg" alt="CallKatie" /></li>
              <li className="mcard"><img src="/assets/partners/google-calendar.svg" alt="Google Calendar" /></li>
              <li className="mcard"><img src="/assets/partners/reece.png" alt="Reece maX" /></li>
            </ul>
            <ul className="mgroup" aria-hidden="true">
              <li className="mcard"><img src="/assets/partners/xero.png" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/square.png" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/callkatie.svg" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/google-calendar.svg" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/reece.png" alt="" /></li>
            </ul>
            <ul className="mgroup" aria-hidden="true">
              <li className="mcard"><img src="/assets/partners/xero.png" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/square.png" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/callkatie.svg" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/google-calendar.svg" alt="" /></li>
              <li className="mcard"><img src="/assets/partners/reece.png" alt="" /></li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── WALKTHROUGH VIDEO ── */}
      <section className="section" id="walkthrough">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// walkthrough</span>
            <h2 className="sectitle">Watch it build a quote <span className="acc">in real time</span></h2>
            <p className="secsub">The real app, start to finish — from a spoken job description to a quote your customer accepts online.</p>
          </div>
          <div className="video-wrap">
            <div className="phone">
              <div className="notch"></div>
              <div className="screen">
                <video id="qm-walk" autoPlay muted loop playsInline preload="metadata" poster="/assets/videos/walkthrough-poster.jpg">
                  <source src="/assets/videos/walkthrough.webm" type="video/webm" />
                  <source src="/assets/videos/walkthrough.mp4" type="video/mp4" />
                </video>
                <div className="video-paused-overlay" style={{ display: 'none' }}></div>
                <div className="video-controls">
                  <button className="vc-btn" data-a="play" aria-label="Play">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                  </button>
                  <button className="vc-btn" data-a="reset" aria-label="Restart">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                  <button className="vc-btn" data-a="mute" aria-label="Mute">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  </button>
                  <button className="vc-btn" data-a="full" aria-label="Fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>
                <div className="video-progress">
                  <div className="video-progress-track">
                    <div className="video-progress-fill"></div>
                    <div className="video-progress-thumb"></div>
                  </div>
                </div>
                <div className="tap-for-sound">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                  <span>Tap for sound</span>
                </div>
              </div>
            </div>
            <div className="vtimeline">
              <div className="vt" data-t="52"><span className="tc">0:52</span><span className="lab">Describe the job<span>Voice-to-text or type it out on-site</span></span></div>
              <div className="vt" data-t="100"><span className="tc">1:40</span><span className="lab">Add &amp; annotate job photos<span>Mark up the damage right on the photo</span></span></div>
              <div className="vt" data-t="125"><span className="tc">2:05</span><span className="lab">AI builds the materials list<span>Quantities + live supplier pricing, by section</span></span></div>
              <div className="vt" data-t="172"><span className="tc">2:52</span><span className="lab">Tap any item to tweak<span>Price, brand, quantity or product</span></span></div>
              <div className="vt" data-t="196"><span className="tc">3:16</span><span className="lab">Set labour, markup &amp; travel<span>Hours &times; rate, plus travel from the job address</span></span></div>
              <div className="vt" data-t="244"><span className="tc">4:04</span><span className="lab">Review &amp; send<span>Email, text or share the branded PDF</span></span></div>
              <div className="vt" data-t="268"><span className="tc">4:28</span><span className="lab">Customer accepts online<span>One tap on the quote — accepted</span></span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SPEC-GRID ── */}
      <section className="section" id="features">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 01 — features</span>
            <h2 className="sectitle">Everything you need to <span className="acc">quote &amp; invoice</span></h2>
            <p className="secsub">Purpose-built tools that help tradies win more jobs and get paid faster.</p>
          </div>
          <div className="feat-grid">
            <div className="feat">
              <div className="ix">01</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg></div>
              <h3>Fastest Quoting in the Game</h3>
              <p>AI-powered materials lists, reusable templates, voice-to-text, and quote-to-invoice in one tap.</p>
            </div>
            <div className="feat">
              <div className="ix">02</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
              <h3>Live Supplier Pricing</h3>
              <p>Real-time prices from major Australian suppliers, web search, and your own imported price lists.</p>
            </div>
            <div className="feat">
              <div className="ix">03</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg></div>
              <h3>Professional Documents</h3>
              <p>Branded PDF quotes and invoices with multiple templates, email delivery, and online acceptance.</p>
            </div>
            <div className="feat">
              <div className="ix">04</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
              <h3>Manage Every Job</h3>
              <p>9-stage pipeline, scheduling, on-site photos, checklists, and automated follow-ups.</p>
            </div>
            <div className="feat">
              <div className="ix">05</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /></svg></div>
              <h3>Xero Integration</h3>
              <p>One-tap invoice sync, auto-create contacts, record payments, and bulk export to Xero.</p>
            </div>
            <div className="feat">
              <div className="ix">06</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg></div>
              <h3>Built for Tradies</h3>
              <p>Aussie GST, independent markup, travel calculator, offline mode, and trade-specific setup.</p>
            </div>
            <div className="feat">
              <div className="ix">07</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg></div>
              <h3>Grow Your Business</h3>
              <p>Revenue dashboard, quote pipeline, referral program, and push notifications.</p>
            </div>
            <div className="feat">
              <div className="ix">08</div>
              <div className="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg></div>
              <h3>And more</h3>
              <p>Travel calc, dark mode, offline sync, referrals, affiliate dashboard, QR sharing.</p>
            </div>
            <div className="feat cta">
              <span className="big">7 modules.<br />0 spreadsheets.</span>
              <a href="#download">$ start free &rarr;</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVES ── */}
      <section className="section">
        <div className="container">
          {/* Quoting */}
          <div className="dive">
            <div>
              <span className="seclabel">// deep dive &middot; quoting</span>
              <h3>Fastest quoting in the game</h3>
              <p className="d-sub">Stop spending hours on quotes. Describe the job, get a materials list, add your rates, and send.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>Plain-English input</b> — AI suggests materials with quantities automatically</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Section-based quoting</b> — &ldquo;8 fence bays, 2 gates&rdquo; with per-section labour</span></div>
                <div className="r"><span className="ix">L03</span><span><b>Reusable templates</b> — common jobs in minutes, not hours</span></div>
                <div className="r"><span className="ix">L04</span><span><b>Quote &rarr; invoice</b> in one tap, no re-entering anything</span></div>
              </div>
            </div>
          </div>

          {/* Live Pricing */}
          <div className="dive rev">
            <div>
              <span className="seclabel">// deep dive &middot; pricing</span>
              <h3>Live supplier pricing no other app has</h3>
              <p className="d-sub">Always quote with today&apos;s prices — from major suppliers or your own imported rates.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>Real-time pricing</b> from major Australian hardware &amp; trade suppliers</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Web price search</b> when your usual suppliers don&apos;t stock it</span></div>
                <div className="r"><span className="ix">L03</span><span><b>List importer</b> — snap a price list or PDF, it extracts every line</span></div>
                <div className="r"><span className="ix">L04</span><span><b>Personal rates</b> — your actual costs, not retail</span></div>
              </div>
            </div>
          </div>

          {/* Manage Every Job */}
          <div className="dive">
            <div>
              <span className="seclabel">// deep dive &middot; job management</span>
              <h3>Manage every job from inquiry to paid</h3>
              <p className="d-sub">Quoting is only half the work. Track every job through a 9-stage pipeline so nothing slips through.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>9-stage pipeline</b> — inquiry &rarr; quoted &rarr; accepted &rarr; scheduled &rarr; in progress &rarr; completed &rarr; paid</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Google Calendar sync</b> — every scheduled job on your phone within seconds</span></div>
                <div className="r"><span className="ix">L03</span><span><b>On-site photos</b> with annotation — arrows, circles, dimensions attached to the job</span></div>
                <div className="r"><span className="ix">L04</span><span><b>Automated follow-ups</b> — day 3, 7, 14 — chase silent customers automatically</span></div>
              </div>
            </div>
          </div>

          {/* Professional Documents */}
          <div className="dive rev">
            <div>
              <span className="seclabel">// deep dive &middot; documents</span>
              <h3>Professional quotes &amp; invoices that win jobs</h3>
              <p className="d-sub">Look like a serious business. Get paid faster with full invoice tracking and multiple payment options.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>PDF templates</b> with your logo, brand colour, and business details</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Email quotes</b> with a pre-written professional email and your quote attached</span></div>
                <div className="r"><span className="ix">L03</span><span><b>Online acceptance</b> — customers accept or decline straight from their inbox</span></div>
                <div className="r"><span className="ix">L04</span><span><b>Invoice tracking</b> — draft, sent, paid, partial, overdue — know where every dollar is</span></div>
              </div>
            </div>
          </div>

          {/* Xero Integration */}
          <div className="dive">
            <div>
              <span className="seclabel">// deep dive &middot; xero</span>
              <h3>Xero integration that actually works</h3>
              <p className="d-sub">Push invoices to Xero without re-entering a single field. Keep your books in sync without the headache.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>One-tap Xero sync</b> — push invoices without re-entering a single field</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Auto-create contacts</b> — new customers automatically appear in Xero</span></div>
                <div className="r"><span className="ix">L03</span><span><b>Bulk sync</b> — sync multiple invoices at once</span></div>
                <div className="r"><span className="ix">L04</span><span><b>CSV export</b> — Xero-compatible if you prefer manual import</span></div>
              </div>
            </div>
          </div>

          {/* Grow Your Business */}
          <div className="dive rev">
            <div>
              <span className="seclabel">// deep dive &middot; growth</span>
              <h3>Know your numbers &amp; grow your business</h3>
              <p className="d-sub">Track your revenue, see your quote pipeline, and grow through referrals.</p>
            </div>
            <div className="dive-media">
              <div className="spec-list">
                <div className="r"><span className="ix">L01</span><span><b>Revenue dashboard</b> — see your monthly revenue at a glance</span></div>
                <div className="r"><span className="ix">L02</span><span><b>Quote pipeline</b> — sent, accepted, pending — see your conversion rate</span></div>
                <div className="r"><span className="ix">L03</span><span><b>Referral program</b> — give mates a free trial, earn when they subscribe</span></div>
                <div className="r"><span className="ix">L04</span><span><b>Push notifications</b> — quote accepted, invoice paid, overdue reminders</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ── */}
      <section className="section" id="get-paid">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// payments</span>
            <h2 className="sectitle">Tap to pay. <span className="acc">Get paid on the spot.</span></h2>
            <p className="secsub">Take card payments on-site with just your phone, or send a payment link — every method Aussie tradies actually use.</p>
          </div>
          <div className="pay-wrap">
            <div className="pay-media">
              <img src="/assets/get-paid-onsite-online.svg" alt="Get paid on-site with tap-to-pay or online with payment links" />
            </div>
            <div>
              <div className="spec-list">
                <div className="r"><span className="ix">P01</span><span><b>Square tap-to-pay</b> — take card payments on-site with just your phone, no extra hardware</span></div>
                <div className="r"><span className="ix">P02</span><span><b>Online payment links</b> — customers pay straight from the invoice in one tap</span></div>
                <div className="r"><span className="ix">P03</span><span><b>Deposits &amp; tracking</b> — request upfront payment; see paid, partial &amp; overdue at a glance</span></div>
              </div>
              <div className="pay-methods">
                <span className="hot">Square tap-to-pay</span>
                <span>Card</span>
                <span>Bank transfer</span>
                <span>PayID</span>
                <span>BPAY</span>
                <span>PayPal</span>
                <span>Cash</span>
                <span>Cheque</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 02 — how it works</span>
            <h2 className="sectitle">From job to quote in <span className="acc">four steps</span></h2>
          </div>
          <div className="flow" style={{ justifyContent: 'center', margin: '0 auto 44px' }}>
            <span className="step">job</span>
            <span className="arr">&rarr;</span>
            <span className="step">materials</span>
            <span className="arr">&rarr;</span>
            <span className="step">live&nbsp;price</span>
            <span className="arr">&rarr;</span>
            <span className="step">labour</span>
            <span className="arr">&rarr;</span>
            <span className="step">PDF</span>
            <span className="arr">&rarr;</span>
            <span className="step">sent</span>
            <span className="arr">&rarr;</span>
            <span className="step">accept</span>
          </div>
          <div className="steps">
            <div className="step-c"><div className="n">01</div><h4>Describe the job</h4><p>Pick a template or describe it in your own words.</p></div>
            <div className="step-c"><div className="n">02</div><h4>AI builds the list</h4><p>Materials auto-populated with real-time supplier prices.</p></div>
            <div className="step-c"><div className="n">03</div><h4>Set labour &amp; markup</h4><p>Add your hourly rate and margin.</p></div>
            <div className="step-c"><div className="n">04</div><h4>Send the quote</h4><p>Generate a branded PDF and share it instantly.</p></div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section" id="reviews">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 03 — field reports</span>
            <h2 className="sectitle">Trusted by <span className="acc">Australian tradies</span></h2>
          </div>
          <div className="tgrid">
            <div className="tcard">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&ldquo;I used to spend hours on quotes after a long day on site. Now I punch in the job details and QuoteMate does the rest — materials, live supplier prices, the lot.&rdquo;</p>
              <div className="who"><div className="av">DR</div><div><b>Dave R.</b><span>carpenter &middot; sydney</span></div></div>
            </div>
            <div className="tcard">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&ldquo;The AI material suggestions are spot on. Described a switchboard upgrade and it pulled every item I needed with current pricing. Saved me an hour per quote.&rdquo;</p>
              <div className="who"><div className="av">MT</div><div><b>Mick T.</b><span>electrician &middot; melbourne</span></div></div>
            </div>
            <div className="tcard">
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p>&ldquo;Finally an app that understands what tradies need. No bloat — just fast, accurate quotes from my phone. The offline mode is a lifesaver on rural jobs.&rdquo;</p>
              <div className="who"><div className="av">SK</div><div><b>Sarah K.</b><span>painter &middot; brisbane</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="section" id="pricing">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 04 — pricing</span>
            <h2 className="sectitle">Simple, transparent <span className="acc">pricing</span></h2>
            <p className="secsub">Start free. Upgrade to unlock everything.</p>
          </div>
          <div className="pgrid">
            {/* Free */}
            <div className="pcard">
              <h3>Free</h3>
              <div className="amt"><span className="p">$0</span><span className="per">forever</span></div>
              <p className="pd">No credit card. Customers pay online via Square (1.7% platform fee).</p>
              <ul>
                <li><CheckSvg /> Unlimited quotes &amp; invoices</li>
                <li><CheckSvg /> Online card payments via Square</li>
                <li><CheckSvg /> Professional PDF template</li>
                <li><CheckSvg /> Live supplier pricing</li>
                <li><CheckSvg /> Cloud sync</li>
              </ul>
              <a href="/app" className="btn ghost">Get Started Free</a>
            </div>
            {/* Pro Monthly */}
            <div className="pcard pro">
              <span className="pbadge">Most popular</span>
              <h3>Pro Monthly</h3>
              <div className="amt"><span className="p">$49</span><span className="per">/month</span></div>
              <p className="pd">14-day free trial. Cancel anytime.</p>
              <ul>
                <li><CheckSvg /> Everything in Free</li>
                <li><CheckSvg /> Bank Transfer, PayID, BPAY, PayPal</li>
                <li><CheckSvg /> Lower Square fee (1% vs 1.7%)</li>
                <li><CheckSvg /> AI material &amp; title generation</li>
                <li><CheckSvg /> All PDF templates</li>
                <li><CheckSvg /> Business logo on documents</li>
                <li><CheckSvg /> Priority support</li>
              </ul>
              <a href="/app" className="btn btn-primary">Start 14-Day Free Trial</a>
            </div>
            {/* Pro Annual */}
            <div className="pcard">
              <span className="pbadge save">Best value</span>
              <h3>Pro Annual</h3>
              <div className="amt"><span className="p">$328</span><span className="per">/year</span></div>
              <p className="pd">Just $27.33/month — save 44%.</p>
              <ul>
                <li><CheckSvg /> Everything in Pro Monthly</li>
                <li><CheckSvg /> Save $260 per year</li>
                <li><CheckSvg /> Cancel anytime</li>
              </ul>
              <a href="/app" className="btn ghost">Subscribe Annually</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="section" id="platforms">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// platforms</span>
            <h2 className="sectitle">One Purchase. <span className="acc">Every Platform.</span></h2>
            <p className="secsub">Purchase on any platform, use on all of them. Your quotes and data sync seamlessly across every device.</p>
          </div>
          <div className="platforms-grid">
            <div className="platform-card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
              <h3>iOS</h3>
              <p>iPhone &amp; iPad</p>
              <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn-platform" target="_blank" rel="noopener noreferrer">App Store</a>
            </div>
            <div className="platform-card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
              <h3>Android</h3>
              <p>Phones &amp; tablets</p>
              <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn-platform">Google Play</a>
            </div>
            <div className="platform-card">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
              <h3>Web</h3>
              <p>Any browser</p>
              <a href="/app" className="btn-platform">Open Web App</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRADES ── */}
      <section className="section" id="trades">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 05 — coverage</span>
            <h2 className="sectitle">Built for <span className="acc">24+ trades</span></h2>
            <p className="secsub">Whatever your trade, QuoteMate creates professional quotes with AI-powered material pricing.</p>
          </div>
          <div className="trades">
            {trades.map((t) => (
              <Link key={t.slug} href={`/quotes-for-${t.slug}`}>{t.name}</Link>
            ))}
          </div>
          <p className="trades-more"><Link href="/trades">view all trades &rarr;</Link></p>
          <div className="aussie">
            <span><CheckSvg /> GST built in</span>
            <span><CheckSvg /> ABN on every doc</span>
            <span><CheckSvg /> AUD throughout</span>
            <span><CheckSvg /> Major supplier integration</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section" id="faq">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// 06 — faq</span>
            <h2 className="sectitle">Frequently asked <span className="acc">questions</span></h2>
          </div>
          <div className="faq">
            {faqItems.map((item, i) => (
              <div key={i} className={`fitem${i === 0 ? ' open' : ''}`}>
                <div className="fq">
                  <h4>{item.question}</h4>
                  <span className="pm">{i === 0 ? '−' : '+'}</span>
                </div>
                <div className="fa"><p>{item.answer}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL SIGNUP ── */}
      <section className="section" id="signup">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// stay in the loop</span>
            <h2 className="sectitle">Get quoting tips &amp; <span className="acc">new features</span></h2>
            <p className="secsub">Quoting tips, new feature updates, and tradie business advice — straight to your inbox. No spam, unsubscribe anytime.</p>
          </div>
          <EngEmailSignup />
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section className="section" id="contact">
        <div className="container">
          <div className="sechead">
            <span className="seclabel">// get in touch</span>
            <h2 className="sectitle">Got a question? <span className="acc">We&apos;d love to hear it.</span></h2>
            <p className="secsub">Feature request, feedback, or just want to say g&apos;day — reach out any time.</p>
          </div>
          <EngContactForm />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="cta-band section" id="download">
        <div className="bg">
          <div className="grid-bg"></div>
          <div className="glow" style={{ top: '-40%', left: '50%', transform: 'translateX(-50%)' }}></div>
        </div>
        <div className="inner">
          <h2>Ready to quote <span className="acc">smarter?</span></h2>
          <p>Join thousands of Australian tradies who&apos;ve ditched spreadsheets and handwritten quotes.</p>
          <div className="ctas">
            <a href="/app" className="btn btn-primary">Start free</a>
            <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn btn-cmd"><span className="p">$</span> quotemate&nbsp;download</a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="foot-wrap">
          <div className="foot-brand">
            <div className="brand">
              <img className="mark" src="/assets/logo.png" alt="QuoteMate logo" />
              <span className="name">QuoteMate</span>
            </div>
            <p className="foot-tag">Professional quotes &amp; invoices for Australian tradies.</p>
          </div>
          <div className="foot-col">
            <h4>Product</h4>
            <a href="/#features">Features</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#faq">FAQ</a>
            <a href="/trades">Quoting by Trade</a>
            <a href="/templates">Quote Templates</a>
            <a href="/articles">Quoting Guides</a>
            <a href="/portal">Supplier Portal</a>
          </div>
          <div className="foot-col">
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/pricing">Pricing</a>
            <a href="/compare">Compare</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <div className="foot-col">
            <h4>Connect</h4>
            <a href="mailto:tom@hansendev.com.au">tom@hansendev.com.au</a>
            <div className="social">
              <a href="https://www.facebook.com/profile.php?id=61579534155762" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </a>
              <a href="https://www.youtube.com/@QuoteMateApp/" aria-label="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <div className="store">
            <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn-store">
              <svg width="13" height="15" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z" /></svg>
              {' '}App Store
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn-store">
              <svg width="13" height="15" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z" /></svg>
              {' '}Google Play
            </a>
          </div>
          <p className="copy">&copy; 2026 QuoteMate. Built in Australia.</p>
        </div>
      </footer>

      {/* ── CLIENT-SIDE INTERACTIVITY ── */}
      <EngHomeClient />

      {/* ── STRUCTURED DATA (verbatim from previous page.tsx) ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "QuoteMate",
        "alternateName": ["QuoteMate App", "QuoteMate Australia"],
        "operatingSystem": "iOS, Android, Web",
        "applicationCategory": "BusinessApplication",
        "applicationSubCategory": "Quoting & Invoicing",
        "url": "https://quotemateapp.au",
        "downloadUrl": [
          "https://apps.apple.com/au/app/quotemate/id6754000046",
          "https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU",
        ],
        "description": "AI-powered quoting and invoicing app for Australian tradies. Describe any trade job, get a materials list with live supplier pricing, and send a branded PDF quote in under 2 minutes. Includes Xero sync, Square tap-to-pay, GST, and offline mode.",
        "featureList": [
          "AI material list generation from a plain-English job description",
          "Live supplier pricing from major Australian hardware suppliers",
          "Branded PDF quotes and invoices",
          "Quote-to-invoice in one tap",
          "9-stage job pipeline (inquiry to paid)",
          "Job scheduling with Google Calendar sync",
          "On-site job photos with annotation",
          "On-site job checklists",
          "Automated quote follow-ups",
          "Xero integration",
          "Square tap-to-pay (iPhone & NFC-capable Android)",
          "Australian GST and ABN handling",
          "Offline mode",
        ],
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "AUD", "name": "Free", "category": "free" },
          { "@type": "Offer", "price": "49", "priceCurrency": "AUD", "name": "Pro Monthly", "billingIncrement": "P1M" },
          { "@type": "Offer", "price": "328", "priceCurrency": "AUD", "name": "Pro Annual", "billingIncrement": "P1Y" },
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "3",
          "bestRating": "5",
          "worstRating": "1",
        },
        "review": [
          {
            "@type": "Review",
            "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
            "author": { "@type": "Person", "name": "Dave R.", "jobTitle": "Carpenter" },
            "reviewBody": "I used to spend hours on quotes after a long day on site. Now I punch in the job details and QuoteMate does the rest — materials, live supplier prices, the lot. Clients love the professional PDFs too.",
          },
          {
            "@type": "Review",
            "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
            "author": { "@type": "Person", "name": "Mick T.", "jobTitle": "Electrician" },
            "reviewBody": "The AI material suggestions are spot on. Described a switchboard upgrade and it pulled every item I needed with current pricing. Saved me at least an hour per quote. Worth every cent of the Pro plan.",
          },
          {
            "@type": "Review",
            "reviewRating": { "@type": "Rating", "ratingValue": "5", "bestRating": "5" },
            "author": { "@type": "Person", "name": "Sarah K.", "jobTitle": "Painter" },
            "reviewBody": "Finally an app that actually understands what tradies need. No bloat, no complicated setup — just fast, accurate quotes I can send straight from my phone. The offline mode is a lifesaver on rural jobs.",
          },
        ],
        "author": {
          "@type": "Organization",
          "name": "QuoteMate",
          "url": "https://quotemateapp.au",
          "email": "tom@hansendev.com.au",
        },
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "QuoteMate",
        "url": "https://quotemateapp.au",
        "logo": "https://quotemateapp.au/assets/logo.png",
        "email": "tom@hansendev.com.au",
        "description": "AI-powered quoting and invoicing app built for Australian tradies.",
        "sameAs": [
          "https://www.facebook.com/quotemateapp",
          "https://www.instagram.com/quotemateapp",
          "https://www.linkedin.com/company/quotemateapp"
        ]
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems.map((item) => ({
          "@type": "Question",
          "name": item.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer
          }
        }))
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "QuoteMate",
        "url": "https://quotemateapp.au",
        "inLanguage": "en-AU",
        "publisher": { "@type": "Organization", "name": "QuoteMate", "url": "https://quotemateapp.au" },
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to create a professional tradie quote with QuoteMate",
        "description": "Create a branded, GST-compliant trade quote in under 2 minutes — from job description to a sent PDF.",
        "totalTime": "PT2M",
        "tool": [{ "@type": "HowToTool", "name": "QuoteMate app (iOS, Android, or web)" }],
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Choose or describe your job",
            "text": "Pick a quote template for the type of work, or describe the job in plain English (you can use voice-to-text on-site).",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "AI suggests materials and pricing",
            "text": "QuoteMate's AI populates a materials list with quantities and live supplier pricing from major Australian suppliers, your imported price list, or a web price search.",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Set labour and markup",
            "text": "Add your hourly rate, set independent markup on materials and labour, and add travel cost from the customer's address.",
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Send a professional quote",
            "text": "Generate a branded PDF with your logo, ABN, and payment terms, and email or message it to the customer for one-tap acceptance.",
          },
        ],
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "QuoteMate — Quoting & Invoicing for Australian Tradies",
        "description": "AI-powered quoting and invoicing app for Australian tradies with live supplier pricing, Xero sync, and Square tap-to-pay.",
        "brand": { "@type": "Brand", "name": "QuoteMate" },
        "image": "https://quotemateapp.au/assets/og-image.jpg",
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "AUD",
          "lowPrice": "0",
          "highPrice": "328",
          "offerCount": "3",
          "url": "https://quotemateapp.au/pricing/",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "5.0",
          "reviewCount": "3",
          "bestRating": "5",
        },
      })}} />
    </div>
  );
}
