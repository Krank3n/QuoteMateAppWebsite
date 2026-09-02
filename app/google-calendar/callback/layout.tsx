import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connecting Google Calendar',
  description: 'Completing Google Calendar setup for QuoteMate.',
  robots: { index: false, follow: false },
};

export default function GoogleCalendarCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
