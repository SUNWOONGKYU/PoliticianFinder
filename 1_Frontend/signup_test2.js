const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  
  console.log('=== 회원가입 테스트 ===\n');

  await page.goto(url + '/auth/signup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 입력
  await page.fill('input[name="email"]', 'wksun999@naver.com');
  
  const pwInputs = await page.locator('input[type="password"]').all();
  await pwInputs[0].fill('na5215900');
  await pwInputs[1].fill('na5215900');
  
  await page.fill('input[name="nickname"]', '써니1');
  
  // 체크박스 - 전체 동의
  const allCheckbox = await page.locator('#terms-all');
  if (await allCheckbox.count() > 0) {
    await allCheckbox.check();
  } else {
    const checkboxes = await page.locator('input[type="checkbox"]').all();
    for (const cb of checkboxes) {
      await cb.check().catch(() => {});
    }
  }
  
  await page.waitForTimeout(500);
  
  // 제출
  console.log('회원가입 버튼 클릭...');
  await page.click('button[type="submit"]');
  
  // 결과 대기
  await page.waitForTimeout(6000);
  
  const currentUrl = page.url();
  console.log('결과 URL:', currentUrl);
  
  // 스크린샷
  await page.screenshot({ path: './screenshot_signup_result.png', fullPage: true });
  
  // 페이지 내용 확인
  const content = await page.textContent('body');
  if (content.includes('인증') || content.includes('이메일을 확인')) {
    console.log('✅ 이메일 인증 안내 페이지로 이동');
  } else if (content.includes('오류') || content.includes('에러') || content.includes('이미 가입')) {
    console.log('❌ 에러 발생');
    const errorEl = await page.locator('[class*="error"], [class*="red"], [class*="alert"]').first();
    if (await errorEl.count() > 0) {
      console.log('에러:', await errorEl.textContent());
    }
  }
  
  await browser.close();
})();
