'use client';

import dynamic from 'next/dynamic';

const XeroPortalCallbackClient = dynamic(
  () => import('./XeroPortalCallbackClient').then((m) => ({ default: m.XeroPortalCallbackClient })),
  { ssr: false }
);

export default function XeroPortalCallbackLoader() {
  return <XeroPortalCallbackClient />;
}
