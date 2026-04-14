import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connecting to Square — QuoteMate',
  description: 'Completing Square integration setup for QuoteMate.',
  robots: { index: false, follow: false },
};

export default function SquareCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
