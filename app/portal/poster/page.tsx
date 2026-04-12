import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PosterClient } from './PosterClient';

export const metadata: Metadata = {
  title: 'Your Poster',
};

export default function PosterPage() {
  return (
    <Suspense>
      <PosterClient />
    </Suspense>
  );
}
