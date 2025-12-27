const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-git-main-finder-world.vercel.app';

  console.log('=== 정치인 커뮤니티 탭 업데이트 확인 ===\n');

  // 정치인 상세 페이지
  await page.goto(url + '/politicians/17270f25', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 커뮤니티 섹션으로 스크롤
  await page.evaluate(() => {
    const section = document.getElementById('community');
    if (section) section.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(1000);

  // 스크린샷 1: 커뮤니티 섹션 상단
  await page.screenshot({ path: 'community_tab_1.png' });
  console.log('-> community_tab_1.png (상단: 통계 + 의견 입력)');

  // 스크롤 다운
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);

  // 스크린샷 2: 최근 의견
  await page.screenshot({ path: 'community_tab_2.png' });
  console.log('-> community_tab_2.png (중단: 최근 의견)');

  // 스크롤 다운
  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(500);

  // 스크린샷 3: 관련 게시글
  await page.screenshot({ path: 'community_tab_3.png' });
  console.log('-> community_tab_3.png (하단: 관련 게시글)');

  await browser.close();
  console.log('\n완료!');
})();
