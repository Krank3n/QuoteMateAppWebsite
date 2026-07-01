import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RoundupArticle from '../../components/RoundupArticle';
import { bestPages, getBestBySlug, getBestContent } from '../data';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return bestPages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getBestBySlug(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: `https://quotemateapp.au/best/${page.slug}` },
  };
}

export default async function BestPageRoute({ params }: Props) {
  const { slug } = await params;
  const page = getBestBySlug(slug);
  if (!page) notFound();
  const content = getBestContent(page.slug);

  return (
    <RoundupArticle
      badge="Best of 2026"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Best', href: '/best' },
        { label: page.h1 },
      ]}
      h1={page.h1}
      tagline={page.tagline}
      tableTitle="At a glance"
      items={page.items}
      content={content}
      canonical={`https://quotemateapp.au/best/${page.slug}/`}
      schemaName={page.h1}
      schemaDescription={page.metaDescription}
      related={[
        {
          heading: 'More best-of guides',
          links: bestPages.filter((p) => p.slug !== page.slug).map((p) => ({
            label: p.h1.replace('The Best ', 'Best ').replace('The Best', 'Best'),
            href: `/best/${p.slug}`,
          })),
        },
        {
          heading: 'Compare & switch',
          links: [
            { label: 'All QuoteMate comparisons', href: '/compare' },
            { label: 'Tradify alternatives', href: '/alternatives/tradify' },
            { label: 'ServiceM8 alternatives', href: '/alternatives/servicem8' },
          ],
        },
        {
          heading: 'QuoteMate',
          links: [
            { label: 'Pricing', href: '/pricing' },
            { label: 'Browse by trade', href: '/trades' },
            { label: 'Quoting guides', href: '/articles' },
          ],
        },
      ]}
    />
  );
}
