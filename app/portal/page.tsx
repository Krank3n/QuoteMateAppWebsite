import type { Metadata } from 'next';
import UploadLoader from './UploadLoader';

export const metadata: Metadata = {
  title: 'Upload Price List',
};

export default function PortalPage() {
  return <UploadLoader />;
}
