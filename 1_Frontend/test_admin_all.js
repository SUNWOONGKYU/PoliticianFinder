const { chromium } = require('playwright');

const BASE_URL = 'https://www.politicianfinder.ai.kr';

(async () => {
  console.log('='.repeat(60));
  console.log('관리자 전체 기능 테스트');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const results = [];

  const logTest = (name, status, detail = '') => {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${name}${detail ? ': ' + detail : ''}`);
    results.push({ name, status, detail });
  };

  try {
    // ========================================
    // 1. 관리자 로그인 페이지
    // ========================================
    console.log('\n📋 1. 관리자 로그인 페이지 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/login`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const loginForm = await page.$('form');
    if (loginForm) {
      logTest('로그인 폼 존재', 'pass');
    } else {
      logTest('로그인 폼 존재', 'fail');
    }

    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');

    logTest('이메일 입력 필드', emailInput ? 'pass' : 'fail');
    logTest('비밀번호 입력 필드', passwordInput ? 'pass' : 'fail');
    logTest('로그인 버튼', loginButton ? 'pass' : 'fail');

    // 로그인 시도 (테스트용 - 실패해도 됨)
    if (emailInput && passwordInput && loginButton) {
      await emailInput.fill('admin@test.com');
      await passwordInput.fill('testpassword');
      await loginButton.click();
      await page.waitForTimeout(3000);
      logTest('로그인 시도', 'pass', '폼 제출 완료');
    }

    // ========================================
    // 2. 관리자 대시보드
    // ========================================
    console.log('\n📋 2. 관리자 대시보드 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const dashboardTitle = await page.$('h1');
    if (dashboardTitle) {
      const titleText = await dashboardTitle.textContent();
      logTest('대시보드 타이틀', 'pass', titleText);
    } else {
      logTest('대시보드 타이틀', 'fail');
    }

    // 사이드바 확인
    const sidebar = await page.$('[class*="sidebar"], aside, nav');
    logTest('사이드바 존재', sidebar ? 'pass' : 'fail');

    // 통계 카드 확인
    const statCards = await page.$$('[class*="card"], [class*="stat"]');
    logTest('통계 카드', statCards.length > 0 ? 'pass' : 'warn', `${statCards.length}개 발견`);

    // ========================================
    // 3. 사용자 관리
    // ========================================
    console.log('\n📋 3. 사용자 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/users`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const usersTable = await page.$('table');
    logTest('사용자 테이블', usersTable ? 'pass' : 'fail');

    const userRows = await page.$$('table tbody tr');
    logTest('사용자 목록', userRows.length > 0 ? 'pass' : 'warn', `${userRows.length}명`);

    // 검색 기능
    const userSearch = await page.$('input[placeholder*="검색"], input[type="search"]');
    logTest('검색 기능', userSearch ? 'pass' : 'warn');

    // 페이지네이션
    const pagination = await page.$('[class*="pagination"], button:has-text("다음"), button:has-text("이전")');
    logTest('페이지네이션', pagination ? 'pass' : 'warn');

    // ========================================
    // 4. 정치인 관리
    // ========================================
    console.log('\n📋 4. 정치인 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/politicians`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const politiciansTable = await page.$('table');
    logTest('정치인 테이블', politiciansTable ? 'pass' : 'fail');

    const politicianRows = await page.$$('table tbody tr');
    logTest('정치인 목록', politicianRows.length > 0 ? 'pass' : 'warn', `${politicianRows.length}명`);

    // 정치인 추가 버튼
    const addPoliticianBtn = await page.$('button:has-text("추가"), button:has-text("등록"), a:has-text("추가")');
    logTest('정치인 추가 버튼', addPoliticianBtn ? 'pass' : 'warn');

    // ========================================
    // 5. 게시글/댓글/공지 관리
    // ========================================
    console.log('\n📋 5. 게시글/댓글/공지 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/posts`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // 탭 확인
    const tabs = await page.$$('button[class*="border-b"], nav button');
    logTest('탭 메뉴', tabs.length >= 3 ? 'pass' : 'warn', `${tabs.length}개 탭`);

    // 게시글 탭
    const postsTab = await page.$('button:has-text("게시글")');
    if (postsTab) {
      await postsTab.click();
      await page.waitForTimeout(1000);
      const postsTable = await page.$('table');
      logTest('게시글 테이블', postsTable ? 'pass' : 'fail');
    }

    // 댓글 탭
    const commentsTab = await page.$('button:has-text("댓글")');
    if (commentsTab) {
      await commentsTab.click();
      await page.waitForTimeout(1000);
      const commentsTable = await page.$('table');
      logTest('댓글 테이블', commentsTable ? 'pass' : 'fail');
    }

    // 공지사항 탭
    const noticesTab = await page.$('button:has-text("공지")');
    if (noticesTab) {
      await noticesTab.click();
      await page.waitForTimeout(1000);
      const noticesTable = await page.$('table');
      logTest('공지사항 테이블', noticesTable ? 'pass' : 'fail');
    }

    // 삭제 버튼 확인
    const deleteButtons = await page.$$('button:has-text("삭제"), a:has-text("삭제")');
    logTest('삭제 버튼', deleteButtons.length > 0 ? 'pass' : 'warn', `${deleteButtons.length}개`);

    // ========================================
    // 6. 연결 관리
    // ========================================
    console.log('\n📋 6. 연결 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/connections`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const connectionsContent = await page.$('main, [class*="content"]');
    logTest('연결 관리 페이지 로드', connectionsContent ? 'pass' : 'fail');

    const connectionsTable = await page.$('table');
    logTest('연결 테이블', connectionsTable ? 'pass' : 'warn');

    // ========================================
    // 7. 문의 관리
    // ========================================
    console.log('\n📋 7. 문의 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/inquiries`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const inquiriesContent = await page.$('main, [class*="content"]');
    logTest('문의 관리 페이지 로드', inquiriesContent ? 'pass' : 'fail');

    const inquiriesTable = await page.$('table');
    logTest('문의 테이블', inquiriesTable ? 'pass' : 'warn');

    // 답변 버튼
    const replyButtons = await page.$$('button:has-text("답변"), button:has-text("Reply")');
    logTest('답변 버튼', replyButtons.length >= 0 ? 'pass' : 'warn', `${replyButtons.length}개`);

    // ========================================
    // 8. 릴레이 관리
    // ========================================
    console.log('\n📋 8. 릴레이 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/relay`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const relayContent = await page.$('main, [class*="content"]');
    logTest('릴레이 관리 페이지 로드', relayContent ? 'pass' : 'fail');

    const relayTable = await page.$('table');
    logTest('릴레이 테이블', relayTable ? 'pass' : 'warn');

    // ========================================
    // 9. 리포트 판매 관리
    // ========================================
    console.log('\n📋 9. 리포트 판매 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/report-sales`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const reportSalesContent = await page.$('main, [class*="content"]');
    logTest('리포트 판매 페이지 로드', reportSalesContent ? 'pass' : 'fail');

    const reportSalesTable = await page.$('table');
    logTest('리포트 판매 테이블', reportSalesTable ? 'pass' : 'warn');

    // ========================================
    // 결과 요약
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('테스트 결과 요약');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warned = results.filter(r => r.status === 'warn').length;

    console.log(`✅ 통과: ${passed}개`);
    console.log(`❌ 실패: ${failed}개`);
    console.log(`⚠️ 경고: ${warned}개`);
    console.log(`📊 총계: ${results.length}개 테스트`);

    if (failed > 0) {
      console.log('\n❌ 실패한 테스트:');
      results.filter(r => r.status === 'fail').forEach(r => {
        console.log(`   - ${r.name}${r.detail ? ': ' + r.detail : ''}`);
      });
    }

    console.log('\n테스트 완료. 5초 후 브라우저 종료...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 테스트 오류:', error.message);
  } finally {
    await browser.close();
  }
})();
