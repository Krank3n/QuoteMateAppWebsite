'use client';

import dynamic from 'next/dynamic';

const UploadClient = dynamic(() => import('./UploadClient').then(m => ({ default: m.UploadClient })), { ssr: false });

export default function UploadLoader() {
  return <UploadClient />;
}
