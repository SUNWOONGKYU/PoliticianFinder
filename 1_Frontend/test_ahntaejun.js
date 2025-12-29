const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('안태준 상세페이지 테스트...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/9dc9f3b4', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const content = await page.content();
  
  console.log('');
  console.log('이름 표시:', content.includes('안태준') ? '✅' : '❌');
  console.log('정당 표시:', content.includes('정의당') ? '✅' : '❌');
  console.log('지역 표시:', (content.includes('인천') || content.includes('미추홀구')) ? '✅' : '❌');
  console.log('에러 없음:', content.includes('정치인을 찾을 수 없습니다') ? '❌ 에러 발생' : '✅');
  
  await page.screenshot({ path: 'test_ahntaejun.png', fullPage: false });
  console.log('');
  console.log('스크린샷: test_ahntaejun.png');
  
  await browser.close();
})();
