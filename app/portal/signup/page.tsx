import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignUpClient } from './SignUpClient';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpClient />
    </Suspense>
  );
}
