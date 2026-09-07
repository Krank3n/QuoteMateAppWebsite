import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import { quoteTemplates } from '../lib/data';
import { templateDownloadLinks } from '../lib/templateDownloads';
import { createTemplatePdf, createTemplateWorkbook } from './lib/template-assets';

for (const template of quoteTemplates) {
  const links = templateDownloadLinks(template.slug);
  const pdfPath = path.join(process.cwd(), 'public', links.pdf);
  const excelPath = path.join(process.cwd(), 'public', links.excel);
  fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
  fs.writeFileSync(pdfPath, Buffer.from(createTemplatePdf(template)));
  XLSX.writeFile(createTemplateWorkbook(template), excelPath);
}
console.log(`Generated blank PDF/XLSX worksheets for ${quoteTemplates.length} templates.`);
