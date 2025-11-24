const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];

  // 모든 응답 캡처
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (status >= 400) {
      console.log(`\n❌ ERROR ${status}: ${url}`);
      console.log(`   Method: ${response.request().method()}`);

      try {
        const body = await response.text();
        console.log(`   Response:`, body.substring(0, 500));

        errors.push({
          status,
          url,
          method: response.request().method(),
          body: body
        });
      } catch (e) {
        console.log(`   (Could not read response body)`);
      }
    }
  });

  console.log('🌐 Loading page...\n');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 30000
  });

  console.log('\n⏳ Waiting 10 seconds for full render...\n');
  await page.waitForTimeout(10000);

  // 관심 정치인 버튼 클릭
  console.log('🖱️  Clicking favorite button...\n');
  const favoriteBtn = await page.$('button[title*="관심 정치인"]');
  if (favoriteBtn) {
    await favoriteBtn.click();
    await page.waitForTimeout(3000);
  } else {
    console.log('❌ Favorite button not found');
  }

  // 별점 평가 버튼 클릭
  console.log('\n🖱️  Clicking rating button...\n');
  const ratingBtn = await page.$('button[title="별점 평가"]');
  if (ratingBtn) {
    await ratingBtn.click();
    await page.waitForTimeout(2000);

    // 5점 클릭 시도
    const star5 = await page.$$('button');
    for (const btn of star5) {
      const text = await btn.textContent();
      if (text && text.includes('5')) {
        console.log('Clicking 5 stars...');
        await btn.click();
        await page.waitForTimeout(1000);
        break;
      }
    }

    // 평가하기 버튼 클릭
    const submitBtns = await page.$$('button');
    for (const btn of submitBtns) {
      const text = await btn.textContent();
      if (text && (text.includes('평가') || text.includes('제출') || text.includes('저장'))) {
        console.log('Clicking submit...');
        await btn.click();
        await page.waitForTimeout(3000);
        break;
      }
    }
  } else {
    console.log('❌ Rating button not found');
  }

  console.log('\n\n=== ERROR SUMMARY ===\n');
  if (errors.length === 0) {
    console.log('✅ No errors detected!');
  } else {
    errors.forEach((err, i) => {
      console.log(`\nError ${i + 1}:`);
      console.log(`  Status: ${err.status}`);
      console.log(`  Method: ${err.method}`);
      console.log(`  URL: ${err.url}`);
      console.log(`  Body: ${err.body.substring(0, 300)}`);
    });
  }

  console.log('\n\n Browser will close in 5 seconds...\n');
  await page.waitForTimeout(5000);
  await browser.close();
})();
