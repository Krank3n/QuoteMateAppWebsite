import type { Metadata } from 'next';
import SignUpLoader from './SignUpLoader';

export const metadata: Metadata = {
  title: 'Create Account',
};

export default function SignUpPage() {
  return <SignUpLoader />;
}
