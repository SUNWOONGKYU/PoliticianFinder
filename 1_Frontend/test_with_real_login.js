const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  const page = await browser.newPage();

  const allErrors = [];

  // 모든 네트워크 응답 캡처
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    if (status >= 400) {
      try {
        const body = await response.text();
        const error = {
          status,
          url,
          method: response.request().method(),
          body
        };
        allErrors.push(error);

        console.log(`\n❌ ${status} ERROR: ${url}`);
        console.log(`   Method: ${response.request().method()}`);
        console.log(`   Response: ${body.substring(0, 200)}`);
      } catch(e) {}
    }
  });

  console.log('\n=== STEP 1: 로그인 페이지 이동 ===\n');
  await page.goto('https://www.politicianfinder.ai.kr/auth/login', {
    waitUntil: 'load',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  console.log('\n⏳ 사용자님께서 수동으로 로그인해주세요...');
  console.log('   로그인 완료 후 30초 대기합니다.\n');

  // 30초 대기 (사용자가 로그인할 시간)
  await page.waitForTimeout(30000);

  console.log('\n=== STEP 2: 정치인 상세 페이지 이동 ===\n');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 30000
  });

  await page.waitForTimeout(5000);

  // 로그인 상태 확인
  const logoutBtn = await page.$('text=로그아웃');
  if (logoutBtn) {
    console.log('✅ 로그인 상태 확인됨\n');
  } else {
    console.log('⚠️  로그인 상태가 아닐 수 있습니다\n');
  }

  console.log('=== STEP 3: 관심 정치인 등록 테스트 ===\n');

  const favoriteBtn = await page.$('button[title*="관심 정치인"]');
  if (favoriteBtn) {
    console.log('✅ 관심 정치인 버튼 발견');
    console.log('🖱️  클릭 중...\n');

    await favoriteBtn.click();
    await page.waitForTimeout(3000);

    // alert 확인
    page.on('dialog', async dialog => {
      console.log(`📢 Alert: ${dialog.message()}`);
      await dialog.accept();
    });
  } else {
    console.log('❌ 관심 정치인 버튼 없음\n');
  }

  console.log('\n=== STEP 4: 별점 평가 테스트 ===\n');

  const ratingBtn = await page.$('button[title="별점 평가"]');
  if (ratingBtn) {
    console.log('✅ 별점 평가 버튼 발견');
    console.log('🖱️  클릭 중...\n');

    await ratingBtn.click();
    await page.waitForTimeout(2000);

    // 5점 클릭
    console.log('⭐ 5점 클릭 시도...\n');
    const allButtons = await page.$$('button');
    let clicked = false;

    for (const btn of allButtons) {
      const ariaLabel = await btn.getAttribute('aria-label');
      if (ariaLabel && ariaLabel.includes('5')) {
        await btn.click();
        clicked = true;
        console.log('✅ 5점 클릭 완료\n');
        break;
      }
    }

    if (!clicked) {
      // 다른 방법 시도
      const star5 = await page.$('[data-rating="5"]');
      if (star5) {
        await star5.click();
        console.log('✅ 5점 클릭 완료 (방법2)\n');
      }
    }

    await page.waitForTimeout(1000);

    // 제출 버튼 클릭
    console.log('📝 제출 버튼 클릭 시도...\n');
    const submitButtons = await page.$$('button');
    for (const btn of submitButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('평가하기') || text.includes('제출') || text.includes('저장'))) {
        console.log(`   찾은 버튼: "${text.trim()}"`);
        await btn.click();
        console.log('✅ 제출 버튼 클릭 완료\n');
        break;
      }
    }

    await page.waitForTimeout(3000);
  } else {
    console.log('❌ 별점 평가 버튼 없음\n');
  }

  console.log('\n=== 에러 요약 ===\n');

  if (allErrors.length === 0) {
    console.log('✅ 에러 없음!\n');
  } else {
    console.log(`총 ${allErrors.length}개 에러 발견:\n`);

    allErrors.forEach((err, i) => {
      console.log(`\n에러 ${i + 1}:`);
      console.log(`  Status: ${err.status}`);
      console.log(`  Method: ${err.method}`);
      console.log(`  URL: ${err.url}`);
      if (err.body.length < 500) {
        console.log(`  Body: ${err.body}`);
      } else {
        console.log(`  Body: ${err.body.substring(0, 500)}...`);
      }
    });
  }

  console.log('\n\n브라우저를 10초 후 종료합니다...\n');
  await page.waitForTimeout(10000);
  await browser.close();
})();
