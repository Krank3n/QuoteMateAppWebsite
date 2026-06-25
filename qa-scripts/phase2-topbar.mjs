import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:4599/?variant=b', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Get topbar computed background
  const topbarBg = await page.evaluate(() => {
    const tb = document.querySelector('.topbar');
    return tb ? window.getComputedStyle(tb).background : 'not found';
  });
  console.log('Topbar computed background:', topbarBg);

  // Screenshot the top 80px
  const buf = await page.screenshot();
  // Write the full viewport shot from top
  writeFileSync('/tmp/p2-b-topbar.png', buf);
  console.log('Saved /tmp/p2-b-topbar.png');

  await browser.close();
})();
