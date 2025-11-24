const { chromium } = require('playwright');

(async () => {
  console.log('🔍 관심 정치인 등록 실패 원인 조사 시작...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log('📱 Browser Console:', msg.type(), msg.text());
  });

  // 네트워크 요청 캡처
  page.on('request', request => {
    if (request.url().includes('/api/favorites')) {
      console.log('\n📤 Request:', request.method(), request.url());
      if (request.postData()) {
        console.log('📦 Body:', request.postData());
      }
    }
  });

  // 네트워크 응답 캡처
  page.on('response', async response => {
    if (response.url().includes('/api/favorites')) {
      console.log('\n📥 Response:', response.status(), response.url());
      try {
        const body = await response.json();
        console.log('📦 Response Body:', JSON.stringify(body, null, 2));
      } catch (e) {
        console.log('📦 Response Body: (not JSON)');
      }
    }
  });

  console.log('📄 프로덕션 페이지 접속 중...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 60000
  });

  console.log('⏳ 페이지 렌더링 대기...');
  await page.waitForTimeout(3000);

  // 관심 정치인 버튼 찾기
  const favoriteButton = await page.$('button[title*="관심 정치인"]');

  if (!favoriteButton) {
    console.log('❌ 관심 정치인 버튼을 찾을 수 없습니다.');
    await browser.close();
    process.exit(1);
  }

  console.log('\n✅ 관심 정치인 버튼 발견!');
  console.log('🖱️  버튼 클릭 시도...\n');

  // 버튼 클릭
  await favoriteButton.click();

  // 응답 대기 (최대 10초)
  console.log('⏳ API 응답 대기 중...\n');
  await page.waitForTimeout(10000);

  console.log('\n\n=== 조사 완료 ===');
  console.log('위 로그에서 에러 원인을 확인하세요.');

  await browser.close();
})();
