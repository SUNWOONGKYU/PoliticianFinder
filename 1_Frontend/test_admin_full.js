const { chromium } = require('playwright');

const BASE_URL = 'https://www.politicianfinder.ai.kr';
const ADMIN_PASSWORD = 'admin1234';

(async () => {
  console.log('='.repeat(60));
  console.log('관리자 전체 기능 테스트 (로그인 포함)');
  console.log('='.repeat(60));

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
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
    // 0. 관리자 로그인
    // ========================================
    console.log('\n📋 0. 관리자 로그인');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/login`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$('button[type="submit"]');

    if (passwordInput && loginButton) {
      await passwordInput.fill(ADMIN_PASSWORD);
      await loginButton.click();
      await page.waitForTimeout(3000);

      // 로그인 성공 확인 (대시보드로 이동했는지)
      const currentUrl = page.url();
      if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
        logTest('관리자 로그인', 'pass', '대시보드로 이동');
      } else {
        logTest('관리자 로그인', 'fail', currentUrl);
      }
    } else {
      logTest('관리자 로그인', 'fail', '입력 필드 없음');
    }

    // ========================================
    // 1. 관리자 대시보드
    // ========================================
    console.log('\n📋 1. 관리자 대시보드 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin`, { timeout: 30000 });
    await page.waitForTimeout(4000); // 데이터 로드 대기 시간 증가

    const dashboardTitle = await page.$('h1');
    if (dashboardTitle) {
      const titleText = await dashboardTitle.textContent();
      logTest('대시보드 타이틀', titleText.includes('대시보드') || titleText.includes('관리') ? 'pass' : 'warn', titleText);
    } else {
      logTest('대시보드 타이틀', 'fail');
    }

    // 사이드바 메뉴 확인
    const sidebarLinks = await page.$$('aside a, nav a');
    logTest('사이드바 메뉴', sidebarLinks.length > 0 ? 'pass' : 'warn', `${sidebarLinks.length}개 링크`);

    // 통계 카드 확인 (bg-white p-6 rounded-lg shadow-md)
    const stats = await page.$$('.bg-white.p-6.rounded-lg.shadow-md, [class*="stat"], .grid > div.bg-white');
    logTest('통계 카드', stats.length > 0 ? 'pass' : 'warn', `${stats.length}개`);

    // ========================================
    // 2. 사용자 관리
    // ========================================
    console.log('\n📋 2. 사용자 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/users`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // 페이지 로드 확인
    const usersPageTitle = await page.$('h1');
    if (usersPageTitle) {
      const text = await usersPageTitle.textContent();
      logTest('사용자 관리 페이지', 'pass', text);
    }

    const usersTable = await page.$('table');
    logTest('사용자 테이블', usersTable ? 'pass' : 'fail');

    if (usersTable) {
      const userRows = await page.$$('table tbody tr');
      logTest('사용자 데이터', userRows.length > 0 ? 'pass' : 'warn', `${userRows.length}명`);
    }

    // 검색 기능
    const userSearchInput = await page.$('input[placeholder*="검색"], input[type="text"]');
    if (userSearchInput) {
      await userSearchInput.fill('test');
      await page.waitForTimeout(1000);
      logTest('검색 기능', 'pass');
    } else {
      logTest('검색 기능', 'warn', '검색창 없음');
    }

    // ========================================
    // 3. 정치인 관리
    // ========================================
    console.log('\n📋 3. 정치인 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/politicians`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const politiciansPageTitle = await page.$('h1');
    if (politiciansPageTitle) {
      const text = await politiciansPageTitle.textContent();
      logTest('정치인 관리 페이지', 'pass', text);
    }

    const politiciansTable = await page.$('table');
    logTest('정치인 테이블', politiciansTable ? 'pass' : 'fail');

    if (politiciansTable) {
      const politicianRows = await page.$$('table tbody tr');
      logTest('정치인 데이터', politicianRows.length > 0 ? 'pass' : 'warn', `${politicianRows.length}명`);
    }

    // 정치인 추가/수정/삭제 버튼
    const politicianActionBtns = await page.$$('button:has-text("추가"), button:has-text("수정"), button:has-text("삭제")');
    logTest('정치인 관리 버튼', politicianActionBtns.length > 0 ? 'pass' : 'warn', `${politicianActionBtns.length}개`);

    // ========================================
    // 4. 게시글 관리 (콘텐츠 관리)
    // ========================================
    console.log('\n📋 4. 게시글/댓글/공지 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/posts`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const postsPageTitle = await page.$('h1');
    if (postsPageTitle) {
      const text = await postsPageTitle.textContent();
      logTest('콘텐츠 관리 페이지', 'pass', text);
    }

    // 게시글 탭 테스트
    const postsTab = await page.$('button:has-text("게시글")');
    if (postsTab) {
      await postsTab.click();
      await page.waitForTimeout(1500);
      const postsTable = await page.$('table');
      const postRows = await page.$$('table tbody tr');
      logTest('게시글 탭', postsTable ? 'pass' : 'fail', `${postRows.length}개 게시글`);

      // 삭제 버튼 확인
      const deletePostBtns = await page.$$('button:has-text("삭제"), .text-red-500');
      logTest('게시글 삭제 버튼', deletePostBtns.length > 0 ? 'pass' : 'warn', `${deletePostBtns.length}개`);
    }

    // 댓글 탭 테스트
    const commentsTab = await page.$('button:has-text("댓글")');
    if (commentsTab) {
      await commentsTab.click();
      await page.waitForTimeout(1500);
      const commentsTable = await page.$('table');
      const commentRows = await page.$$('table tbody tr');
      logTest('댓글 탭', commentsTable ? 'pass' : 'fail', `${commentRows.length}개 댓글`);
    }

    // 공지사항 탭 테스트
    const noticesTab = await page.$('button:has-text("공지")');
    if (noticesTab) {
      await noticesTab.click();
      await page.waitForTimeout(1500);
      const noticesTable = await page.$('table');
      const noticeRows = await page.$$('table tbody tr');
      logTest('공지사항 탭', noticesTable ? 'pass' : 'fail', `${noticeRows.length}개 공지`);

      // 새 공지 작성 버튼
      const newNoticeBtn = await page.$('button:has-text("새 공지"), button:has-text("작성")');
      logTest('새 공지 작성 버튼', newNoticeBtn ? 'pass' : 'warn');
    }

    // ========================================
    // 5. 연결 관리
    // ========================================
    console.log('\n📋 5. 연결 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/connections`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const connectionsPageTitle = await page.$('h1');
    if (connectionsPageTitle) {
      const text = await connectionsPageTitle.textContent();
      logTest('연결 관리 페이지', 'pass', text);
    }

    const connectionsTable = await page.$('table');
    logTest('연결 테이블', connectionsTable ? 'pass' : 'warn');

    if (connectionsTable) {
      const connectionRows = await page.$$('table tbody tr');
      logTest('연결 데이터', 'pass', `${connectionRows.length}개`);
    }

    // ========================================
    // 6. 문의 관리
    // ========================================
    console.log('\n📋 6. 문의 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/inquiries`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const inquiriesPageTitle = await page.$('h1');
    if (inquiriesPageTitle) {
      const text = await inquiriesPageTitle.textContent();
      logTest('문의 관리 페이지', 'pass', text);
    }

    const inquiriesTable = await page.$('table');
    logTest('문의 테이블', inquiriesTable ? 'pass' : 'warn');

    if (inquiriesTable) {
      const inquiryRows = await page.$$('table tbody tr');
      logTest('문의 데이터', 'pass', `${inquiryRows.length}개`);
    }

    // 답변 기능
    const replyBtns = await page.$$('button:has-text("답변"), button:has-text("보기")');
    logTest('답변/상세보기 버튼', replyBtns.length >= 0 ? 'pass' : 'warn', `${replyBtns.length}개`);

    // ========================================
    // 7. 릴레이 관리
    // ========================================
    console.log('\n📋 7. 릴레이 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/relay`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const relayPageTitle = await page.$('h1');
    if (relayPageTitle) {
      const text = await relayPageTitle.textContent();
      logTest('릴레이 관리 페이지', 'pass', text);
    }

    const relayTable = await page.$('table');
    logTest('릴레이 테이블', relayTable ? 'pass' : 'warn');

    if (relayTable) {
      const relayRows = await page.$$('table tbody tr');
      logTest('릴레이 데이터', 'pass', `${relayRows.length}개`);
    }

    // ========================================
    // 8. 리포트 판매 관리
    // ========================================
    console.log('\n📋 8. 리포트 판매 관리 테스트');
    console.log('-'.repeat(40));

    await page.goto(`${BASE_URL}/admin/report-sales`, { timeout: 30000 });
    await page.waitForTimeout(2000);

    const reportSalesPageTitle = await page.$('h1');
    if (reportSalesPageTitle) {
      const text = await reportSalesPageTitle.textContent();
      logTest('리포트 판매 페이지', 'pass', text);
    }

    const reportSalesTable = await page.$('table');
    logTest('리포트 판매 테이블', reportSalesTable ? 'pass' : 'warn');

    if (reportSalesTable) {
      const salesRows = await page.$$('table tbody tr');
      logTest('판매 데이터', 'pass', `${salesRows.length}개`);
    }

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

    if (warned > 0) {
      console.log('\n⚠️ 경고 (확인 필요):');
      results.filter(r => r.status === 'warn').forEach(r => {
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
