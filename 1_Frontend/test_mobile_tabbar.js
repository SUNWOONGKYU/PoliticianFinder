const { chromium } = require('playwright');

(async () => {
  console.log('🔍 모바일 탭바 테스트 (politicianfinder.ai.kr)\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  try {
    console.log('1️⃣ www.politicianfinder.ai.kr 접속...');
    await page.goto('https://www.politicianfinder.ai.kr', { timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log('   ✅ 페이지 로드 완료');

    console.log('\n2️⃣ 탭바 확인...');
    const bottomNav = await page.$('nav.fixed');
    if (bottomNav) {
      console.log('   ✅ 탭바 발견!');
      const links = await bottomNav.$$('a');
      for (const link of links) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log('   - ' + (text || '').trim() + ': ' + href);
      }
    }

    console.log('\n3️⃣ 탭 클릭 테스트...');

    // 정치인 탭 클릭
    const politiciansTab = await page.$('nav.fixed a[href="/politicians"]');
    if (politiciansTab) {
      await politiciansTab.click();
      await page.waitForTimeout(2000);
      console.log('   정치인 탭 → ' + page.url());
    }

    // 커뮤니티 탭 클릭
    const communityTab = await page.$('nav.fixed a[href="/community"]');
    if (communityTab) {
      await communityTab.click();
      await page.waitForTimeout(2000);
      console.log('   커뮤니티 탭 → ' + page.url());
    }

    // 마이페이지 탭 클릭
    const mypageTab = await page.$('nav.fixed a[href="/mypage"]');
    if (mypageTab) {
      await mypageTab.click();
      await page.waitForTimeout(2000);
      console.log('   마이페이지 탭 → ' + page.url());
    }

    // 홈 탭 클릭
    const homeTab = await page.$('nav.fixed a[href="/"]');
    if (homeTab) {
      await homeTab.click();
      await page.waitForTimeout(2000);
      console.log('   홈 탭 → ' + page.url());
    }

    console.log('\n✅ 모든 탭 동작 테스트 완료!');
    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await browser.close();
  }
})();
