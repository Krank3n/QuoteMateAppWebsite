import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const DashboardClient = dynamic(() => import('./DashboardClient').then(m => ({ default: m.DashboardClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
