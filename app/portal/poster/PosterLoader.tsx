'use client';

import dynamic from 'next/dynamic';

const PosterClient = dynamic(() => import('./PosterClient').then(m => ({ default: m.PosterClient })), { ssr: false });

export default function PosterLoader() {
  return <PosterClient />;
}
