import type { Metadata } from 'next';
import ReviewLoader from './ReviewLoader';

export const metadata: Metadata = {
  title: 'Review Extracted Items',
};

export default function ReviewPage() {
  return <ReviewLoader />;
}
