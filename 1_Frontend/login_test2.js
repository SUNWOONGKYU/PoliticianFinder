const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  
  console.log('=== PoliticianFinder 로그인 테스트 ===');
  console.log('Email: wksun999@naver.com');
  console.log('Password: na5215900\n');

  await page.goto(url + '/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  await page.fill('input[type="email"], input[name="email"]', 'wksun999@naver.com');
  await page.fill('input[type="password"], input[name="password"]', 'na5215900');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  console.log('결과 URL:', currentUrl);
  
  if (!currentUrl.includes('/auth/login')) {
    console.log('✅ 로그인 성공!');
  } else {
    console.log('❌ 로그인 실패');
    const error = await page.locator('[class*="error"], [class*="alert"]').first().textContent().catch(() => '');
    if (error) console.log('에러:', error);
  }
  
  await page.screenshot({ path: './screenshot_login_result.png' });
  await browser.close();
})();
