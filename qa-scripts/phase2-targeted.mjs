import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4599';

(async () => {
  const browser = await chromium.launch();

  // One page load, scroll to each section by ID
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/?variant=b`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const ids = ['reviews', 'pricing', 'platforms', 'trades', 'faq', 'download'];

  for (const id of ids) {
    // Scroll the element into view
    await page.evaluate((elId) => {
      const el = document.getElementById(elId);
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, id);
    await page.waitForTimeout(400);

    const buf = await page.screenshot();
    writeFileSync(`/tmp/p2-b-target-${id}.png`, buf);
    console.log(`Saved /tmp/p2-b-target-${id}.png`);
  }

  // Also check the actual section starts by getting their offsets
  const offsets = await page.evaluate(() => {
    const ids = ['hero-b','integrations','walkthrough','features','reviews','pricing','platforms','trades','faq','signup','contact','download'];
    return ids.map(id => {
      const el = document.getElementById(id);
      const scrollY = 0;
      if (!el) return { id, top: -1 };
      const r = el.getBoundingClientRect();
      return { id, top: Math.round(r.top + window.pageYOffset) };
    });
  });
  console.log('\nSection offsets:');
  offsets.forEach(o => console.log(`  ${o.id}: ${o.top}`));

  await page.close();
  await browser.close();
  console.log('Done');
})();
