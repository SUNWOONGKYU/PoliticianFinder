const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  const results = [];
  
  console.log('=== PoliticianFinder 회원 기능 테스트 ===\n');

  // 1. 로그인
  console.log('1. 로그인...');
  await page.goto(url + '/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"]', 'wksun999@naver.com');
  await page.fill('input[type="password"]', 'na5215900');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);
  
  if (!page.url().includes('/auth/login')) {
    console.log('   ✅ 로그인 성공');
    results.push({ feature: '로그인', status: '✅' });
  } else {
    console.log('   ❌ 로그인 실패');
    results.push({ feature: '로그인', status: '❌' });
    await browser.close();
    return;
  }

  // 2. 홈페이지 확인
  console.log('2. 홈페이지...');
  await page.waitForTimeout(2000);
  const homeContent = await page.textContent('body');
  if (homeContent.includes('정치인') || homeContent.includes('TOP')) {
    console.log('   ✅ 홈페이지 로드 성공');
    results.push({ feature: '홈페이지', status: '✅' });
  } else {
    results.push({ feature: '홈페이지', status: '⚠️' });
  }
  await page.screenshot({ path: './test_01_home.png' });

  // 3. 정치인 목록
  console.log('3. 정치인 목록...');
  await page.goto(url + '/politicians', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const politicianList = await page.locator('[class*="card"], [class*="politician"], [class*="list"] a').count();
  if (politicianList > 0) {
    console.log('   ✅ 정치인 목록 표시 (' + politicianList + '개)');
    results.push({ feature: '정치인 목록', status: '✅' });
  } else {
    console.log('   ⚠️ 정치인 목록 없음');
    results.push({ feature: '정치인 목록', status: '⚠️' });
  }
  await page.screenshot({ path: './test_02_politicians.png' });

  // 4. 정치인 상세
  console.log('4. 정치인 상세...');
  const politicianLink = await page.locator('a[href*="/politicians/"]').first();
  if (await politicianLink.count() > 0) {
    await politicianLink.click();
    await page.waitForTimeout(3000);
    const detailContent = await page.textContent('body');
    if (detailContent.includes('평가') || detailContent.includes('정당') || detailContent.includes('소속')) {
      console.log('   ✅ 정치인 상세 페이지');
      results.push({ feature: '정치인 상세', status: '✅' });
    } else {
      results.push({ feature: '정치인 상세', status: '⚠️' });
    }
    await page.screenshot({ path: './test_03_politician_detail.png' });
  } else {
    results.push({ feature: '정치인 상세', status: '❌' });
  }

  // 5. 커뮤니티
  console.log('5. 커뮤니티...');
  await page.goto(url + '/community', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const communityContent = await page.textContent('body');
  if (communityContent.includes('게시') || communityContent.includes('글') || communityContent.includes('작성')) {
    console.log('   ✅ 커뮤니티 페이지');
    results.push({ feature: '커뮤니티', status: '✅' });
  } else {
    results.push({ feature: '커뮤니티', status: '⚠️' });
  }
  await page.screenshot({ path: './test_04_community.png' });

  // 6. 마이페이지
  console.log('6. 마이페이지...');
  await page.goto(url + '/mypage', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const mypageContent = await page.textContent('body');
  if (mypageContent.includes('프로필') || mypageContent.includes('써니') || mypageContent.includes('wksun999')) {
    console.log('   ✅ 마이페이지');
    results.push({ feature: '마이페이지', status: '✅' });
  } else {
    results.push({ feature: '마이페이지', status: '⚠️' });
  }
  await page.screenshot({ path: './test_05_mypage.png' });

  // 7. 알림
  console.log('7. 알림...');
  await page.goto(url + '/notifications', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const notifContent = await page.textContent('body');
  if (notifContent.includes('알림') || page.url().includes('notification')) {
    console.log('   ✅ 알림 페이지');
    results.push({ feature: '알림', status: '✅' });
  } else {
    results.push({ feature: '알림', status: '⚠️' });
  }
  await page.screenshot({ path: './test_06_notifications.png' });

  // 결과 출력
  console.log('\n=== 테스트 결과 요약 ===');
  results.forEach(r => console.log(r.status + ' ' + r.feature));
  
  const passed = results.filter(r => r.status === '✅').length;
  console.log('\n통과: ' + passed + '/' + results.length);

  await browser.close();
})();
