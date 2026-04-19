import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconDashboard = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
);

export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

export const IconSupplier = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M3 16v5h5"/><path d="M21 16v5h-5"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
);

export const IconCampaign = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M3 11l18-8-5 18-6-7-7-3z"/></svg>
);

export const IconFeedback = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);

export const IconPipeline = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="5" height="13" rx="1"/></svg>
);

export const IconAffiliate = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
);

export const IconEmail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
);

export const IconPhone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);

export const IconNote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
);

export const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.3"/></svg>
);

export const IconSend = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="m22 2-7 20-4-9-9-4 20-7z"/><path d="M22 2 11 13"/></svg>
);

export const IconLogout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
);

export const IconExternal = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);

export const IconClock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export const IconTrendUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

export const IconSubscription = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
);

export const IconQuote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base} {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>
);
