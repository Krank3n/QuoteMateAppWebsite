import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ReviewClient = dynamic(() => import('./ReviewClient').then(m => ({ default: m.ReviewClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Review Extracted Items',
};

export default function ReviewPage() {
  return <ReviewClient />;
}
