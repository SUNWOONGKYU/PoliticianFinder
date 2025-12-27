const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';

  console.log('=== 정치인 이름 클릭 테스트 ===\n');

  // 1. 정치인 목록 페이지
  await page.goto(url + '/politicians', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // 2. 첫 번째 정치인 이름 클릭 (주황색 텍스트)
  console.log('1. 정원오 클릭 시도...');
  const nameLink = await page.$('text=정원오');
  if (nameLink) {
    await nameLink.click();
    await page.waitForTimeout(3000);
    console.log('   현재 URL: ' + page.url());

    await page.screenshot({ path: 'politician_detail_after_click.png', fullPage: true });
    console.log('   스크린샷: politician_detail_after_click.png');

    const content = await page.content();
    console.log('\n2. 상세 페이지 분석:');
    console.log('   오류 메시지: ' + (content.includes('오류') ? '❌ 있음' : '✅ 없음'));
    console.log('   정원오: ' + (content.includes('정원오') ? '✅' : '❌'));
    console.log('   프로필: ' + (content.includes('프로필') ? '✅' : '❌'));
    console.log('   평가: ' + (content.includes('평가') ? '✅' : '❌'));
    console.log('   댓글: ' + (content.includes('댓글') ? '✅' : '❌'));
    console.log('   탭: ' + (content.includes('기본정보') || content.includes('활동') || content.includes('평가내역') ? '✅' : '❌'));
  } else {
    console.log('   정원오 링크를 찾을 수 없음');
  }

  await browser.close();
})();
