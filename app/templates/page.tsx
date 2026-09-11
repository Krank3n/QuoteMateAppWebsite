import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import { quoteTemplates } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Free Quote Templates for Tradies: Construction, Building & 45 Trades (2026)',
  description: 'Free construction, building, carpentry and trade quote templates for Australian tradies. Blank PDF and Excel worksheets with suggested line items, GST and terms fields. No signup.',
  alternates: { canonical: 'https://quotemateapp.au/templates' },
};

export default function TemplatesDirectoryPage() {
  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Templates' },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Free Templates</span>
              <h1 className="seo-hero-title">Quote Templates for Australian Tradies</h1>
              <p className="seo-hero-subtitle">Download free PDF and Excel worksheets with suggested line items. Enter your own quantities, rates and GST treatment — no signup required. Use QuoteMate when you want to build and send quotes in the app.</p>
            </div>
          </div>
        </section>

        {/* Search Console shows this hub for "construction quote template",
            "building quote template", "tradesman quote template" and
            "carpentry quote template", none of which have a page of their
            own. Answer those searches here and route them to the closest
            real worksheet, rather than leaving a grid of 45 cards to do it. */}
        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <div className="rich-content-section">
                <h2>Looking for a construction or building quote template?</h2>
                <p>
                  A construction quote has more moving parts than a single-trade quote, and the parts most often left off are the ones that cause the dispute. Whichever worksheet you start from, a building quote should carry a defined scope of works, prime cost items and provisional sums for anything the customer has not chosen yet, a staged payment schedule tied to milestones rather than dates, a variations clause, GST shown per line, a validity period of around 30 days, and your licence number where the state requires it on quotes over the threshold. The renovation and construction worksheets below have those fields laid out; the quantities, rates and amounts are blank for you to price.
                </p>
                <p className="rich-content-link">
                  <Link href="/templates/granny-flat-quote-template">Granny flat construction</Link> &middot;{' '}
                  <Link href="/templates/bathroom-renovation-quote-template">Bathroom renovation</Link> &middot;{' '}
                  <Link href="/templates/kitchen-renovation-quote-template">Kitchen renovation</Link> &middot;{' '}
                  <Link href="/templates/laundry-renovation-quote-template">Laundry renovation</Link> &middot;{' '}
                  <Link href="/templates/outdoor-kitchen-quote-template">Outdoor kitchen</Link>
                </p>
              </div>
              <div className="rich-content-section">
                <h2>Carpentry quote templates</h2>
                <p>
                  Carpentry quotes live or die on timber quantities and the allowance for waste, fixings and finishing. The deck, pergola and staircase worksheets itemise the structural members, the hardware and the labour stages separately so a quote for a 20 square metre deck does not collapse into one number the customer cannot check and you cannot defend.
                </p>
                <p className="rich-content-link">
                  <Link href="/templates/deck-quote-template">Deck building</Link> &middot;{' '}
                  <Link href="/templates/pergola-quote-template">Pergola construction</Link> &middot;{' '}
                  <Link href="/templates/staircase-quote-template">Staircase construction</Link> &middot;{' '}
                  <Link href="/templates/built-in-wardrobe-quote-template">Built-in wardrobe</Link>
                </p>
              </div>
              <div className="rich-content-section">
                <h2>A tradesman quote template for any trade</h2>
                <p>
                  Every worksheet here shares the same bones: business and customer details, scope, a materials list with blank quantity, unit, rate and amount columns, labour and allowances, subtotal, GST and total, then inclusions, exclusions, payment terms and validity. Pick the job closest to yours from the 45 below and cross out what does not apply. The materials section is the part that takes the time; it is the part QuoteMate fills in for you with live supplier pricing when you want to build and send the quote rather than print a worksheet.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="seo-template-directory">
          <div className="container">
            <h2 className="section-title">All Templates</h2>
            <div className="trade-directory-grid">
              {quoteTemplates.map((template) => (
                <Link key={template.slug} href={`/templates/${template.slug}`} className="trade-directory-card">
                  <h2>{template.name}</h2>
                  <p>{template.description.substring(0, 120)}...</p>
                  <span className="trade-directory-link">View template &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
