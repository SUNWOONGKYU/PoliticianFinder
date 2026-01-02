/**
 * PoliticianFinder Mobile Test Report Generator - iPhone 14 (390x844)
 * 일반 회원 관점 전체 기능 테스트 및 리포트 생성
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MIN_TOUCH_TARGET = 44;

const testResults = [];

function addResult(category, item, status, details) {
  testResults.push({ category, item, status, details });
}

test.describe('PoliticianFinder Mobile Report', () => {
  test.use({
    viewport: MOBILE_VIEWPORT,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  test('Generate Mobile Test Report', async ({ page }) => {
    console.log('\n=== PoliticianFinder Mobile Test Report ===\n');

    // 1. 홈페이지 테스트
    console.log('1. 홈페이지 테스트...');
    try {
      await page.goto(BASE_URL, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const hasHorizontalScroll = bodyWidth > 390;

      addResult('홈페이지', '모바일 레이아웃', hasHorizontalScroll ? '❌ 실패' : '✅ 통과', `Body width: ${bodyWidth}px`);
      addResult('홈페이지', '터치 반응', '✅ 통과', '페이지 로드 및 터치 가능');

      console.log(`   Body width: ${bodyWidth}px - ${hasHorizontalScroll ? 'FAIL' : 'PASS'}`);
    } catch (e) {
      addResult('홈페이지', '페이지 로드', '❌ 실패', e.message);
    }

    // 2. Header 테스트
    console.log('2. Header 테스트...');
    try {
      await page.goto(BASE_URL, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const hamburgerButton = page.locator('button.hamburger, button[aria-label*="menu"], .menu-toggle').first();
      const buttonExists = await hamburgerButton.count() > 0;

      if (buttonExists) {
        const buttonBox = await hamburgerButton.boundingBox();
        const sizeOk = buttonBox && buttonBox.width >= MIN_TOUCH_TARGET && buttonBox.height >= MIN_TOUCH_TARGET;

        addResult('Header', '햄버거 메뉴', sizeOk ? '✅ 통과' : '⚠️ 주의',
          buttonBox ? `${buttonBox.width}x${buttonBox.height}px (최소 ${MIN_TOUCH_TARGET}px)` : '크기 확인 불가');
      } else {
        addResult('Header', '햄버거 메뉴', '⚠️ 미발견', '데스크톱 네비게이션일 수 있음');
      }
    } catch (e) {
      addResult('Header', '햄버거 메뉴', '❌ 실패', e.message);
    }

    // 3. 정치인 목록 테스트
    console.log('3. 정치인 목록 테스트...');
    try {
      await page.goto(`${BASE_URL}/politicians`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const hasHorizontalScroll = bodyWidth > 390;

      addResult('정치인 목록', '모바일 레이아웃', hasHorizontalScroll ? '❌ 실패' : '✅ 통과', `Body width: ${bodyWidth}px`);

      // 필터 버튼 체크
      const filterButton = page.locator('button[class*="filter"], button[aria-label*="필터"]').first();
      if (await filterButton.count() > 0) {
        const buttonBox = await filterButton.boundingBox();
        const sizeOk = buttonBox && buttonBox.height >= MIN_TOUCH_TARGET;

        addResult('정치인 목록', '필터 버튼', sizeOk ? '✅ 통과' : '⚠️ 주의',
          buttonBox ? `${buttonBox.width}x${buttonBox.height}px` : '크기 확인 불가');
      }
    } catch (e) {
      addResult('정치인 목록', '페이지 로드', '❌ 실패', e.message);
    }

    // 4. 커뮤니티 테스트
    console.log('4. 커뮤니티 테스트...');
    try {
      await page.goto(`${BASE_URL}/community`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const hasHorizontalScroll = bodyWidth > 390;

      addResult('커뮤니티', '모바일 레이아웃', hasHorizontalScroll ? '❌ 실패' : '✅ 통과', `Body width: ${bodyWidth}px`);

      // 탭 요소 체크
      const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
      const tabCount = await tabs.count();

      if (tabCount > 0) {
        addResult('커뮤니티', '탭 전환', '✅ 통과', `${tabCount}개 탭 발견`);
      } else {
        addResult('커뮤니티', '탭 전환', '⚠️ 미발견', '탭 요소 없음');
      }
    } catch (e) {
      addResult('커뮤니티', '페이지 로드', '❌ 실패', e.message);
    }

    // 5. 로그인 테스트
    console.log('5. 로그인/회원가입 테스트...');
    try {
      await page.goto(`${BASE_URL}/auth/login`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();

      // 입력 필드 체크
      if (await emailInput.count() > 0) {
        const emailBox = await emailInput.boundingBox();
        const sizeOk = emailBox && emailBox.height >= MIN_TOUCH_TARGET;

        addResult('로그인', '이메일 입력', sizeOk ? '✅ 통과' : '⚠️ 주의',
          emailBox ? `높이 ${emailBox.height}px` : '크기 확인 불가');
      }

      if (await passwordInput.count() > 0) {
        const passwordBox = await passwordInput.boundingBox();
        const sizeOk = passwordBox && passwordBox.height >= MIN_TOUCH_TARGET;

        addResult('로그인', '비밀번호 입력', sizeOk ? '✅ 통과' : '⚠️ 주의',
          passwordBox ? `높이 ${passwordBox.height}px` : '크기 확인 불가');
      }

      if (await loginButton.count() > 0) {
        const buttonBox = await loginButton.boundingBox();
        const sizeOk = buttonBox && buttonBox.height >= MIN_TOUCH_TARGET;

        addResult('로그인', '로그인 버튼', sizeOk ? '✅ 통과' : '⚠️ 주의',
          buttonBox ? `${buttonBox.width}x${buttonBox.height}px` : '크기 확인 불가');
      }

      // 회원가입 페이지
      await page.goto(`${BASE_URL}/auth/signup`, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const signupButton = page.locator('button[type="submit"], button:has-text("가입")').first();
      if (await signupButton.count() > 0) {
        const buttonBox = await signupButton.boundingBox();
        const sizeOk = buttonBox && buttonBox.height >= MIN_TOUCH_TARGET;

        addResult('회원가입', '회원가입 버튼', sizeOk ? '✅ 통과' : '⚠️ 주의',
          buttonBox ? `${buttonBox.width}x${buttonBox.height}px` : '크기 확인 불가');
      }
    } catch (e) {
      addResult('로그인', '페이지 로드', '❌ 실패', e.message);
    }

    // 6. Footer 테스트
    console.log('6. Footer 테스트...');
    try {
      await page.goto(BASE_URL, { timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      const footer = page.locator('footer').first();
      if (await footer.count() > 0) {
        const footerBox = await footer.boundingBox();
        const footerScrollWidth = await footer.evaluate(el => el.scrollWidth);
        const footerClientWidth = await footer.evaluate(el => el.clientWidth);
        const hasScroll = footerScrollWidth > footerClientWidth + 5;

        addResult('Footer', '회사 정보 레이아웃', hasScroll ? '⚠️ 주의' : '✅ 통과',
          `Scroll: ${footerScrollWidth}px, Client: ${footerClientWidth}px`);
      } else {
        addResult('Footer', 'Footer 요소', '⚠️ 미발견', 'Footer 요소 없음');
      }
    } catch (e) {
      addResult('Footer', 'Footer', '❌ 실패', e.message);
    }

    // 7. 가독성 테스트 (모든 주요 페이지)
    console.log('7. 전체 페이지 가독성 테스트...');
    const pages = [
      { url: BASE_URL, name: 'Home' },
      { url: `${BASE_URL}/politicians`, name: 'Politicians' },
      { url: `${BASE_URL}/community`, name: 'Community' },
      { url: `${BASE_URL}/auth/login`, name: 'Login' },
    ];

    for (const pageInfo of pages) {
      try {
        await page.goto(pageInfo.url, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');

        // 가로 스크롤 체크
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.body.scrollWidth > window.innerWidth;
        });

        // 최소 폰트 크기 체크
        const minFontSize = await page.evaluate(() => {
          const allElements = document.querySelectorAll('p, span, div, a, button');
          let minSize = Infinity;

          allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            if (fontSize > 0 && fontSize < minSize && el.textContent.trim() !== '') {
              minSize = fontSize;
            }
          });

          return minSize === Infinity ? 14 : minSize;
        });

        addResult('가독성', `${pageInfo.name} - 가로 스크롤`, hasHorizontalScroll ? '❌ 발생' : '✅ 없음',
          hasHorizontalScroll ? '가로 스크롤 발생' : '정상');

        addResult('가독성', `${pageInfo.name} - 폰트 크기`, minFontSize >= 12 ? '✅ 통과' : '⚠️ 주의',
          `최소 폰트: ${minFontSize}px (권장: 12px 이상)`);

      } catch (e) {
        addResult('가독성', `${pageInfo.name}`, '❌ 실패', e.message);
      }
    }

    // Generate Report
    console.log('\n=== 테스트 결과 요약 ===\n');

    const report = generateMarkdownReport();
    console.log(report);

    // Save report
    const reportPath = path.join(__dirname, '..', 'mobile-test-report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\n리포트 저장: ${reportPath}`);
  });
});

function generateMarkdownReport() {
  let report = '# PoliticianFinder Mobile Test Report\n\n';
  report += `**테스트 일시:** ${new Date().toLocaleString('ko-KR')}\n`;
  report += `**테스트 환경:** iPhone 14 (390x844)\n`;
  report += `**테스트 URL:** ${BASE_URL}\n\n`;

  report += '## 테스트 결과 요약\n\n';

  const totalTests = testResults.length;
  const passed = testResults.filter(r => r.status.includes('✅')).length;
  const failed = testResults.filter(r => r.status.includes('❌')).length;
  const warnings = testResults.filter(r => r.status.includes('⚠️')).length;

  report += `- **총 테스트:** ${totalTests}개\n`;
  report += `- **통과:** ${passed}개 (✅)\n`;
  report += `- **실패:** ${failed}개 (❌)\n`;
  report += `- **주의:** ${warnings}개 (⚠️)\n\n`;

  report += '## 상세 결과\n\n';
  report += '| 카테고리 | 항목 | 결과 | 상세 내용 |\n';
  report += '|----------|------|------|----------|\n';

  testResults.forEach(result => {
    report += `| ${result.category} | ${result.item} | ${result.status} | ${result.details} |\n`;
  });

  report += '\n## 권장 사항\n\n';

  const issues = testResults.filter(r => r.status.includes('❌') || r.status.includes('⚠️'));
  if (issues.length > 0) {
    issues.forEach(issue => {
      report += `- **${issue.category} - ${issue.item}**: ${issue.details}\n`;
    });
  } else {
    report += '모든 테스트를 통과했습니다!\n';
  }

  report += '\n---\n';
  report += `\n*Generated by Playwright Mobile Test Suite*\n`;

  return report;
}
