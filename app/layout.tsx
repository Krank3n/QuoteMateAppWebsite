import type { Metadata } from 'next';
import { Inter, Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import ScrollReveal from './components/ScrollReveal';
import Analytics from './components/Analytics';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-grotesk',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://quotemateapp.au'),
  title: {
    default: 'QuoteMate — Professional Quotes & Invoices for Australian Tradies',
    template: '%s — QuoteMate',
  },
  description: 'Create professional quotes and invoices in under 2 minutes. AI-powered quoting app with real-time supplier pricing, built for Australian tradies.',
  icons: { icon: '/assets/favicon.png' },
  itunes: { appId: '6754000046' },
  openGraph: {
    type: 'website',
    siteName: 'QuoteMate',
    images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: 'QuoteMate — AI-powered quoting app for Australian tradies' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: '/assets/og-image.jpg', width: 1200, height: 630, alt: 'QuoteMate — AI-powered quoting app for Australian tradies' }],
  },
  alternates: {
    languages: { 'en-AU': 'https://quotemateapp.au' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${inter.className}`}>
      <body>
        <Analytics />
        {children}
        <ScrollReveal />
      </body>
    </html>
  );
}
