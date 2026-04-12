import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReviewClient } from './ReviewClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Extracted Items',
};

export default function ReviewPage() {
  return (
    <Suspense>
      <ReviewClient />
    </Suspense>
  );
}
