const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  
  console.log('=== PoliticianFinder 로그인 테스트 ===\n');
  console.log('URL:', url + '/auth/login');
  console.log('Email: wksun999@naver.com');
  console.log('Password: na5215900\n');

  try {
    // 로그인 페이지 이동
    console.log('1. 로그인 페이지 접속...');
    await page.goto(url + '/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('   페이지 제목:', title);
    
    // 이메일 입력
    console.log('2. 이메일 입력...');
    const emailInput = await page.locator('input[type="email"], input[name="email"]');
    if (await emailInput.count() > 0) {
      await emailInput.fill('wksun999@naver.com');
      console.log('   ✅ 이메일 입력 완료');
    } else {
      console.log('   ❌ 이메일 입력 필드를 찾을 수 없음');
    }
    
    // 비밀번호 입력
    console.log('3. 비밀번호 입력...');
    const passwordInput = await page.locator('input[type="password"], input[name="password"]');
    if (await passwordInput.count() > 0) {
      await passwordInput.fill('na5215900');
      console.log('   ✅ 비밀번호 입력 완료');
    } else {
      console.log('   ❌ 비밀번호 입력 필드를 찾을 수 없음');
    }
    
    // 스크린샷 (로그인 전)
    await page.screenshot({ path: './screenshot_login_before.png' });
    console.log('4. 로그인 버튼 클릭...');
    
    // 로그인 버튼 클릭
    const loginButton = await page.locator('button[type="submit"]');
    if (await loginButton.count() > 0) {
      await loginButton.click();
      console.log('   ✅ 로그인 버튼 클릭');
    }
    
    // 결과 대기
    await page.waitForTimeout(5000);
    
    // 현재 URL 확인
    const currentUrl = page.url();
    console.log('\n5. 결과:');
    console.log('   현재 URL:', currentUrl);
    
    // 에러 메시지 확인
    const errorMsg = await page.locator('[class*="error"], [class*="alert"], [role="alert"]').first();
    if (await errorMsg.count() > 0) {
      const errorText = await errorMsg.textContent();
      console.log('   ❌ 에러:', errorText);
    }
    
    // 로그인 성공 확인 (URL 변경 또는 특정 요소)
    if (currentUrl.includes('/auth/login')) {
      console.log('   ⚠️ 로그인 페이지에 머물러 있음 - 로그인 실패 가능성');
    } else {
      console.log('   ✅ 페이지 이동됨 - 로그인 성공 가능성');
    }
    
    // 스크린샷 (로그인 후)
    await page.screenshot({ path: './screenshot_login_after.png' });
    console.log('\n📸 스크린샷 저장: screenshot_login_before.png, screenshot_login_after.png');
    
  } catch (error) {
    console.log('❌ 오류 발생:', error.message);
  }

  await browser.close();
})();
