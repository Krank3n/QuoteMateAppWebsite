import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { QuoteTemplate } from '../../lib/data';
import { templateLineItems, WORKSHEET_NOTE } from '../../lib/templateDownloads';

const HEADERS = ['Description', 'Quantity', 'Unit', 'Rate (AUD)', 'Amount (AUD)'];
const INSTRUCTIONS = [
  'Enter your business details, ABN, customer details and the job scope.',
  'Replace the suggested items with the materials and work actually required.',
  'Enter your own quantities, units, rates and amounts. No prices or formulas are supplied.',
  'State whether prices include GST. Only charge GST where applicable to your business.',
  'List inclusions, exclusions, payment terms and the quote validity period.',
  'Review the completed worksheet before sharing it with your customer.',
];

export function createTemplateWorkbook(template: QuoteTemplate): XLSX.WorkBook {
  const rows: (string | number)[][] = [
    [template.name],
    ['Blank worksheet — all amounts in AUD'],
    ['Business name', '', '', 'ABN', ''],
    ['Contact details', ''],
    ['Customer', '', '', 'Quote reference', ''],
    ['Job address', '', '', 'Quote date', ''],
    ['Scope of work', ''],
    [],
    HEADERS,
    ...templateLineItems(template).map(item => [item, '', '', '', '']),
    ['', '', '', '', ''],
    ['', '', '', 'Subtotal', ''],
    ['', '', '', 'GST (if applicable)', ''],
    ['', '', '', 'Total (AUD)', ''],
    ['Prices include / exclude GST (specify)', ''],
    ['Inclusions', ''],
    ['Exclusions', ''],
    ['Payment terms', ''],
    ['Valid until', ''],
    [],
    [WORKSHEET_NOTE],
    ['Source', `https://quotemateapp.au/templates/${template.slug}/`],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 65 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 20 }];
  const instructions = XLSX.utils.aoa_to_sheet([
    ['How to use this blank worksheet'],
    ...INSTRUCTIONS.map((line, i) => [`${i + 1}. ${line}`]),
    [],
    ['For supplier pricing, quote editing and sending, use the QuoteMate app.'],
    ['https://quotemateapp.au/app?signup=1'],
  ]);
  instructions['!cols'] = [{ wch: 110 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Quote worksheet');
  XLSX.utils.book_append_sheet(book, instructions, 'Instructions');
  return book;
}

// jsPDF's built-in Helvetica is not a Unicode font. Normalise punctuation and
// common material units rather than producing corrupted glyphs in downloads.
export function pdfText(text: string): string {
  return text.replace(/[–—]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/²/g, '2').replace(/³/g, '3').replace(/×/g, 'x').replace(/[^\x20-\x7E\n]/g, '');
}

export function createTemplatePdf(template: QuoteTemplate): ArrayBuffer {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  pdf.setProperties({ title: template.name, author: 'QuoteMate', subject: 'Blank quote worksheet' });
  // Fixed document metadata avoids build-time freshness claims in the asset.
  pdf.setCreationDate(new Date('2026-09-07T00:00:00Z'));
  pdf.setFontSize(17);
  const title = pdf.splitTextToSize(pdfText(template.name), 180);
  pdf.text(title, 15, 20);
  let y = 24 + title.length * 7;
  pdf.setFontSize(9);
  pdf.text('Blank worksheet | AUD | No prices supplied', 15, y);
  y += 10;
  for (const line of ['Business: ______________________________  ABN: _____________________',
    'Contact: _________________________________________________________',
    'Customer: _______________________________________________________',
    'Job address: _____________________________________________________',
    'Quote reference: ______________  Date: __________  Valid until: __________',
    'Scope: __________________________________________________________']) {
    pdf.text(line, 15, y); y += 7;
  }
  y += 3;
  const x = [15, 109, 128, 144, 168, 195];
  const tableHeader = () => {
    pdf.setFillColor(240, 240, 240); pdf.rect(15, y, 180, 9, 'F');
    pdf.setFontSize(8);
    ['Description', 'Qty', 'Unit', 'Rate (AUD)', 'Amount (AUD)'].forEach((h, i) => pdf.text(h, x[i] + 2, y + 6));
    y += 9;
  };
  const ensureRoom = (height: number, table = false) => {
    if (y + height <= 263) return;
    pdf.addPage(); y = 20;
    if (table) tableHeader();
  };
  tableHeader();
  for (const item of templateLineItems(template)) {
    const lines = pdf.splitTextToSize(pdfText(item), 89);
    const height = Math.max(10, lines.length * 4 + 4);
    ensureRoom(height, true);
    pdf.setDrawColor(180);
    for (let i = 0; i < 5; i++) pdf.rect(x[i], y, x[i + 1] - x[i], height);
    pdf.text(lines, 17, y + 5);
    y += height;
  }
  y += 8;
  pdf.setFontSize(9);
  for (const line of ['Subtotal (AUD): __________   GST if applicable: __________   Total (AUD): __________',
    'Prices include / exclude GST (specify): __________________________________',
    'Inclusions / exclusions: ______________________________________________',
    '________________________________________________________________',
    'Payment terms: ___________________________________________________']) {
    ensureRoom(8); pdf.text(line, 15, y); y += 8;
  }
  ensureRoom(30);
  pdf.setFontSize(8);
  pdf.text(pdf.splitTextToSize(pdfText(WORKSHEET_NOTE), 180), 15, y + 2);
  for (let page = 1; page <= pdf.getNumberOfPages(); page++) {
    pdf.setPage(page); pdf.setFontSize(8); pdf.setTextColor(90);
    pdf.text('QuoteMate | Blank worksheet - review before use', 15, 280);
    pdf.text(`${page} / ${pdf.getNumberOfPages()}`, 180, 280);
    pdf.textWithLink('Source template and app', 15, 285, { url: `https://quotemateapp.au/templates/${template.slug}/` });
  }
  return pdf.output('arraybuffer');
}
