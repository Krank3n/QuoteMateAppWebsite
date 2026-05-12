import type { Metadata } from 'next';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import FAQ from './components/FAQ';
import CTAButtons from './components/CTAButtons';
import EmailSignup from './components/EmailSignup';
import ContactForm from './components/ContactForm';
import WalkthroughVideo from './components/WalkthroughVideo';
import InstallSheet from './components/InstallSheet';
import FeatureShowcase from './components/FeatureShowcase';
import IntegrationsBanner from './components/IntegrationsBanner';

export const metadata: Metadata = {
  alternates: { canonical: 'https://quotemateapp.au' },
};

const faqItems = [
  { question: 'What trades does QuoteMate support?', answer: 'QuoteMate is built for all trades including carpentry, plumbing, electrical, building, cleaning, and general contracting. Our smart templates cover common jobs like decks, fences, pergolas, bathroom renovations, and more.' },
  { question: 'How does the AI quoting work?', answer: "Simply describe the job in plain English \u2014 like 'Build a 4x3 metre hardwood deck with stairs' \u2014 and QuoteMate\u2019s AI will suggest all the materials and quantities you need, with real-time pricing from major Australian suppliers." },
  { question: 'How does live supplier pricing work?', answer: 'QuoteMate pulls real-time prices directly from leading Australian hardware and trade suppliers. You can also import your own supplier price lists from a photo or PDF, save personal trade rates, and search the web for pricing on specialty items.' },
  { question: 'Does QuoteMate integrate with Xero?', answer: 'Yes! Push invoices to Xero in one tap, auto-create contacts, record payments, and bulk sync multiple invoices. You can also export Xero-compatible CSVs if you prefer manual import.' },
  { question: 'Is my data secure?', answer: 'Absolutely. QuoteMate uses Firebase with enterprise-grade encryption. Your data is securely stored in the cloud and synced across your devices. We never share your business data with third parties.' },
  { question: 'Can I use it offline?', answer: 'Yes! Create and edit quotes without an internet connection. Everything syncs automatically when you\u2019re back online \u2014 perfect for remote job sites.' },
  { question: 'How does the free plan and trial work?', answer: 'Sign up with no credit card. You\u2019re on the Free plan forever \u2014 send unlimited quotes and invoices, with customers paying online via Square (a small 1.7% platform fee is added to their bill). New users also get a 14-day Pro trial automatically when they create their first quote, so you can try every feature (bank/PayID/BPAY/PayPal options, AI material generation, all PDF templates, lower Square rate) before deciding whether to upgrade.' },
  { question: 'Can I track invoices and payments?', answer: 'Yes. Track invoice status (draft, sent, paid, partial, overdue), record partial payments and deposits, and get automatic overdue detection. Support for bank transfer, PayID, BPAY, PayPal, card, cash, and cheque.' },
  { question: 'Does it calculate GST?', answer: 'Yes. QuoteMate automatically calculates and displays GST on all quotes and invoices, keeping you compliant with Australian tax requirements.' },
  { question: 'Can I add my business logo?', answer: 'Yes! Upload your logo and add your business name, ABN, and payment details. Every quote and invoice you send will look professional and on-brand.' },
];

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
);

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
  { slug: 'hvac-technicians', name: 'HVAC Technicians' },
  { slug: 'renderers', name: 'Renderers' },
  { slug: 'glaziers', name: 'Glaziers' },
  { slug: 'solar-installers', name: 'Solar Installers' },
  { slug: 'cabinet-makers', name: 'Cabinet Makers' },
  { slug: 'plasterers', name: 'Plasterers' },
  { slug: 'flooring-installers', name: 'Flooring Installers' },
  { slug: 'locksmiths', name: 'Locksmiths' },
  { slug: 'pest-controllers', name: 'Pest Controllers' },
  { slug: 'demolishers', name: 'Demolition' },
  { slug: 'garage-door-installers', name: 'Garage Doors' },
  { slug: 'welders', name: 'Welders' },
  { slug: 'arborists', name: 'Arborists' },
];

const tradePills = [
  { slug: 'carpenters', label: 'Carpentry' },
  { slug: 'plumbers', label: 'Plumbing' },
  { slug: 'electricians', label: 'Electrical' },
  { slug: 'builders', label: 'Building' },
  { slug: 'cleaners', label: 'Cleaning' },
  { slug: 'painters', label: 'Painting' },
  { slug: 'landscapers', label: 'Landscaping' },
  { slug: 'roofers', label: 'Roofing' },
  { slug: 'tilers', label: 'Tiling' },
  { slug: 'concreters', label: 'Concreting' },
  { slug: 'fencers', label: 'Fencing' },
  { slug: 'solar-installers', label: 'Solar' },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <InstallSheet />
      <main>
        {/* Hero Section */}
        <section className="hero" id="hero">
          <div className="container hero-grid">
            <div className="hero-content" data-reveal="">
              <h1 className="hero-title">Professional Quotes in Under <span className="text-gradient">2 Minutes</span></h1>
              <p className="hero-subtitle">The AI-powered quoting &amp; invoicing app built for Australian tradies. Describe any job, get real-time supplier prices, and send branded quotes &mdash; all from your phone.</p>
              <CTAButtons showWebLink />
            </div>
            <div className="hero-phone" data-reveal="">
              <WalkthroughVideo />
            </div>
          </div>
        </section>

        <IntegrationsBanner />

        {/* Features Section */}
        <section className="features" id="features">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">Everything You Need to <span className="text-gradient">Quote &amp; Invoice</span></h2>
              <p className="section-subtitle">Purpose-built tools that help tradies win more jobs and get paid faster.</p>
            </div>
            <div className="features-grid">
              {[
                { title: 'Fastest Quoting in the Game', desc: 'AI-powered materials lists, reusable templates, voice-to-text, and quote-to-invoice in one tap.', href: '#quoting', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
                { title: 'Live Supplier Pricing', desc: 'Real-time prices from major Australian suppliers, web search, and your own imported price lists.', href: '#supplier-pricing', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                { title: 'Professional Documents', desc: 'Branded PDF quotes and invoices with multiple templates, email delivery, and online acceptance.', href: '#quotes-invoices', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
                { title: 'Xero Integration', desc: 'One-tap invoice sync, auto-create contacts, record payments, and bulk export to Xero.', href: '#xero', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg> },
                { title: 'Built for Tradies', desc: 'Aussie GST, independent markup, travel calculator, offline mode, and trade-specific setup.', href: '#tradie-features', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
                { title: 'Grow Your Business', desc: 'Revenue dashboard, quote pipeline, referral program, and push notifications to stay on top.', href: '#grow', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
              ].map((f, i) => (
                <a key={i} href={f.href} className="feature-card feature-card-link" data-reveal="">
                  <div className="feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Showcase Sections */}
        <FeatureShowcase
          id="quoting"
          title="Fastest Quoting"
          titleAccent="in the Game"
          subtitle="Stop spending hours on quotes. Describe the job, get a materials list, add your rates, and send a professional quote &mdash; all in minutes."
          features={[
            'Describe your job, get a materials list \u2014 AI suggests materials with quantities automatically',
            'Section-based quoting \u2014 quote the way you work (e.g. "8 fence bays, 2 gates") with per-section labor and materials',
            'Reusable job templates \u2014 save common jobs and create quotes in minutes, not hours',
            'Voice-to-text job descriptions \u2014 talk into your phone on-site, QuoteMate writes the description',
            'Quote to invoice in one tap \u2014 accepted quote becomes an invoice instantly, no re-entering anything',
          ]}
        />

        <FeatureShowcase
          id="supplier-pricing"
          title="Live Supplier Pricing"
          titleAccent="No Other App Has"
          subtitle="Always quote with today&rsquo;s prices. QuoteMate connects to major Australian suppliers and lets you import your own trade rates."
          reversed
          features={[
            'Real-time pricing from major Australian hardware and trade suppliers',
            'Web search pricing \u2014 finds prices from any supplier across the web when your usual suppliers don\u2019t stock it',
            'Supplier list importer \u2014 snap a photo of a supplier price list or PDF and it extracts every line item automatically',
            'Personal supplier rates \u2014 save your trade pricing so your quotes always use your actual costs, not retail',
            'Favourites system \u2014 save your go-to products with your prices, coverage rates, and notes',
          ]}
        />

        <FeatureShowcase
          id="quotes-invoices"
          title="Professional Quotes &amp; Invoices"
          titleAccent="That Win Jobs"
          subtitle="Look like a serious business with clean, branded documents. Get paid faster with full invoice tracking and multiple payment options."
          features={[
            'Professional PDF templates with your logo, brand colour, and business details',
            'Customisable display \u2014 show or hide labor hours, markup, and material breakdown',
            'Email quotes directly with a pre-written professional email and your quote attached',
            'Quote acceptance via email \u2014 customers accept or decline straight from their inbox',
            'Invoice status tracking \u2014 draft, sent, paid, partial, overdue \u2014 know where every dollar is',
          ]}
        />

        <FeatureShowcase
          id="get-paid"
          title="Get Paid On-Site"
          titleAccent="or Online"
          subtitle="Take payment however your customer wants to pay &mdash; tap their card on-site, send a payment link, or add your bank details to the invoice."
          image="/assets/get-paid-onsite-online.svg"
          imageAlt="Get paid on-site with tap-to-pay or online with payment links"
          reversed
          features={[
            'Square tap-to-pay \u2014 take card payments on-site with just your phone, no extra hardware',
            'Online payment links \u2014 customers pay from the invoice with one tap',
            'Bank transfer, PayID, BPAY \u2014 add your details and let customers pay their way',
            'PayPal, cash, cheque \u2014 every payment method Australian tradies actually use',
            'Deposit collection \u2014 request upfront payment before starting the job',
            'Payment tracking \u2014 see what\u2019s paid, partial, and overdue at a glance',
          ]}
        />

        <FeatureShowcase
          id="xero"
          title="Xero Integration"
          titleAccent="That Actually Works"
          subtitle="Push invoices to Xero without re-entering a single field. Keep your books in sync without the headache."
          reversed
          features={[
            'One-tap Xero sync \u2014 push invoices to Xero without re-entering a single field',
            'Auto-create contacts \u2014 new customers in QuoteMate automatically appear in Xero',
            'Payment recording \u2014 record payments in QuoteMate and they sync to Xero',
            'Bulk sync \u2014 sync multiple invoices at once',
            'CSV export \u2014 Xero-compatible CSV if you prefer manual import',
          ]}
        />

        <FeatureShowcase
          id="tradie-features"
          title="Built for How"
          titleAccent="Tradies Actually Work"
          subtitle="Every feature is designed around how tradies really work \u2014 on-site, on the tools, and on the go."
          features={[
            'Aussie GST built in \u2014 10% GST calculated automatically, no accounting degree needed',
            'Independent material &amp; labor markup \u2014 set different margins on materials vs labor',
            'Travel cost calculator \u2014 enter the job address, QuoteMate calculates distance and suggests a travel markup',
            'Trade-specific setup \u2014 select your trade and get relevant suppliers, materials, and templates',
            'Works offline \u2014 create quotes on-site with no signal, syncs when you\u2019re back online',
            'Attach photos to quotes \u2014 show the customer exactly what you\u2019re quoting on, with annotation',
            'Customer management \u2014 save contacts, pull from your phone, sync from Xero, with smart search',
            'Dark mode \u2014 easy on the eyes at 5am or on a bright site',
          ]}
        />

        <FeatureShowcase
          id="grow"
          title="Know Your Numbers &amp;"
          titleAccent="Grow Your Business"
          subtitle="Track your revenue, see your quote pipeline, and grow through referrals. QuoteMate helps you build a bigger, better business."
          reversed
          features={[
            'Revenue dashboard \u2014 see your monthly revenue at a glance',
            'Quote pipeline \u2014 how many quotes are sent, accepted, pending \u2014 see your conversion rate',
            'Cost breakdown \u2014 materials vs labor split so you know where your money goes',
            'Monthly comparisons \u2014 track whether you\u2019re growing month to month',
            'Referral program \u2014 give your mates a free trial, earn when they subscribe',
            'Affiliate dashboard \u2014 track your referral earnings, commissions, and payouts',
            'QR code sharing \u2014 show your referral code on-site or at trade nights',
            'Push notifications \u2014 quote accepted, invoice paid, overdue reminders \u2014 stay on top of everything',
          ]}
        />

        {/* How It Works */}
        <section className="how-it-works" id="how-it-works">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">How It <span className="text-gradient">Works</span></h2>
              <p className="section-subtitle">From job description to professional quote in four simple steps.</p>
            </div>
            <div className="steps-grid">
              {[
                { num: 1, title: 'Choose or describe your job', desc: 'Pick a template or describe it in your own words', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, showConnector: true },
                { num: 2, title: 'AI suggests materials & pricing', desc: 'Materials auto-populated with real-time supplier prices', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h3a3 3 0 0 1 3 3v1.5a2.5 2.5 0 0 1-5 0V14H9v1.5a2.5 2.5 0 0 1-5 0V14a3 3 0 0 1 3-3h3V9.4A4 4 0 0 1 12 2z"/><circle cx="12" cy="6" r="1.5"/></svg>, showConnector: true },
                { num: 3, title: 'Set labour & markup', desc: 'Add your hourly rate and margin', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, showConnector: true },
                { num: 4, title: 'Send a professional quote', desc: 'Generate a branded PDF and share it instantly', icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, showConnector: false },
              ].map((s) => (
                <div key={s.num} className="step" data-reveal="">
                  <div className="step-number">{s.num}</div>
                  {s.showConnector && <div className="step-connector" aria-hidden="true"></div>}
                  <div className="step-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="testimonials" id="reviews">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">Trusted by <span className="text-gradient">Australian Tradies</span></h2>
              <p className="section-subtitle">See what our customers have to say.</p>
            </div>
            <div className="testimonials-grid">
              {[
                {
                  name: 'Dave R.',
                  initials: 'DR',
                  trade: 'Carpenter, Sydney',
                  text: 'I used to spend hours on quotes after a long day on site. Now I punch in the job details and QuoteMate does the rest \u2014 materials, live supplier prices, the lot. Clients love the professional PDFs too.',
                },
                {
                  name: 'Mick T.',
                  initials: 'MT',
                  trade: 'Electrician, Melbourne',
                  text: 'The AI material suggestions are spot on. Described a switchboard upgrade and it pulled every item I needed with current pricing. Saved me at least an hour per quote. Worth every cent of the Pro plan.',
                },
                {
                  name: 'Sarah K.',
                  initials: 'SK',
                  trade: 'Painter, Brisbane',
                  text: "Finally an app that actually understands what tradies need. No bloat, no complicated setup \u2014 just fast, accurate quotes I can send straight from my phone. The offline mode is a lifesaver on rural jobs.",
                },
              ].map((t, i) => (
                <div key={i} className="testimonial-card" data-reveal="">
                  <div className="testimonial-stars" aria-label="5 out of 5 stars">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    ))}
                  </div>
                  <p className="testimonial-text">&ldquo;{t.text}&rdquo;</p>
                  <div className="testimonial-author">
                    <div className="testimonial-avatar">{t.initials}</div>
                    <div className="testimonial-author-info">
                      <h4>{t.name}</h4>
                      <p>{t.trade}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              <span className="testimonials-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                5.0 stars on Google Reviews
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="pricing" id="pricing">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">Simple, Transparent <span className="text-gradient">Pricing</span></h2>
              <p className="section-subtitle">Start free. Upgrade to unlock everything.</p>
            </div>
            <div className="pricing-grid pricing-grid-3">
              {/* Free */}
              <div className="pricing-card" data-reveal="">
                <div className="pricing-card-header">
                  <h3>Free</h3>
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
              {/* Pro Monthly */}
              <div className="pricing-card pricing-card-pro" data-reveal="">
                <div className="pricing-badge">MOST POPULAR</div>
                <div className="pricing-card-header">
                  <h3>Pro Monthly</h3>
                  <div className="pricing-amount">
                    <span className="price">$29</span>
                    <span className="period">/month</span>
                  </div>
                  <p className="pricing-desc">14-day free trial. Cancel anytime.</p>
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
              {/* Pro Annual */}
              <div className="pricing-card pricing-card-annual" data-reveal="">
                <div className="pricing-badge pricing-badge-save">BEST VALUE</div>
                <div className="pricing-card-header">
                  <h3>Pro Annual</h3>
                  <div className="pricing-amount">
                    <span className="price">$199</span>
                    <span className="period">/year</span>
                  </div>
                  <p className="pricing-desc">14-day free trial. Just $16.58/month &mdash; save 43%.</p>
                </div>
                <ul className="pricing-features" role="list">
                  <li><CheckIcon /> Everything in Pro Monthly</li>
                  <li><CheckIcon /> Save $149 per year</li>
                  <li><CheckIcon /> Cancel anytime</li>
                </ul>
                <a href="/app" className="btn btn-primary pricing-btn">Subscribe Annually</a>
              </div>
            </div>
          </div>
        </section>

        {/* Built for Aussie Tradies */}
        <section className="aussie-section" id="aussie">
          <div className="container">
            <div className="aussie-content" data-reveal="">
              <div className="aussie-flag" aria-hidden="true">
                <span className="flag-star">&#9733;</span>
              </div>
              <h2 className="section-title">Built for <span className="text-gradient">Aussie Tradies</span></h2>
              <p className="section-subtitle">Australian-made for Australian tradies. Every feature is designed with the Australian market in mind.</p>
              <div className="aussie-features">
                {['GST calculations built in', 'ABN support on every document', 'AUD pricing throughout', 'Major supplier integration'].map((text, i) => (
                  <div key={i} className="aussie-feature-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <div className="trade-pills">
                {tradePills.map((t) => (
                  <Link key={t.slug} href={`/quotes-for-${t.slug}`} className="trade-pill">{t.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platforms */}
        <section className="platforms" id="platforms">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">One Purchase. <span className="text-gradient">Every Platform.</span></h2>
              <p className="section-subtitle">Purchase on any platform, use on all of them. Your quotes and data sync seamlessly across every device.</p>
            </div>
            <div className="platforms-grid">
              <div className="platform-card" data-reveal="">
                <div className="platform-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <h3>iOS</h3>
                <p>iPhone &amp; iPad</p>
                <a href="https://apps.apple.com/au/app/quotemate/id6754000046" className="btn btn-store btn-store-sm" aria-label="Download QuoteMate on the App Store" target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="20" viewBox="0 0 20 24" fill="currentColor" aria-hidden="true"><path d="M16.52 12.46c-.03-3.13 2.55-4.63 2.67-4.71-1.45-2.12-3.72-2.41-4.53-2.45-1.93-.2-3.77 1.14-4.74 1.14-.98 0-2.49-1.11-4.1-1.08-2.11.03-4.06 1.23-5.15 3.12-2.2 3.81-.56 9.45 1.58 12.54 1.05 1.52 2.3 3.22 3.94 3.16 1.58-.06 2.18-1.02 4.09-1.02 1.91 0 2.46 1.02 4.13.99 1.7-.03 2.78-1.55 3.82-3.08 1.2-1.76 1.7-3.47 1.73-3.56-.04-.02-3.31-1.27-3.34-5.05zM13.39 3.51C14.26 2.44 14.85.99 14.7-.5c-1.33.05-2.94.89-3.89 2.01-.86.99-1.6 2.56-1.4 4.07 1.48.12 2.99-.76 3.98-2.07z"/></svg>
                  <span>App Store</span>
                </a>
              </div>
              <div className="platform-card" data-reveal="">
                <div className="platform-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                </div>
                <h3>Android</h3>
                <p>Phones &amp; tablets</p>
                <a href="https://play.google.com/store/apps/details?id=com.quotemate.app&hl=en_AU" className="btn btn-store btn-store-sm" aria-label="Get it on Google Play">
                  <svg width="16" height="18" viewBox="0 0 20 22" fill="currentColor" aria-hidden="true"><path d="M1.22.56L11.35 10.5 1.22 20.44C.97 19.95.78 19.37.78 18.71V2.29C.78 1.63.97 1.05 1.22.56zM13.04 12.18l2.68 2.68-8.66 5.02 5.98-7.7zM17.37 9.57l2.34 1.36c.65.38.65.99 0 1.36l-2.34 1.36-2.94-2.04 2.94-2.04zM7.06 4.12l8.66 5.02-2.68 2.68-5.98-7.7z"/></svg>
                  <span>Google Play</span>
                </a>
              </div>
              <div className="platform-card" data-reveal="">
                <div className="platform-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <h3>Web</h3>
                <p>Any browser</p>
                <a href="/app" className="btn btn-secondary btn-store-sm">Open Web App</a>
              </div>
            </div>
          </div>
        </section>

        {/* Trades We Support */}
        <section className="trades-section" id="trades">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">Built for <span className="text-gradient">24+ Trades</span></h2>
              <p className="section-subtitle">Whatever your trade, QuoteMate helps you create professional quotes with AI-powered material pricing.</p>
            </div>
            <div className="trades-grid" data-reveal="">
              {trades.map((t) => (
                <Link key={t.slug} href={`/quotes-for-${t.slug}`} className="trades-grid-item">{t.name}</Link>
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: '24px' }}><Link href="/trades" className="hero-web-link">View all trades &rarr;</Link></p>
          </div>
        </section>

        {/* FAQ */}
        <section className="faq" id="faq">
          <div className="container">
            <div className="section-header" data-reveal="">
              <h2 className="section-title">Frequently Asked <span className="text-gradient">Questions</span></h2>
            </div>
            <div data-reveal="">
              <FAQ items={faqItems} />
            </div>
          </div>
        </section>

        {/* Email Signup */}
        <section className="email-signup" id="signup">
          <div className="container">
            <div className="email-signup-content" data-reveal="">
              <h2 className="section-title">Stay in the <span className="text-gradient">Loop</span></h2>
              <p className="section-subtitle">Get quoting tips, new feature updates, and tradie business advice — straight to your inbox. No spam, unsubscribe anytime.</p>
              <EmailSignup />
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="contact-section" id="contact">
          <div className="container">
            <div className="contact-content" data-reveal="">
              <h2 className="section-title">Get in <span className="text-gradient">Touch</span></h2>
              <p className="section-subtitle">Got a question, feature request, or feedback? We&rsquo;d love to hear from you.</p>
              <ContactForm />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="final-cta" id="download">
          <div className="container">
            <div className="final-cta-content" data-reveal="">
              <h2 className="section-title">Ready to Quote <span className="text-gradient">Smarter?</span></h2>
              <p className="section-subtitle">Join thousands of Australian tradies who&rsquo;ve ditched spreadsheets and handwritten quotes.</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Structured Data - SoftwareApplication */}
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
          "Xero integration",
          "Square tap-to-pay (iPhone & NFC-capable Android)",
          "Australian GST and ABN handling",
          "Offline mode",
        ],
        "offers": [
          { "@type": "Offer", "price": "0", "priceCurrency": "AUD", "name": "Free", "category": "free" },
          { "@type": "Offer", "price": "29", "priceCurrency": "AUD", "name": "Pro Monthly", "billingIncrement": "P1M" },
          { "@type": "Offer", "price": "199", "priceCurrency": "AUD", "name": "Pro Annual", "billingIncrement": "P1Y" },
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
          "email": "hello@quotemateapp.au",
        },
      })}} />

      {/* Structured Data - Organization */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "QuoteMate",
        "url": "https://quotemateapp.au",
        "logo": "https://quotemateapp.au/assets/logo.png",
        "email": "hello@quotemateapp.au",
        "description": "AI-powered quoting and invoicing app built for Australian tradies.",
        "sameAs": [
          "https://www.facebook.com/quotemateapp",
          "https://www.instagram.com/quotemateapp",
          "https://www.linkedin.com/company/quotemateapp"
        ]
      })}} />

      {/* Structured Data - FAQPage */}
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

      {/* Structured Data - WebSite */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "QuoteMate",
        "url": "https://quotemateapp.au",
        "inLanguage": "en-AU",
        "publisher": { "@type": "Organization", "name": "QuoteMate", "url": "https://quotemateapp.au" },
      })}} />

      {/* Structured Data - HowTo (How it works) */}
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

      {/* Structured Data - Product (for shopping/answer-engine extraction) */}
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
          "highPrice": "199",
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
    </>
  );
}
