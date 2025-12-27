const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  
  console.log('=== PoliticianFinder 회원가입 테스트 ===');
  console.log('Email: wksun999@naver.com');
  console.log('Password: na5215900');
  console.log('Nickname: 써니1\n');

  // 회원가입 페이지 이동
  console.log('1. 회원가입 페이지 접속...');
  await page.goto(url + '/auth/signup', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // 스크린샷 (가입 전)
  await page.screenshot({ path: './screenshot_signup_before.png' });
  
  // 이메일 입력
  console.log('2. 이메일 입력...');
  await page.fill('input[name="email"], input[type="email"]', 'wksun999@naver.com');
  
  // 비밀번호 입력
  console.log('3. 비밀번호 입력...');
  const passwordInputs = await page.locator('input[type="password"]').all();
  if (passwordInputs.length >= 2) {
    await passwordInputs[0].fill('na5215900');
    await passwordInputs[1].fill('na5215900');
    console.log('   비밀번호 및 확인 입력 완료');
  } else if (passwordInputs.length === 1) {
    await passwordInputs[0].fill('na5215900');
  }
  
  // 닉네임 입력
  console.log('4. 닉네임 입력...');
  const nicknameInput = await page.locator('input[name="nickname"]');
  if (await nicknameInput.count() > 0) {
    await nicknameInput.fill('써니1');
    console.log('   닉네임 입력 완료');
  }
  
  // 약관 동의 체크박스
  console.log('5. 약관 동의...');
  const checkboxes = await page.locator('input[type="checkbox"]').all();
  for (const checkbox of checkboxes) {
    await checkbox.check().catch(() => {});
  }
  console.log('   체크박스 ' + checkboxes.length + '개 체크');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: './screenshot_signup_filled.png' });
  
  // 회원가입 버튼 클릭
  console.log('6. 회원가입 버튼 클릭...');
  const submitBtn = await page.locator('button[type="submit"]');
  await submitBtn.click();
  
  // 결과 대기
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  console.log('\n결과:');
  console.log('   현재 URL:', currentUrl);
  
  // 에러 메시지 확인
  const pageContent = await page.content();
  if (pageContent.includes('error') || pageContent.includes('오류') || pageContent.includes('실패')) {
    const errorEl = await page.locator('[class*="error"], [class*="alert"], [class*="red"]').first();
    if (await errorEl.count() > 0) {
      const errorText = await errorEl.textContent();
      console.log('   에러:', errorText);
    }
  }
  
  // 성공 메시지 확인
  if (currentUrl.includes('/login') || pageContent.includes('인증') || pageContent.includes('이메일')) {
    console.log('   ✅ 회원가입 성공 - 이메일 인증 필요');
  } else if (currentUrl.includes('/signup')) {
    console.log('   ⚠️ 회원가입 페이지에 머물러 있음');
  } else {
    console.log('   페이지 이동됨');
  }
  
  await page.screenshot({ path: './screenshot_signup_after.png' });
  console.log('\n📸 스크린샷 저장됨');
  
  await browser.close();
})();
