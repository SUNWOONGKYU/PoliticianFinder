const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const url = 'https://politician-finder-1xi1flxj7-finder-world.vercel.app';

  console.log('=== 커뮤니티 PC vs 모바일 비교 ===\n');

  // PC 버전
  console.log('[ PC (1920x1080) ]');
  const pcContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pcPage = await pcContext.newPage();

  await pcPage.goto(url + '/community', { waitUntil: 'networkidle' });
  await pcPage.waitForTimeout(3000);
  await pcPage.screenshot({ path: 'community_pc.png', fullPage: true });
  console.log('  스크린샷: community_pc.png');

  // 게시글 상세 (첫 번째 게시글 클릭)
  const pcPostLink = await pcPage.$('a[href*="/community/posts/"]');
  if (pcPostLink) {
    await pcPostLink.click();
    await pcPage.waitForTimeout(3000);
    await pcPage.screenshot({ path: 'post_detail_pc.png', fullPage: true });
    console.log('  게시글 상세: post_detail_pc.png');
  }

  // 모바일 버전
  console.log('\n[ 모바일 iPhone 14 (390x844) ]');
  const iPhone = devices['iPhone 14'];
  const mobileContext = await browser.newContext({ ...iPhone });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto(url + '/community', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(3000);
  await mobilePage.screenshot({ path: 'community_mobile.png', fullPage: true });
  console.log('  스크린샷: community_mobile.png');

  // 게시글 상세
  const mobilePostLink = await mobilePage.$('a[href*="/community/posts/"]');
  if (mobilePostLink) {
    await mobilePostLink.click();
    await mobilePage.waitForTimeout(3000);
    await mobilePage.screenshot({ path: 'post_detail_mobile.png', fullPage: true });
    console.log('  게시글 상세: post_detail_mobile.png');
  }

  await browser.close();
  console.log('\n완료! 스크린샷 4개 생성됨');
})();
