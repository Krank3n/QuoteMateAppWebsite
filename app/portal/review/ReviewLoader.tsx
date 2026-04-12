'use client';

import dynamic from 'next/dynamic';

const ReviewClient = dynamic(() => import('./ReviewClient').then(m => ({ default: m.ReviewClient })), { ssr: false });

export default function ReviewLoader() {
  return <ReviewClient />;
}
