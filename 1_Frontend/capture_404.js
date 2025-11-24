const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];

  page.on('response', async response => {
    const status = response.status();
    const url = response.url();
    const method = response.request().method();

    if (status === 404) {
      errors.push({ status, url, method });
      console.log(`\n🔴 404 ERROR FOUND!`);
      console.log(`   URL: ${url}`);
      console.log(`   Method: ${method}`);
    }
  });

  console.log('Loading page...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 30000
  });

  await page.waitForTimeout(15000);

  console.log('\n=== 404 ERRORS SUMMARY ===\n');

  if (errors.length === 0) {
    console.log('No 404 errors found.');
  } else {
    console.log(`Found ${errors.length} 404 error(s):\n`);
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.method} ${err.url}`);
    });
  }

  await browser.close();
})();
