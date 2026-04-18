import type { Metadata } from 'next';
import AdminFrame from './components/AdminFrame';

export const metadata: Metadata = {
  title: {
    default: 'QuoteMate Admin',
    template: '%s · QuoteMate Admin',
  },
  description: 'QuoteMate internal admin CRM',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminFrame>{children}</AdminFrame>;
}
