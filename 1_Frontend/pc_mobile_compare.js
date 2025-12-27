const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';

  console.log('=== PC vs 모바일 정치인 상세 페이지 비교 ===\n');

  // PC 테스트
  console.log('[ PC (1920x1080) ]');
  const pcContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const pcPage = await pcContext.newPage();

  await pcPage.goto(url + '/politicians/9dc9f3b4', { waitUntil: 'domcontentloaded' });
  await pcPage.waitForTimeout(3000);
  const pcContent = await pcPage.content();

  const pcProfile = pcContent.includes('프로필') || pcContent.includes('경력') || pcContent.includes('profile');
  const pcComment = pcContent.includes('댓글') || pcContent.includes('의견') || pcContent.includes('comment');
  const pcRating = pcContent.includes('평가') || pcContent.includes('별점') || pcContent.includes('점수');
  const pcTabs = pcContent.includes('탭') || pcContent.match(/tab/gi);

  console.log('  프로필 탭: ' + (pcProfile ? '✅' : '❌'));
  console.log('  댓글 UI: ' + (pcComment ? '✅' : '❌'));
  console.log('  평가 UI: ' + (pcRating ? '✅' : '❌'));

  // 탭 요소 찾기
  const pcTabElements = await pcPage.$$('[role="tab"], .tab, [class*="tab"]');
  console.log('  탭 요소 개수: ' + pcTabElements.length);

  // 모바일 테스트
  console.log('\n[ 모바일 iPhone 14 (390x844) ]');
  const iPhone = devices['iPhone 14'];
  const mobileContext = await browser.newContext({ ...iPhone });
  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto(url + '/politicians/9dc9f3b4', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(3000);
  const mobileContent = await mobilePage.content();

  const mobileProfile = mobileContent.includes('프로필') || mobileContent.includes('경력') || mobileContent.includes('profile');
  const mobileComment = mobileContent.includes('댓글') || mobileContent.includes('의견') || mobileContent.includes('comment');
  const mobileRating = mobileContent.includes('평가') || mobileContent.includes('별점') || mobileContent.includes('점수');

  console.log('  프로필 탭: ' + (mobileProfile ? '✅' : '❌'));
  console.log('  댓글 UI: ' + (mobileComment ? '✅' : '❌'));
  console.log('  평가 UI: ' + (mobileRating ? '✅' : '❌'));

  const mobileTabElements = await mobilePage.$$('[role="tab"], .tab, [class*="tab"]');
  console.log('  탭 요소 개수: ' + mobileTabElements.length);

  // hidden 클래스 확인
  console.log('\n[ 숨김 클래스 분석 ]');

  // PC에서 hidden:md 등 찾기
  const pcHiddenMobile = (pcContent.match(/hidden\s+(?:sm|md|lg):/g) || []).length;
  const pcMdHidden = (pcContent.match(/md:hidden/g) || []).length;
  console.log('  PC - hidden sm/md/lg 클래스: ' + pcHiddenMobile);
  console.log('  PC - md:hidden 클래스: ' + pcMdHidden);

  // 모바일에서 숨겨진 요소
  const mobileHiddenElements = await mobilePage.$$('.hidden, [class*="hidden"]');
  console.log('  모바일 - hidden 요소: ' + mobileHiddenElements.length);

  // 스크린샷 저장
  await pcPage.screenshot({ path: 'politician_detail_pc.png', fullPage: true });
  await mobilePage.screenshot({ path: 'politician_detail_mobile.png', fullPage: true });
  console.log('\n📸 스크린샷 저장됨:');
  console.log('  - politician_detail_pc.png');
  console.log('  - politician_detail_mobile.png');

  await browser.close();

  // 차이점 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 PC vs 모바일 차이점\n');
  console.log('| 기능 | PC | 모바일 |');
  console.log('|------|-----|--------|');
  console.log('| 프로필 | ' + (pcProfile ? '✅' : '❌') + ' | ' + (mobileProfile ? '✅' : '❌') + ' |');
  console.log('| 댓글 | ' + (pcComment ? '✅' : '❌') + ' | ' + (mobileComment ? '✅' : '❌') + ' |');
  console.log('| 평가 | ' + (pcRating ? '✅' : '❌') + ' | ' + (mobileRating ? '✅' : '❌') + ' |');

  if ((pcProfile && !mobileProfile) || (pcComment && !mobileComment)) {
    console.log('\n⚠️ 모바일에서 일부 UI가 숨겨져 있습니다!');
    console.log('   → 반응형 CSS 수정 필요');
  }
})();
