/**
 * Phase 2 section crops using scroll-then-clip approach
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'http://localhost:4599';

(async () => {
  const browser = await chromium.launch();

  // Variant B desktop - sections via scroll
  {
    const sections = [
      { id: 'integrations', approxY: 856 },
      { id: 'walkthrough',  approxY: 1262 },
      { id: 'features',     approxY: 2111 },
      { id: 'get-paid',     approxY: 5337 },
      { id: 'how-it-works', approxY: 5998 },
      { id: 'reviews',      approxY: 6541 },
      { id: 'pricing',      approxY: 7081 },
      { id: 'platforms',    approxY: 7931 },
      { id: 'trades',       approxY: 8514 },
      { id: 'faq',          approxY: 9204 },
      { id: 'download',     approxY: 11311 },
      { id: 'footer',       approxY: 11654 },
    ];

    for (const s of sections) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${BASE}/?variant=b`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(800);
      // Scroll to section
      await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, s.approxY - 60));
      await page.waitForTimeout(400);
      const buf = await page.screenshot();
      writeFileSync(`/tmp/p2-b-sec-${s.id}.png`, buf);
      console.log(`Saved: /tmp/p2-b-sec-${s.id}.png (scrolled to ${s.approxY})`);
      await page.close();
    }
  }

  await browser.close();
  console.log('Done.');
})();
