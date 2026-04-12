import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardClient } from './DashboardClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}
