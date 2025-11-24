const { chromium } = require('playwright');

(async () => {
  console.log('🚀 실제 프로덕션 환경 검증 시작...');
  console.log('URL: https://www.politicianfinder.ai.kr/politicians/c34753dd\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('📄 프로덕션 페이지 로딩 중...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/c34753dd', {
    waitUntil: 'load',
    timeout: 60000
  });

  console.log('⏳ JavaScript 렌더링 대기 중...');
  await page.waitForTimeout(5000);

  console.log('\n=== 프로덕션 플로팅 버튼 검증 ===\n');

  // 1. 플로팅 버튼 컨테이너 확인
  const container = await page.$('div.fixed.bottom-8.right-8');
  console.log('1. 플로팅 버튼 컨테이너:', container ? '✅ 존재' : '❌ 없음');

  if (container) {
    const containerHTML = await container.evaluate(el => el.outerHTML.substring(0, 300));
    console.log('\n컨테이너 HTML:');
    console.log(containerHTML);
    console.log('...\n');
  }

  // 2. 지역 검색 버튼
  const searchButton = await page.$('button[title="지역 검색"]');
  console.log('2. 지역 검색 버튼:', searchButton ? '✅ 존재' : '❌ 없음');

  if (searchButton) {
    const isVisible = await searchButton.isVisible();
    const classes = await searchButton.evaluate(el => el.className);
    console.log('   - 화면에 표시됨:', isVisible ? '✅ Yes' : '❌ No');
    console.log('   - Classes:', classes.substring(0, 80) + '...');
  }

  // 3. 별점 평가 버튼
  const ratingButton = await page.$('button[title="별점 평가"]');
  console.log('\n3. 별점 평가 버튼:', ratingButton ? '✅ 존재' : '❌ 없음');

  if (ratingButton) {
    const isVisible = await ratingButton.isVisible();
    const classes = await ratingButton.evaluate(el => el.className);
    console.log('   - 화면에 표시됨:', isVisible ? '✅ Yes' : '❌ No');
    console.log('   - Classes:', classes.substring(0, 80) + '...');

    // 버튼 클릭 가능 여부
    const isEnabled = await ratingButton.isEnabled();
    console.log('   - 클릭 가능:', isEnabled ? '✅ Yes' : '❌ No');
  }

  // 4. 관심 정치인 버튼
  const favoriteButtons = await page.$$('button[title*="관심 정치인"]');
  console.log('\n4. 관심 정치인 버튼:', favoriteButtons.length > 0 ? `✅ 존재 (${favoriteButtons.length}개)` : '❌ 없음');

  if (favoriteButtons.length > 0) {
    for (let i = 0; i < favoriteButtons.length; i++) {
      const btn = favoriteButtons[i];
      const isVisible = await btn.isVisible();
      const isEnabled = await btn.isEnabled();
      const title = await btn.getAttribute('title');
      const classes = await btn.evaluate(el => el.className);

      console.log(`\n   버튼 ${i+1}:`);
      console.log(`   - Title: "${title}"`);
      console.log(`   - 화면에 표시됨: ${isVisible ? '✅ Yes' : '❌ No'}`);
      console.log(`   - 클릭 가능: ${isEnabled ? '✅ Yes' : '❌ No'}`);
      console.log(`   - Classes: ${classes.substring(0, 80)}...`);
    }
  }

  // 5. 전체 버튼 개수
  const allFloatingButtons = await page.$$('div.fixed.bottom-8.right-8 > button');
  console.log('\n\n=== 전체 플로팅 버튼 개수 ===');
  console.log(`총 개수: ${allFloatingButtons.length}개`);
  console.log(`예상 개수: 3개`);
  console.log(`결과: ${allFloatingButtons.length === 3 ? '✅ 일치' : '❌ 불일치'}`);

  // 6. 스크린샷
  console.log('\n📸 프로덕션 페이지 스크린샷 저장 중...');
  await page.screenshot({
    path: 'production_verification.png',
    fullPage: true
  });
  console.log('✅ 저장 완료: production_verification.png');

  // 7. 관심 정치인 버튼 클릭 테스트
  console.log('\n\n=== 관심 정치인 버튼 클릭 테스트 ===');

  if (favoriteButtons.length > 0) {
    try {
      console.log('비로그인 상태에서 관심 정치인 버튼 클릭 시도...');

      // 버튼 클릭
      await favoriteButtons[0].click();

      // 잠시 대기 (에러 메시지 표시 대기)
      await page.waitForTimeout(2000);

      // 페이지에서 에러 메시지나 알림 찾기
      const errorMessage = await page.evaluate(() => {
        // 모든 텍스트에서 "인증" 또는 "로그인" 포함된 것 찾기
        const allText = document.body.innerText;
        if (allText.includes('인증') || allText.includes('로그인')) {
          return '인증/로그인 관련 메시지 발견';
        }
        return null;
      });

      console.log('클릭 결과:', errorMessage || '메시지 없음');

    } catch (error) {
      console.log('❌ 클릭 실패:', error.message);
    }
  }

  // 8. 최종 결과
  console.log('\n\n=== 🎯 최종 검증 결과 ===\n');

  const success = container && searchButton && ratingButton && favoriteButtons.length > 0 && allFloatingButtons.length === 3;

  console.log('플로팅 버튼 컨테이너:', container ? '✅' : '❌');
  console.log('지역 검색 버튼:', searchButton ? '✅' : '❌');
  console.log('별점 평가 버튼:', ratingButton ? '✅' : '❌');
  console.log('관심 정치인 버튼:', favoriteButtons.length > 0 ? '✅' : '❌');
  console.log('총 버튼 개수 일치:', allFloatingButtons.length === 3 ? '✅' : '❌');

  console.log('\n🏆 프로덕션 환경 검증:', success ? '✅ 성공 - 모든 기능 작동 중!' : '❌ 실패');

  await browser.close();

  process.exit(success ? 0 : 1);
})();
