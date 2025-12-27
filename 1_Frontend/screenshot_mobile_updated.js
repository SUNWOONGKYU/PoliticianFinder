const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder.vercel.app';

  console.log('=== 모바일 UI 업데이트 확인 (iPhone 14) ===\n');

  // 1. 커뮤니티 목록
  console.log('[1] 커뮤니티 목록');
  await page.goto(url + '/community', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'mobile_community_updated.png', fullPage: true });
  console.log('  -> mobile_community_updated.png');

  // 2. 게시글 상세
  console.log('[2] 게시글 상세');
  const postLink = await page.$('a[href*="/community/posts/"]');
  if (postLink) {
    await postLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'mobile_post_detail_updated.png', fullPage: true });
    console.log('  -> mobile_post_detail_updated.png');
  } else {
    console.log('  -> 게시글 없음');
  }

  await browser.close();
  console.log('\n완료!');
})();
