import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reece Connected — QuoteMate',
  description: 'Completing Reece integration setup for QuoteMate.',
  robots: { index: false, follow: false },
};

export default function ReeceCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
