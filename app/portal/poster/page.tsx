import type { Metadata } from 'next';
import PosterLoader from './PosterLoader';

export const metadata: Metadata = {
  title: 'Your Poster',
};

export default function PosterPage() {
  return <PosterLoader />;
}
