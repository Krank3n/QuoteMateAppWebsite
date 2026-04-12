import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const SignUpClient = dynamic(() => import('./SignUpClient').then(m => ({ default: m.SignUpClient })), { ssr: false });

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return <SignUpClient />;
}
