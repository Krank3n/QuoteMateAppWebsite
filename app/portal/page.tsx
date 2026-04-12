import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const UploadClient = dynamic(() => import('./UploadClient').then(m => ({ default: m.UploadClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Upload Price List',
};

export default function PortalPage() {
  return <UploadClient />;
}
