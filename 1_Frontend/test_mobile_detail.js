const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-1xi1flxj7-finder-world.vercel.app';

  console.log('=== 모바일 정치인 상세 페이지 테스트 ===\n');

  await page.goto(url + '/politicians/17270f25', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'politician_detail_mobile_fixed.png', fullPage: true });
  console.log('스크린샷: politician_detail_mobile_fixed.png');

  const content = await page.content();

  console.log('\n모바일 정치인 상세 페이지 확인:');
  console.log('  정원오: ' + (content.includes('정원오') ? '✅' : '❌'));
  console.log('  AI 평가: ' + (content.includes('AI 평가') || content.includes('756') ? '✅' : '❌'));
  console.log('  Platinum: ' + (content.includes('Platinum') ? '✅' : '❌'));
  console.log('  상세 정보: ' + (content.includes('상세 정보') ? '✅' : '❌'));
  console.log('  커뮤니티: ' + (content.includes('커뮤니티') ? '✅' : '❌'));
  console.log('  오류 페이지: ' + (content.includes('문제가 발생') ? '❌ 있음' : '✅ 없음'));

  await browser.close();
})();
