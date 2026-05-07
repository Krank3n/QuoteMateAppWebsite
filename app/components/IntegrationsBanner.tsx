import Image from 'next/image';
import Link from 'next/link';

type Partner = {
  name: string;
  src: string;
  width: number;
  height: number;
  tag?: 'Coming soon';
  href?: string;
};

const partners: Partner[] = [
  { name: 'Xero', src: '/assets/partners/xero.png', width: 120, height: 120 },
  { name: 'Square', src: '/assets/partners/square.png', width: 180, height: 60 },
  { name: 'CallKatie AI Receptionist', src: '/assets/partners/callkatie.svg', width: 140, height: 140 },
  { name: 'Google Calendar', src: '/assets/partners/google-calendar.svg', width: 100, height: 100 },
  { name: 'Reece maX', src: '/assets/partners/reece.png', width: 140, height: 90, href: '/integrations/reece' },
];

function PartnerCardContent({ partner, decorative }: { partner: Partner; decorative: boolean }) {
  return (
    <>
      <Image
        src={partner.src}
        alt={decorative ? '' : `${partner.name} logo`}
        width={partner.width}
        height={partner.height}
        className="integration-logo"
      />
      {partner.tag && (
        <span className="integration-status integration-status-soon">{partner.tag}</span>
      )}
    </>
  );
}

function Group({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul className="integrations-group" aria-hidden={ariaHidden || undefined}>
      {partners.map((p) => {
        const inner = <PartnerCardContent partner={p} decorative={ariaHidden} />;
        return (
          <li key={p.name} className="integration-card">
            {p.href && !ariaHidden ? (
              <Link href={p.href} aria-label={`${p.name} integration`} className="integration-card-link">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function IntegrationsBanner() {
  return (
    <section className="integrations-banner" id="integrations" aria-labelledby="integrations-heading">
      <div className="container">
        <div className="section-header">
          <h2 id="integrations-heading" className="section-title">
            Integrations &amp; <span className="text-gradient">Partners</span>
          </h2>
          <p className="section-subtitle">
            QuoteMate plays nicely with the tools and suppliers Aussie tradies already use.
          </p>
        </div>
        <div className="integrations-marquee">
          <div className="integrations-track">
            <Group />
            <Group ariaHidden />
            <Group ariaHidden />
          </div>
        </div>
      </div>
    </section>
  );
}
