/**
 * Phase 2 A/B variant screenshots
 * Usage: node qa-scripts/phase2-ab-screenshots.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:4599';
const shots = [
  { url: `${BASE}/?variant=b`, path: '/tmp/p2-b-desktop-full.png', w: 1440, h: 900 },
  { url: `${BASE}/?variant=b`, path: '/tmp/p2-b-mobile-full.png',  w: 390,  h: 844 },
  { url: `${BASE}/?variant=a`, path: '/tmp/p2-a-desktop-full.png', w: 1440, h: 900 },
];

(async () => {
  const browser = await chromium.launch();
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: shot.w, height: shot.h });
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 30000 });
    // Let animations settle
    await page.waitForTimeout(1500);
    await page.screenshot({ path: shot.path, fullPage: true });
    console.log(`Saved: ${shot.path}`);
    await page.close();
  }
  await browser.close();
})();
