'use client';

import dynamic from 'next/dynamic';

const SignUpClient = dynamic(() => import('./SignUpClient').then(m => ({ default: m.SignUpClient })), { ssr: false });

export default function SignUpLoader() {
  return <SignUpClient />;
}
