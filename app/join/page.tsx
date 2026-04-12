import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JoinClient } from './JoinClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Get Live Supplier Prices',
  description: 'Subscribe to your local supplier and get their latest prices synced straight into your QuoteMate quotes.',
};

export default function JoinPage() {
  return (
    <Suspense>
      <JoinClient />
    </Suspense>
  );
}
