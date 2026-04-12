import type { Metadata } from 'next';
import { Suspense } from 'react';
import { UploadClient } from './UploadClient';

export const metadata: Metadata = {
  title: 'Upload Price List',
};

export default function PortalPage() {
  return (
    <Suspense>
      <UploadClient />
    </Suspense>
  );
}
