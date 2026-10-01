import type { Metadata } from 'next';
import CrewTimeViewer from './CrewTimeViewer';

export const metadata: Metadata = {
  title: 'Put your hours in',
  description: 'Send your hours to the business you work for.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/**
 * Crew time link (quotemateapp.au/t?token=...). A crew member opens this on
 * their phone to send their hours in — no app, no account.
 *
 * Same arrangement as /q: the page itself is served by the crewTimePage
 * Cloud Function and framed here, so its API calls stay same-origin with
 * the function host and there's one copy of the page code.
 */
export default function CrewTimePage() {
  return <CrewTimeViewer />;
}
