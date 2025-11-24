const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 30000
  });

  await page.waitForTimeout(10000);

  console.log('\n=== ALL BUTTONS ON PAGE ===\n');

  const buttons = await page.$$('button');
  console.log(`Total buttons: ${buttons.length}\n`);

  for (let i = 0; i < Math.min(buttons.length, 30); i++) {
    const btn = buttons[i];
    const title = await btn.getAttribute('title');
    const text = await btn.textContent();
    const classes = await btn.getAttribute('class');

    console.log(`Button ${i + 1}:`);
    if (title) console.log(`  title: "${title}"`);
    if (text && text.trim()) console.log(`  text: "${text.trim().substring(0, 50)}"`);
    if (classes) console.log(`  class: "${classes.substring(0, 80)}..."`);
    console.log();
  }

  await page.waitForTimeout(5000);
  await browser.close();
})();
