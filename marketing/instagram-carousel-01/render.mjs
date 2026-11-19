// Renders each slide of ad.html to output/siso-sign-ad-0N.jpg (1080x1350).
// Run from marketing/: npm run carousel   (needs `npm run fetch-media` first)
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const slides = 7;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let n = 1; n <= slides; n += 1) {
  await page.goto(`file://${here}ad.html#${n}`);
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => [...document.querySelectorAll('.slide.on img')].filter((img) => !img.naturalWidth).map((img) => img.getAttribute('src')));
  if (missing.length) throw new Error(`Slide ${n}: missing photos ${missing.join(', ')}. Run npm run fetch-media.`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${here}output/siso-sign-ad-0${n}.jpg`, type: 'jpeg', quality: 92 });
  console.log(`slide ${n}`);
}
await browser.close();
