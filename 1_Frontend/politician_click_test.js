const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';

  console.log('=== 정치인 목록 → 상세 페이지 테스트 ===\n');

  // 1. 정치인 목록 페이지
  console.log('1. 정치인 목록 페이지 접속...');
  await page.goto(url + '/politicians', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'politician_list.png', fullPage: true });
  console.log('   스크린샷: politician_list.png');

  // 2. 정치인 카드/링크 찾기
  console.log('\n2. 정치인 카드 분석...');
  const content = await page.content();

  // 정치인 이름 확인
  const names = ['안태준', '김동연', '오세훈', '이준석', '염태영'];
  names.forEach(name => {
    const found = content.includes(name);
    console.log('   ' + name + ': ' + (found ? '✅ 있음' : '❌ 없음'));
  });

  // 링크 찾기
  const politicianLinks = await page.$$('a[href*="/politicians/"]');
  console.log('\n   정치인 링크 개수: ' + politicianLinks.length);

  if (politicianLinks.length > 0) {
    // 첫 번째 정치인 클릭
    console.log('\n3. 첫 번째 정치인 클릭...');
    const firstLink = politicianLinks[0];
    const href = await firstLink.getAttribute('href');
    console.log('   링크: ' + href);

    await firstLink.click();
    await page.waitForTimeout(3000);

    console.log('   현재 URL: ' + page.url());

    await page.screenshot({ path: 'politician_detail_click.png', fullPage: true });
    console.log('   스크린샷: politician_detail_click.png');

    // 상세 페이지 내용 확인
    const detailContent = await page.content();
    console.log('\n4. 상세 페이지 분석...');
    console.log('   오류 메시지: ' + (detailContent.includes('오류') || detailContent.includes('문제가 발생') ? '❌ 있음' : '✅ 없음'));
    console.log('   프로필: ' + (detailContent.includes('프로필') ? '✅' : '❌'));
    console.log('   평가: ' + (detailContent.includes('평가') ? '✅' : '❌'));
    console.log('   댓글: ' + (detailContent.includes('댓글') ? '✅' : '❌'));
    console.log('   정치인 이름: ' + (names.some(n => detailContent.includes(n)) ? '✅' : '❌'));
  }

  await browser.close();
})();
