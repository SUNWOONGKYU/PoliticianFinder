const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-git-main-finder-world.vercel.app';

  console.log('=== 정치인 프로필 - 커뮤니티 탭 확인 ===\n');

  // 정치인 상세 페이지
  await page.goto(url + '/politicians/17270f25', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 커뮤니티 탭 클릭
  console.log('[1] 커뮤니티 탭 클릭');
  const communityTab = await page.$('button:has-text("커뮤니티")');
  if (communityTab) {
    await communityTab.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'politician_community_tab.png', fullPage: true });
    console.log('  -> politician_community_tab.png');
  } else {
    console.log('  -> 커뮤니티 탭 버튼을 찾을 수 없음');

    // 탭 버튼들 확인
    const buttons = await page.$$('button');
    console.log(`  -> 페이지에 ${buttons.length}개의 버튼 존재`);

    // 탭 영역 스크린샷
    await page.screenshot({ path: 'politician_community_tab.png', fullPage: true });
  }

  await browser.close();
  console.log('\n완료!');
})();
