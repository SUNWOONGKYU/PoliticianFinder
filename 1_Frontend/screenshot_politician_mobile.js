const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-git-main-finder-world.vercel.app';

  console.log('=== 정치인 프로필 페이지 모바일 확인 ===\n');

  // 정치인 상세 페이지 (정원오 의원)
  console.log('[1] 정치인 상세 페이지');
  await page.goto(url + '/politicians/17270f25', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'politician_profile_mobile_1.png', fullPage: true });
  console.log('  -> politician_profile_mobile_1.png');

  // 스크롤 다운해서 하단 부분도 캡처
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'politician_profile_mobile_2.png' });
  console.log('  -> politician_profile_mobile_2.png (스크롤 후)');

  await browser.close();
  console.log('\n완료!');
})();
