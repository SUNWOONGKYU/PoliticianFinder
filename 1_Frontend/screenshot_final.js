const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  // 최신 배포 URL들 시도
  const urls = [
    'https://politician-finder-git-main-finder-world.vercel.app',
    'https://politician-finder-finder-world.vercel.app',
    'https://politicianfinder.vercel.app'
  ];

  let workingUrl = null;

  console.log('=== 배포 URL 확인 ===\n');

  for (const url of urls) {
    try {
      console.log(`시도: ${url}`);
      const response = await page.goto(url + '/community', { waitUntil: 'networkidle', timeout: 15000 });
      if (response && response.status() === 200) {
        const content = await page.content();
        if (!content.includes('404') && !content.includes('NOT_FOUND')) {
          workingUrl = url;
          console.log(`  -> 성공!\n`);
          break;
        }
      }
    } catch (e) {
      console.log(`  -> 실패: ${e.message}`);
    }
  }

  if (!workingUrl) {
    console.log('작동하는 URL을 찾을 수 없음');
    await browser.close();
    return;
  }

  console.log(`\n=== 모바일 스크린샷 (${workingUrl}) ===\n`);

  // 1. 커뮤니티 목록
  console.log('[1] 커뮤니티 목록');
  await page.goto(workingUrl + '/community', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'final_community_mobile.png', fullPage: true });
  console.log('  -> final_community_mobile.png');

  // 2. 게시글 상세 (ID 1 직접 접근)
  console.log('[2] 게시글 상세');
  await page.goto(workingUrl + '/community/posts/1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'final_post_detail_mobile.png', fullPage: true });
  console.log('  -> final_post_detail_mobile.png');

  await browser.close();
  console.log('\n완료!');
})();
