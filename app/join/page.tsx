import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const JoinClient = dynamic(() => import('./JoinClient').then(m => ({ default: m.JoinClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Get Live Supplier Prices',
  description: 'Subscribe to your local supplier and get their latest prices synced straight into your QuoteMate quotes.',
};

export default function JoinPage() {
  return <JoinClient />;
}
