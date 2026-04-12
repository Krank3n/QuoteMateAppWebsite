import type { Metadata } from 'next';
import JoinLoader from './JoinLoader';

export const metadata: Metadata = {
  title: 'Get Live Supplier Prices',
  description: 'Subscribe to your local supplier and get their latest prices synced straight into your QuoteMate quotes.',
};

export default function JoinPage() {
  return <JoinLoader />;
}
