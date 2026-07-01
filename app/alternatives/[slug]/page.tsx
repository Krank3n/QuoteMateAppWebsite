import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import RoundupArticle from '../../components/RoundupArticle';
import { alternativePages, getAlternativeBySlug, getAlternativeContent } from '../data';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return alternativePages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getAlternativeBySlug(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.metaDescription,
    alternates: { canonical: `https://quotemateapp.au/alternatives/${page.slug}` },
  };
}

export default async function AlternativesPage({ params }: Props) {
  const { slug } = await params;
  const page = getAlternativeBySlug(slug);
  if (!page) notFound();
  const content = getAlternativeContent(page.slug);

  return (
    <RoundupArticle
      badge="Alternatives"
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Alternatives', href: '/alternatives' },
        { label: `${page.competitor} alternatives` },
      ]}
      h1={page.h1}
      tagline={page.tagline}
      tableTitle={`The best ${page.competitor} alternatives at a glance`}
      items={page.items}
      reasons={{ heading: `Why tradies look for a ${page.competitor} alternative`, points: page.reasons }}
      content={content}
      canonical={`https://quotemateapp.au/alternatives/${page.slug}/`}
      schemaName={`Best ${page.competitor} alternatives for Australian tradies`}
      schemaDescription={page.metaDescription}
      related={[
        {
          heading: 'More alternatives',
          links: alternativePages.filter((p) => p.slug !== page.slug).map((p) => ({
            label: `${p.competitor} alternatives`,
            href: `/alternatives/${p.slug}`,
          })),
        },
        {
          heading: 'Compare QuoteMate',
          links: [
            { label: `QuoteMate vs ${page.competitor}`, href: `/compare/${page.slug}` },
            { label: 'All comparisons', href: '/compare' },
            { label: 'Best quoting app for tradies', href: '/best/quoting-app-for-tradies' },
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
