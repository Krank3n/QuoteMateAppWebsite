'use client';

import dynamic from 'next/dynamic';

const JoinClient = dynamic(() => import('./JoinClient').then(m => ({ default: m.JoinClient })), { ssr: false });

export default function JoinLoader() {
  return <JoinClient />;
}
