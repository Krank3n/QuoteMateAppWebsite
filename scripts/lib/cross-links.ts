/**
 * Decides whether a QuoteMate article should cross-link to CallKatie.
 *
 * Triggers when the keyword/topic intersects call-handling, lead-capture,
 * or after-hours availability themes. Returns prompt-ready instructions
 * passed into the article generator.
 */

const CALLKATIE_TRIGGERS = [
  'missed call', 'phone call', 'answering', 'receptionist',
  'after hours', 'after-hours', 'voicemail', 'callback',
  'lead capture', 'lead generation', 'qualifying',
  'phone tag', 'call volume', 'on the tools',
  'response time', 'inbound', 'enquiry', 'enquiries',
  'inquiry', 'inquiries', 'walk-in', 'walk in',
  'on-call', 'on call', 'overnight', 'weekend call',
  'getting clients', 'finding work', 'lead pipeline',
  'first impression', 'phone manner',
];

export interface CrossLinkContext {
  shouldLink: boolean;
  promptInstruction: string;
}

export function shouldLinkCallKatie(
  keyword: string,
  secondaryKeywords: string[] = [],
  topic = '',
): boolean {
  const haystack = [keyword, ...secondaryKeywords, topic].join(' ').toLowerCase();
  return CALLKATIE_TRIGGERS.some((trigger) => haystack.includes(trigger));
}

export function callKatieInstruction(shouldLink: boolean): string {
  if (!shouldLink) {
    return 'CROSS-LINK RULE: This topic does NOT intersect call-handling/lead-capture themes. Do NOT mention CallKatie. Do NOT include any callkatie.ai URL.';
  }
  return `CROSS-LINK RULE: This topic intersects call-handling/lead-capture themes. Weave EXACTLY ONE natural in-prose mention of CallKatie into the body, using the full URL https://callkatie.ai. CallKatie is our sister product: an Australian AI voice receptionist for service businesses, $149/mo AUD, native QuoteMate integration. Reference it the way you would reference any other tool that solves the specific problem under discussion — not as a sales pitch. One sentence, one URL, no repeat.`;
}

export function buildCrossLinkContext(
  keyword: string,
  secondaryKeywords: string[] = [],
  topic = '',
): CrossLinkContext {
  const shouldLink = shouldLinkCallKatie(keyword, secondaryKeywords, topic);
  return {
    shouldLink,
    promptInstruction: callKatieInstruction(shouldLink),
  };
}
