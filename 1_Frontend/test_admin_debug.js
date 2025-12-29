const { chromium } = require('playwright');

const BASE_URL = 'https://www.politicianfinder.ai.kr';
const ADMIN_PASSWORD = 'admin1234';

(async () => {
  console.log('관리자 대시보드 & 문의 디버그 테스트\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 로그인
    console.log('1. 로그인 중...');
    await page.goto(`${BASE_URL}/admin/login`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');
    if (passwordInput && loginButton) {
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);
      console.log('   ✅ 로그인 완료\n');
    }

    // 대시보드 테스트
    console.log('2. 대시보드 분석...');
    await page.goto(`${BASE_URL}/admin`, { timeout: 30000 });
    await page.waitForTimeout(5000); // 충분히 대기

    // 에러 메시지 확인
    const errorMsg = await page.$('.bg-red-50, [class*="error"]');
    if (errorMsg) {
      const errorText = await errorMsg.textContent();
      console.log('   ❌ 에러 발견:', errorText);
    }

    // 로딩 스피너 확인
    const spinner = await page.$('.animate-spin');
    if (spinner) {
      console.log('   ⏳ 아직 로딩 중...');
      await page.waitForTimeout(3000);
    }

    // 통계 카드 찾기 (다양한 셀렉터 시도)
    const selectors = [
      '.bg-white.p-6.rounded-lg.shadow-md',
      'div.bg-white.p-6',
      '.grid .bg-white',
      '[class*="shadow-md"]',
      'main .bg-white'
    ];

    for (const sel of selectors) {
      const elements = await page.$$(sel);
      console.log(`   셀렉터 "${sel}": ${elements.length}개`);
    }

    // 페이지 HTML 일부 확인
    const mainContent = await page.$('main');
    if (mainContent) {
      const html = await mainContent.innerHTML();
      const hasStats = html.includes('총 회원 수') || html.includes('total_users');
      console.log(`   통계 텍스트 존재: ${hasStats ? '✅' : '❌'}`);

      if (html.includes('오류')) {
        console.log('   ⚠️ 페이지에 오류 텍스트 발견');
      }
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'admin_dashboard_debug.png', fullPage: true });
    console.log('   📸 스크린샷 저장: admin_dashboard_debug.png\n');

    // 문의 관리 테스트
    console.log('3. 문의 관리 분석...');
    await page.goto(`${BASE_URL}/admin/inquiries`, { timeout: 30000 });
    await page.waitForTimeout(3000);

    // 사이드바 확인
    const sidebar = await page.$('aside');
    console.log(`   사이드바: ${sidebar ? '✅' : '❌'}`);

    // 테이블 확인
    const table = await page.$('table');
    console.log(`   테이블: ${table ? '✅' : '❌'}`);

    if (table) {
      const rows = await page.$$('table tbody tr');
      console.log(`   테이블 행: ${rows.length}개`);
    }

    // 에러 확인
    const inquiryError = await page.$('.bg-red-50');
    if (inquiryError) {
      const errText = await inquiryError.textContent();
      console.log('   ❌ 에러:', errText);
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'admin_inquiries_debug.png', fullPage: true });
    console.log('   📸 스크린샷 저장: admin_inquiries_debug.png\n');

    console.log('디버그 완료. 5초 후 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await browser.close();
  }
})();
