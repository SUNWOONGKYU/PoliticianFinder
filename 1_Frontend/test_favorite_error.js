const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let errorFound = null;

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/favorites')) {
      const status = response.status();
      const method = response.request().method();

      console.log(`\n[API] ${method} ${url}`);
      console.log(`[STATUS] ${status}`);

      try {
        const body = await response.json();
        console.log(`[RESPONSE]`, JSON.stringify(body, null, 2));

        if (!body.success) {
          errorFound = body;
        }
      } catch(e) {
        console.log('[ERROR] Could not parse response');
      }
    }
  });

  console.log('Loading page...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 30000
  });

  await page.waitForTimeout(5000);

  const favoriteBtn = await page.$('button[title*="관심 정치인"]');
  if (favoriteBtn) {
    console.log('\nClicking favorite button...');
    await favoriteBtn.click();
    await page.waitForTimeout(5000);
  } else {
    console.log('\nFavorite button not found!');
  }

  if (errorFound) {
    console.log('\n=== ERROR FOUND ===');
    console.log(JSON.stringify(errorFound, null, 2));
  } else {
    console.log('\n=== NO ERROR ===');
  }

  await page.waitForTimeout(3000);
  await browser.close();
})();
