const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Launching browser...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('📄 Navigating to page...');
  await page.goto('http://localhost:3000/politicians/c34753dd', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  console.log('⏳ Waiting for page to fully render...');
  await page.waitForTimeout(3000);

  console.log('\n=== 플로팅 버튼 검증 시작 ===\n');

  // 1. 플로팅 버튼 컨테이너 확인
  const container = await page.$('div.fixed.bottom-8.right-8');
  if (container) {
    console.log('✅ 플로팅 버튼 컨테이너 발견!');
    console.log('   - Selector: div.fixed.bottom-8.right-8');

    // 컨테이너 HTML 확인
    const containerHTML = await container.evaluate(el => el.outerHTML.substring(0, 500));
    console.log('\n📦 컨테이너 HTML (처음 500자):');
    console.log(containerHTML);
  } else {
    console.log('❌ 플로팅 버튼 컨테이너 미발견');
  }

  // 2. 개별 버튼 확인
  console.log('\n=== 개별 버튼 확인 ===\n');

  // 지역 검색 버튼
  const searchButton = await page.$('button[title="지역 검색"]');
  if (searchButton) {
    console.log('✅ 1. 지역 검색 버튼 발견!');
    const btnText = await searchButton.evaluate(el => {
      return {
        title: el.getAttribute('title'),
        classes: el.className,
        innerHTML: el.innerHTML.substring(0, 200)
      };
    });
    console.log('   - Title:', btnText.title);
    console.log('   - Classes:', btnText.classes.substring(0, 100));
  } else {
    console.log('❌ 1. 지역 검색 버튼 미발견');
  }

  // 별점 평가 버튼
  const ratingButton = await page.$('button[title="별점 평가"]');
  if (ratingButton) {
    console.log('\n✅ 2. 별점 평가 버튼 발견!');
    const btnText = await ratingButton.evaluate(el => {
      return {
        title: el.getAttribute('title'),
        classes: el.className
      };
    });
    console.log('   - Title:', btnText.title);
    console.log('   - Classes:', btnText.classes.substring(0, 100));
  } else {
    console.log('\n❌ 2. 별점 평가 버튼 미발견');
  }

  // 관심 정치인 버튼
  const favoriteButtons = await page.$$('button[title*="관심 정치인"]');
  if (favoriteButtons.length > 0) {
    console.log('\n✅ 3. 관심 정치인 버튼 발견! (총 ' + favoriteButtons.length + '개)');
    for (let i = 0; i < favoriteButtons.length; i++) {
      const btnText = await favoriteButtons[i].evaluate(el => {
        return {
          title: el.getAttribute('title'),
          classes: el.className,
          disabled: el.disabled
        };
      });
      console.log(`   - 버튼 ${i+1}:`);
      console.log(`     Title: ${btnText.title}`);
      console.log(`     Classes: ${btnText.classes.substring(0, 100)}`);
      console.log(`     Disabled: ${btnText.disabled}`);
    }
  } else {
    console.log('\n❌ 3. 관심 정치인 버튼 미발견');
  }

  // 3. 전체 버튼 개수 확인
  console.log('\n=== 전체 버튼 개수 확인 ===\n');
  const allButtons = await page.$$('div.fixed.bottom-8.right-8 button');
  console.log(`총 플로팅 버튼 개수: ${allButtons.length}개`);

  if (allButtons.length === 3) {
    console.log('✅ 예상한 3개 버튼 모두 존재!');
  } else {
    console.log(`⚠️  예상과 다름 (예상: 3개, 실제: ${allButtons.length}개)`);
  }

  // 4. 스크린샷 저장
  console.log('\n📸 스크린샷 저장 중...');
  await page.screenshot({
    path: 'floating_buttons_verification.png',
    fullPage: true
  });
  console.log('✅ 스크린샷 저장 완료: floating_buttons_verification.png');

  // 5. 최종 결과
  console.log('\n=== 최종 검증 결과 ===\n');
  const finalResult = {
    container: !!container,
    searchButton: !!searchButton,
    ratingButton: !!ratingButton,
    favoriteButton: favoriteButtons.length > 0,
    totalButtons: allButtons.length,
    expected: 3,
    success: !!container && !!searchButton && !!ratingButton && favoriteButtons.length > 0 && allButtons.length === 3
  };

  console.log('컨테이너 존재:', finalResult.container ? '✅' : '❌');
  console.log('지역 검색 버튼:', finalResult.searchButton ? '✅' : '❌');
  console.log('별점 평가 버튼:', finalResult.ratingButton ? '✅' : '❌');
  console.log('관심 정치인 버튼:', finalResult.favoriteButton ? '✅' : '❌');
  console.log('총 버튼 개수:', finalResult.totalButtons, '/', finalResult.expected);
  console.log('\n🎯 최종 결과:', finalResult.success ? '✅ 모든 플로팅 버튼 구현 확인!' : '❌ 일부 버튼 미구현');

  await browser.close();

  process.exit(finalResult.success ? 0 : 1);
})();
