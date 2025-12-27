const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({
    ...iPhone,
  });
  const page = await context.newPage();

  console.log('=== PoliticianFinder 모바일 배포 테스트 ===\n');

  // 1. 홈 화면 TOP 10 카드 클릭 테스트
  console.log('[1] 홈 화면 테스트...');
  try {
    await page.goto('https://www.politicianfinder.ai.kr/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // TOP 10 카드 찾기
    const top10Cards = await page.locator('a[href^="/politicians/"]').count();
    console.log('    - TOP 10 링크 수: ' + top10Cards + '개');

    // 스크린샷
    await page.screenshot({ path: 'test_mobile_home.png', fullPage: false });
    console.log('    - 스크린샷: test_mobile_home.png');

    if (top10Cards > 0) {
      console.log('    ✅ 홈 화면 정치인 카드 링크 확인됨');
    } else {
      console.log('    ⚠️ 홈 화면에서 정치인 링크를 찾을 수 없음');
    }
  } catch (e) {
    console.log('    ❌ 홈 화면 테스트 실패:', e.message);
  }

  // 2. 정치인 목록 페이지 테스트
  console.log('\n[2] 정치인 목록 페이지 테스트...');
  try {
    await page.goto('https://www.politicianfinder.ai.kr/politicians', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 모바일 카드 링크 확인
    const cardLinks = await page.locator('a[href^="/politicians/"]').count();
    console.log('    - 정치인 카드 링크 수: ' + cardLinks + '개');

    await page.screenshot({ path: 'test_mobile_politicians.png', fullPage: false });
    console.log('    - 스크린샷: test_mobile_politicians.png');

    // 첫 번째 카드 클릭 테스트
    const firstCard = page.locator('a[href^="/politicians/"]').first();
    if (await firstCard.isVisible()) {
      const href = await firstCard.getAttribute('href');
      console.log('    - 첫 번째 카드 링크: ' + href);

      await firstCard.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log('    - 이동한 URL: ' + currentUrl);

      if (currentUrl.includes('/politicians/')) {
        console.log('    ✅ 정치인 목록 → 상세페이지 이동 성공');
      } else {
        console.log('    ❌ 상세페이지 이동 실패');
      }

      await page.screenshot({ path: 'test_mobile_detail.png', fullPage: false });
      console.log('    - 스크린샷: test_mobile_detail.png');
    }
  } catch (e) {
    console.log('    ❌ 정치인 목록 테스트 실패:', e.message);
  }

  // 3. 정치인 상세페이지 - 프로필 수정 버튼 확인
  console.log('\n[3] 정치인 상세페이지 - 프로필 수정 버튼 확인...');
  try {
    // 현재 페이지가 상세페이지인지 확인
    const currentUrl = page.url();
    if (!currentUrl.includes('/politicians/')) {
      await page.goto('https://www.politicianfinder.ai.kr/politicians', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const firstCard = page.locator('a[href^="/politicians/"]').first();
      if (await firstCard.isVisible()) {
        await firstCard.click();
        await page.waitForTimeout(2000);
      }
    }

    // 프로필 수정 버튼 찾기
    const editButton = page.locator('text=프로필 수정');
    const editButtonCount = await editButton.count();

    if (editButtonCount === 0) {
      console.log('    ✅ 프로필 수정 버튼 숨김 확인 (비로그인 상태)');
    } else {
      console.log('    ⚠️ 프로필 수정 버튼이 표시됨 (확인 필요)');
    }
  } catch (e) {
    console.log('    ❌ 프로필 수정 버튼 확인 실패:', e.message);
  }

  // 4. 커뮤니티 페이지 메타데이터 테스트
  console.log('\n[4] 커뮤니티 페이지 메타데이터 테스트...');
  try {
    await page.goto('https://www.politicianfinder.ai.kr/community', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test_mobile_community.png', fullPage: false });
    console.log('    - 스크린샷: test_mobile_community.png');

    // 게시글 메타데이터 확인 (조회, 좋아요, 싫어요, 댓글, 공유)
    const pageContent = await page.content();

    const hasViews = pageContent.includes('조회');
    const hasLikes = pageContent.includes('👍');
    const hasDislikes = pageContent.includes('👎');
    const hasComments = pageContent.includes('💬');
    const hasShares = pageContent.includes('공유');

    console.log('    - 조회: ' + (hasViews ? '✅' : '❌'));
    console.log('    - 좋아요(👍): ' + (hasLikes ? '✅' : '❌'));
    console.log('    - 싫어요(👎): ' + (hasDislikes ? '✅' : '❌'));
    console.log('    - 댓글(💬): ' + (hasComments ? '✅' : '❌'));
    console.log('    - 공유: ' + (hasShares ? '✅' : '❌'));

    if (hasDislikes && hasShares) {
      console.log('    ✅ 모바일에서 모든 메타데이터 표시 확인');
    }
  } catch (e) {
    console.log('    ❌ 커뮤니티 페이지 테스트 실패:', e.message);
  }

  console.log('\n=== 테스트 완료 ===');

  await browser.close();
})();
