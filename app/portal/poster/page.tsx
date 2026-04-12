import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const PosterClient = dynamic(() => import('./PosterClient').then(m => ({ default: m.PosterClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Your Poster',
};

export default function PosterPage() {
  return <PosterClient />;
}
