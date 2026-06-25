/**
 * Slowly scroll to trigger IntersectionObserver, then screenshot sections
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4599';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/?variant=b`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);

  // Simulate natural scroll to trigger IntersectionObserver for all elements
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  const step = 300;
  for (let y = 0; y < totalHeight; y += step) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(50);
  }
  // Scroll back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Now all elements should be revealed
  const sections = [
    { id: 'reviews',   label: 'reviews' },
    { id: 'pricing',   label: 'pricing' },
    { id: 'download',  label: 'download-cta' },
  ];

  for (const s of sections) {
    await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, s.id);
    await page.waitForTimeout(300);
    const buf = await page.screenshot();
    writeFileSync(`/tmp/p2-b-slow-${s.label}.png`, buf);
    console.log(`Saved /tmp/p2-b-slow-${s.label}.png`);
  }

  await browser.close();
  console.log('Done');
})();
