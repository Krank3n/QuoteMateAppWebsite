import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Supplier Portal',
    template: '%s — QuoteMate Supplier Portal',
  },
  description: 'Upload your price list and let tradies subscribe to your latest prices through QuoteMate.',
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-darkest)' }}>
      {children}
    </div>
  );
}
