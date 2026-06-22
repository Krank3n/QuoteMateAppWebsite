import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';
import FAQ from '../../components/FAQ';
import CTAButtons from '../../components/CTAButtons';
import { manageJobsHub, getManageJobsSpokeBySlug } from '@/lib/data';
import { OG_IMAGES } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return (manageJobsHub?.spokes ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const spoke = getManageJobsSpokeBySlug(slug);
  if (!spoke) return {};
  const url = `https://quotemateapp.au/manage-jobs/${spoke.slug}`;
  return {
    title: spoke.metaTitle,
    description: spoke.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: spoke.metaTitle,
      description: spoke.metaDescription,
      images: OG_IMAGES,
    },
    twitter: {
      card: 'summary_large_image',
      title: spoke.metaTitle,
      description: spoke.metaDescription,
      images: OG_IMAGES,
    },
  };
}

export default async function ManageJobsSpokePage({ params }: Props) {
  const { slug } = await params;
  const spoke = getManageJobsSpokeBySlug(slug);
  if (!spoke || !manageJobsHub) notFound();

  const otherSpokes = manageJobsHub.spokes.filter((s) => s.slug !== spoke.slug);

  return (
    <>
      <Header homeLinks />
      <main>
        <section className="seo-hero">
          <div className="container">
            <Breadcrumbs items={[
              { label: 'Home', href: '/' },
              { label: 'Manage Jobs', href: '/manage-jobs' },
              { label: spoke.shortLabel },
            ]} />
            <div className="seo-hero-content">
              <span className="seo-badge">Job Management Guide</span>
              <h1 className="seo-hero-title">{spoke.title}</h1>
              <p className="seo-hero-subtitle">{spoke.summary}</p>
              <CTAButtons showWebLink />
            </div>
          </div>
        </section>

        <section className="seo-rich-content">
          <div className="container">
            <div className="rich-content-block">
              <p className="rich-content-intro">{spoke.intro}</p>
              {spoke.sections.map((sec, i) => (
                <div key={i} className="rich-content-section">
                  <h2>{sec.heading}</h2>
                  <p>{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="seo-faq">
          <div className="container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <FAQ items={spoke.faqs} />
          </div>
        </section>

        <section className="seo-internal-links">
          <div className="container">
            <div className="links-grid">
              <div className="links-column">
                <h3>More from the Manage Jobs Hub</h3>
                <ul>
                  {otherSpokes.map((s) => (
                    <li key={s.slug}>
                      <Link href={`/manage-jobs/${s.slug}`}>{s.shortLabel}</Link>
                    </li>
                  ))}
                  <li><Link href="/manage-jobs">Back to Manage Jobs Hub</Link></li>
                </ul>
              </div>
              <div className="links-column">
                <h3>QuoteMate</h3>
                <ul>
                  <li><Link href="/quoting">Quoting Tools Hub</Link></li>
                  <li><Link href="/get-paid">Payments Hub</Link></li>
                  <li><Link href="/pricing">Pricing</Link></li>
                  <li><Link href="/templates">Quote Templates</Link></li>
                  <li><Link href="/trades">Quoting Apps by Trade</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: spoke.faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })}} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: spoke.title,
        description: spoke.summary,
        url: `https://quotemateapp.au/manage-jobs/${spoke.slug}`,
        publisher: {
          '@type': 'Organization',
          name: 'QuoteMate',
          url: 'https://quotemateapp.au',
        },
      })}} />
    </>
  );
}
