const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-git-main-finder-world.vercel.app';

  console.log('=== 실제 게시글 클릭해서 상세 페이지 캡처 ===\n');

  // 커뮤니티 목록으로 이동
  await page.goto(url + '/community', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 첫 번째 게시글 클릭
  const postLink = await page.$('a[href*="/community/posts/"]');
  if (postLink) {
    await postLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'final_post_detail_real.png', fullPage: true });
    console.log('-> final_post_detail_real.png 저장 완료');
  } else {
    console.log('게시글 링크를 찾을 수 없음');
  }

  await browser.close();
})();
