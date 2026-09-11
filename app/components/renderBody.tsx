import type { ReactNode } from 'react';

const URL_REGEX = /\bhttps?:\/\/[^\s<>()"']+/g;

/**
 * Render a paragraph of stored copy, turning any https URL into a link shown
 * without its scheme. Shared by the article pages and the roundup guides so
 * a URL written into content JSON reads the same everywhere and is never
 * printed as bare text.
 */
export function renderBody(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(URL_REGEX);
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const url = match[0].replace(/[.,;:!?)]+$/, '');
    const trailing = match[0].slice(url.length);
    const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    nodes.push(
      <a key={match.index} href={url} target="_blank" rel="noopener noreferrer">{display}</a>
    );
    if (trailing) nodes.push(trailing);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
