import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import CookieBanner from './components/CookieBanner';
import ScrollReveal from './components/ScrollReveal';
import Analytics from './components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://quotemateapp.au'),
  title: {
    default: 'QuoteMate — Professional Quotes & Invoices for Australian Tradies',
    template: '%s — QuoteMate',
  },
  description: 'Create professional quotes and invoices in under 2 minutes. AI-powered quoting app with real-time Bunnings & Mitre 10 pricing, built for Australian tradies.',
  icons: { icon: '/assets/favicon.png' },
  openGraph: {
    type: 'website',
    siteName: 'QuoteMate',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: 'QuoteMate — AI-powered quoting app for Australian tradies' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: 'QuoteMate — AI-powered quoting app for Australian tradies' }],
  },
  other: {
    'apple-itunes-app': 'app-id=PLACEHOLDER',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={inter.className}>
      <body>
        <Analytics />
        {children}
        <CookieBanner />
        <ScrollReveal />
      </body>
    </html>
  );
}
