import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 375, height: 812 }
});
const page = await context.newPage();

await page.goto('https://politician-finder-j3j1nap74-finder-world.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000);

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1000);

await page.screenshot({ path: 'footer-mobile.png', fullPage: false });
console.log('완료');

await browser.close();
