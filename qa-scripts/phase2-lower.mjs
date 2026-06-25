import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4599';

const shots = [
  { label: 'reviews',      scrollY: 6481 },
  { label: 'pricing',      scrollY: 7021 },
  { label: 'platforms',    scrollY: 7871 },
  { label: 'trades',       scrollY: 8454 },
  { label: 'faq',          scrollY: 9144 },
  { label: 'signup',       scrollY: 10226 },
  { label: 'download-cta', scrollY: 11250 },
  { label: 'footer',       scrollY: 11600 },
];

(async () => {
  const browser = await chromium.launch();
  for (const s of shots) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/?variant=b`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(600);
    await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, s.scrollY));
    await page.waitForTimeout(300);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/p2-b-lo-${s.label}.png`, buf);
    console.log(`Saved /tmp/p2-b-lo-${s.label}.png`);
    await page.close();
  }
  await browser.close();
  console.log('Done');
})();
