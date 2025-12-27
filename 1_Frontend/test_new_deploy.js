const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push('PageError: ' + error.message);
  });

  console.log('=== 최신 배포 테스트 ===\n');

  // 최신 배포 URL
  const newUrl = 'https://politician-finder-1xi1flxj7-finder-world.vercel.app';

  try {
    await page.goto(newUrl + '/politicians/17270f25', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'new_deploy_test.png', fullPage: true });
    console.log('스크린샷: new_deploy_test.png');

    const content = await page.content();
    const hasError = content.includes('오류') || content.includes('문제가 발생');
    const hasPolitician = content.includes('정원오') || content.includes('정치인');

    console.log('\n결과:');
    console.log('  오류 페이지 표시: ' + (hasError ? '❌ 예' : '✅ 아니오'));
    console.log('  정치인 정보 표시: ' + (hasPolitician ? '✅ 예' : '❌ 아니오'));

    if (errors.length > 0) {
      console.log('\n콘솔 에러:');
      errors.forEach((e, i) => console.log((i+1) + '. ' + e.substring(0, 200)));
    } else {
      console.log('\n콘솔 에러: 없음 ✅');
    }

  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  await browser.close();
})();
