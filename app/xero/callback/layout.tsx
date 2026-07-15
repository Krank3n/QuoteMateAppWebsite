import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connecting to Xero',
  description: 'Completing Xero integration setup for QuoteMate.',
  robots: { index: false, follow: false },
};

export default function XeroCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
