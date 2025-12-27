const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder.vercel.app';

  console.log('=== 게시글 상세 모바일 스크린샷 ===\n');

  // 게시글 상세 페이지 직접 접근 (ID 1, 2, 3 시도)
  for (const postId of [1, 2, 3, 4, 5]) {
    console.log(`[시도] 게시글 #${postId}`);
    try {
      await page.goto(`${url}/community/posts/${postId}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(3000);

      const content = await page.content();
      if (!content.includes('찾을 수 없습니다') && !content.includes('존재하지 않')) {
        await page.screenshot({ path: 'mobile_post_detail_updated.png', fullPage: true });
        console.log(`  -> 성공! mobile_post_detail_updated.png`);
        break;
      } else {
        console.log(`  -> 게시글 없음, 다음 시도`);
      }
    } catch (e) {
      console.log(`  -> 오류: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n완료!');
})();
