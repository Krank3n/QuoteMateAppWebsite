import Image from 'next/image';

type Partner = {
  name: string;
  src: string;
  width: number;
  height: number;
  tag?: 'Coming soon';
};

const partners: Partner[] = [
  { name: 'Xero', src: '/assets/partners/xero.png', width: 120, height: 120 },
  { name: 'Square', src: '/assets/partners/square.png', width: 180, height: 60 },
  { name: 'CallKatie AI Receptionist', src: '/assets/partners/callkatie.svg', width: 140, height: 140 },
  { name: 'Google Calendar', src: '/assets/partners/google-calendar.svg', width: 100, height: 100 },
  { name: 'Reece Plumbing', tag: 'Coming soon', src: '/assets/partners/reece.png', width: 140, height: 90 },
];

function Group({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <ul className="integrations-group" aria-hidden={ariaHidden || undefined}>
      {partners.map((p) => (
        <li key={p.name} className="integration-card">
          <Image
            src={p.src}
            alt={ariaHidden ? '' : `${p.name} logo`}
            width={p.width}
            height={p.height}
            className="integration-logo"
          />
          {p.tag && (
            <span className="integration-status integration-status-soon">{p.tag}</span>
          )}
        </li>
      ))}
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
