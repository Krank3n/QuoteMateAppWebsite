import type { Metadata } from 'next';
import XeroPortalCallbackLoader from './XeroPortalCallbackLoader';

export const metadata: Metadata = {
  title: 'Connecting Xero...',
};

export default function PortalXeroCallbackPage() {
  return <XeroPortalCallbackLoader />;
}
