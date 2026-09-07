import type { QuoteTemplate } from './data';

export const TEMPLATE_DOWNLOAD_DIR = '/assets/quote-templates';

/** Static printable PDF / editable Excel worksheets. No price claims or quote generator. */
export function templateDownloadLinks(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid template slug');
  return {
    pdf: `${TEMPLATE_DOWNLOAD_DIR}/${slug}.pdf`,
    excel: `${TEMPLATE_DOWNLOAD_DIR}/${slug}.xlsx`,
  };
}

export const WORKSHEET_NOTE = 'Blank worksheet: enter your own quantities, rates and GST treatment. Listed materials are prompts, not a complete specification. Verify the scope, site conditions and applicable requirements before quoting.';

export function templateLineItems(template: QuoteTemplate): string[] {
  return [...template.materials, 'Labour', 'Delivery / equipment hire', 'Other allowance (describe)'];
}
