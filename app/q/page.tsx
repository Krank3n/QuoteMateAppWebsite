import type { Metadata } from 'next';
import QuoteViewer from './QuoteViewer';

export const metadata: Metadata = {
  title: 'Your Quote - QuoteMate',
  description: 'Review and respond to your quote.',
  robots: { index: false, follow: false },
};

/**
 * Branded quote-acceptance URL (quotemateapp.au/q?token=...).
 *
 * The acceptance page itself is served by the quoteAcceptancePage Cloud
 * Function. Hosting it inside a full-viewport iframe keeps the customer on
 * the branded domain while the framed page's API calls stay same-origin with
 * the function host — no CORS, no duplicated page code, and the existing
 * cloudfunctions.net links keep working forever.
 */
export default function QuotePage() {
  return <QuoteViewer />;
}
