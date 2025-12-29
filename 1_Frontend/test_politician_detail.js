const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== 정치인 상세페이지 테스트 ===\n');

  // 1. 정치인 목록에서 실제 ID 가져오기
  console.log('[1] 정치인 목록에서 실제 ID 확인...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const politicianLinks = await page.locator('a[href^="/politicians/"]').all();
  console.log('    - 발견된 정치인 링크 수:', politicianLinks.length);
  
  if (politicianLinks.length > 0) {
    const firstHref = await politicianLinks[0].getAttribute('href');
    console.log('    - 첫 번째 정치인 링크:', firstHref);
    
    // 2. 실제 정치인 상세페이지 테스트
    console.log('\n[2] 실제 정치인 상세페이지 접속...');
    await politicianLinks[0].click();
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('    - 현재 URL:', currentUrl);
    
    // 페이지 내용 확인
    const pageContent = await page.content();
    const hasError = pageContent.includes('정치인을 찾을 수 없습니다');
    const hasName = pageContent.includes('정원오') || pageContent.includes('김동연');
    
    if (hasError) {
      console.log('    ❌ 에러 페이지가 표시됨');
    } else if (hasName) {
      console.log('    ✅ 정치인 정보 정상 표시');
    }
    
    await page.screenshot({ path: 'test_real_politician.png', fullPage: false });
    console.log('    - 스크린샷: test_real_politician.png');
  }
  
  // 3. 존재하지 않는 ID 테스트
  console.log('\n[3] 존재하지 않는 ID 테스트...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/invalid-id-12345', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const errorContent = await page.content();
  const showsError = errorContent.includes('정치인을 찾을 수 없습니다') || errorContent.includes('404');
  
  if (showsError) {
    console.log('    ✅ 에러 페이지 정상 표시');
  } else {
    console.log('    ⚠️ 에러 처리 확인 필요');
  }
  
  await page.screenshot({ path: 'test_invalid_politician.png', fullPage: false });
  console.log('    - 스크린샷: test_invalid_politician.png');
  
  // 4. 숫자 ID(1) 테스트 - 이전에 김민준이 나오던 케이스
  console.log('\n[4] 숫자 ID(1) 테스트 (이전에 김민준 나오던 케이스)...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians/1', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  
  const numericIdContent = await page.content();
  const hasKimMinJun = numericIdContent.includes('김민준');
  const showsErrorForNumeric = numericIdContent.includes('정치인을 찾을 수 없습니다');
  
  if (hasKimMinJun) {
    console.log('    ❌ 김민준(샘플 데이터)이 여전히 표시됨!');
  } else if (showsErrorForNumeric) {
    console.log('    ✅ 에러 페이지 정상 표시 (김민준 샘플 데이터 제거됨)');
  } else {
    console.log('    ⚠️ 확인 필요');
  }
  
  await page.screenshot({ path: 'test_numeric_id.png', fullPage: false });
  console.log('    - 스크린샷: test_numeric_id.png');

  console.log('\n=== 테스트 완료 ===');
  await browser.close();
})();
