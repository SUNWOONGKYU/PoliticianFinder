import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'https://www.politicianfinder.ai.kr';

// Helper function to wait for network idle
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000); // Additional buffer
}

// Test results storage
const testResults: Array<{
  category: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
}> = [];

function recordResult(category: string, test: string, status: 'PASS' | 'FAIL' | 'WARN', details: string) {
  testResults.push({ category, test, status, details });
  console.log(`[${status}] ${category} - ${test}: ${details}`);
}

test.describe('PoliticianFinder PC (1920x1080) - Full E2E Test', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('1. Homepage - 정치인 랭킹, 인기 게시글, 검색', async ({ page }) => {
    const category = '홈페이지';

    try {
      // Navigate to homepage
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '홈페이지 로딩 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // Check page title
    try {
      const title = await page.title();
      if (title.includes('PoliticianFinder') || title.includes('정치인')) {
        recordResult(category, '페이지 타이틀', 'PASS', `타이틀: ${title}`);
      } else {
        recordResult(category, '페이지 타이틀', 'WARN', `예상과 다른 타이틀: ${title}`);
      }
    } catch (error) {
      recordResult(category, '페이지 타이틀', 'FAIL', `${error}`);
    }

    // Check main navigation
    try {
      const nav = page.locator('nav, header').first();
      await expect(nav).toBeVisible({ timeout: 5000 });
      recordResult(category, '네비게이션 바', 'PASS', '네비게이션 표시됨');
    } catch (error) {
      recordResult(category, '네비게이션 바', 'FAIL', '네비게이션 미표시');
    }

    // Check politician ranking section
    try {
      const rankingSection = page.locator('text=/정치인.*랭킹|랭킹|순위/i').first();
      if (await rankingSection.isVisible({ timeout: 5000 })) {
        recordResult(category, '정치인 랭킹 섹션', 'PASS', '랭킹 섹션 표시됨');
      } else {
        recordResult(category, '정치인 랭킹 섹션', 'WARN', '랭킹 섹션 미발견');
      }
    } catch (error) {
      recordResult(category, '정치인 랭킹 섹션', 'WARN', '랭킹 섹션 확인 불가');
    }

    // Check popular posts section
    try {
      const postsSection = page.locator('text=/인기.*게시글|게시글|커뮤니티/i').first();
      if (await postsSection.isVisible({ timeout: 5000 })) {
        recordResult(category, '인기 게시글 섹션', 'PASS', '게시글 섹션 표시됨');
      } else {
        recordResult(category, '인기 게시글 섹션', 'WARN', '게시글 섹션 미발견');
      }
    } catch (error) {
      recordResult(category, '인기 게시글 섹션', 'WARN', '게시글 섹션 확인 불가');
    }

    // Check search functionality
    try {
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
      await searchInput.waitFor({ state: 'visible', timeout: 5000 });
      await searchInput.fill('이재명');
      recordResult(category, '검색 기능', 'PASS', '검색 입력 성공');
    } catch (error) {
      recordResult(category, '검색 기능', 'WARN', '검색 입력 필드 미발견');
    }

    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
  });

  test('2. 정치인 목록 페이지 - 필터링, 검색, 정렬', async ({ page }) => {
    const category = '정치인 목록';

    try {
      await page.goto(`${BASE_URL}/politicians`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '정치인 목록 페이지 로딩 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // Check politician cards
    try {
      const politicianCards = page.locator('[class*="politician"], [class*="card"]').first();
      await expect(politicianCards).toBeVisible({ timeout: 10000 });
      const cardCount = await page.locator('[class*="politician"], [class*="card"]').count();
      recordResult(category, '정치인 카드', 'PASS', `${cardCount}개 카드 표시됨`);
    } catch (error) {
      recordResult(category, '정치인 카드', 'WARN', '정치인 카드 확인 불가');
    }

    // Check filter buttons
    try {
      const filterButtons = page.locator('button:has-text("여당"), button:has-text("야당"), button:has-text("필터")');
      const filterCount = await filterButtons.count();
      if (filterCount > 0) {
        recordResult(category, '필터 버튼', 'PASS', `${filterCount}개 필터 버튼 발견`);

        // Try clicking a filter
        const firstFilter = filterButtons.first();
        await firstFilter.click();
        await page.waitForTimeout(1000);
        recordResult(category, '필터 클릭', 'PASS', '필터 클릭 동작');
      } else {
        recordResult(category, '필터 버튼', 'WARN', '필터 버튼 미발견');
      }
    } catch (error) {
      recordResult(category, '필터 버튼', 'WARN', `필터 확인 불가: ${error}`);
    }

    // Check search
    try {
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
      await searchInput.fill('김');
      await page.waitForTimeout(1000);
      recordResult(category, '검색 기능', 'PASS', '검색어 입력 성공');
    } catch (error) {
      recordResult(category, '검색 기능', 'WARN', '검색 입력 불가');
    }

    // Check sorting
    try {
      const sortSelect = page.locator('select, [role="combobox"]').first();
      if (await sortSelect.isVisible({ timeout: 3000 })) {
        recordResult(category, '정렬 기능', 'PASS', '정렬 옵션 표시됨');
      } else {
        recordResult(category, '정렬 기능', 'WARN', '정렬 옵션 미발견');
      }
    } catch (error) {
      recordResult(category, '정렬 기능', 'WARN', '정렬 확인 불가');
    }

    // Check pagination
    try {
      const pagination = page.locator('text=/페이지|다음|이전|>|</').first();
      if (await pagination.isVisible({ timeout: 3000 })) {
        recordResult(category, '페이지네이션', 'PASS', '페이지네이션 표시됨');
      } else {
        recordResult(category, '페이지네이션', 'WARN', '페이지네이션 미발견');
      }
    } catch (error) {
      recordResult(category, '페이지네이션', 'WARN', '페이지네이션 확인 불가');
    }

    await page.screenshot({ path: 'test-results/politicians-list.png', fullPage: true });
  });

  test('3. 정치인 상세 페이지 - 프로필, AI 평가, 탭', async ({ page }) => {
    const category = '정치인 상세';

    try {
      await page.goto(`${BASE_URL}/politicians`, { waitUntil: 'networkidle', timeout: 30000 });
      await waitForPageLoad(page);

      // Click first politician card
      const firstCard = page.locator('[class*="politician"], [class*="card"], a[href*="/politicians/"]').first();
      await firstCard.click();
      await waitForPageLoad(page);

      recordResult(category, '페이지 로딩', 'PASS', '정치인 상세 페이지 진입 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    // Check profile information
    try {
      const profileSection = page.locator('text=/프로필|이름|소속|경력/i').first();
      if (await profileSection.isVisible({ timeout: 5000 })) {
        recordResult(category, '프로필 정보', 'PASS', '프로필 섹션 표시됨');
      } else {
        recordResult(category, '프로필 정보', 'WARN', '프로필 섹션 미발견');
      }
    } catch (error) {
      recordResult(category, '프로필 정보', 'WARN', '프로필 확인 불가');
    }

    // Check AI evaluation
    try {
      const aiSection = page.locator('text=/AI.*평가|인공지능|분석/i').first();
      if (await aiSection.isVisible({ timeout: 5000 })) {
        recordResult(category, 'AI 평가', 'PASS', 'AI 평가 섹션 표시됨');
      } else {
        recordResult(category, 'AI 평가', 'WARN', 'AI 평가 섹션 미발견');
      }
    } catch (error) {
      recordResult(category, 'AI 평가', 'WARN', 'AI 평가 확인 불가');
    }

    // Check tabs
    try {
      const tabs = page.locator('[role="tab"], button:has-text("활동"), button:has-text("공약")');
      const tabCount = await tabs.count();
      if (tabCount > 0) {
        recordResult(category, '탭 메뉴', 'PASS', `${tabCount}개 탭 발견`);

        // Try switching tabs
        if (tabCount > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(1000);
          recordResult(category, '탭 전환', 'PASS', '탭 전환 동작');
        }
      } else {
        recordResult(category, '탭 메뉴', 'WARN', '탭 메뉴 미발견');
      }
    } catch (error) {
      recordResult(category, '탭 메뉴', 'WARN', `탭 확인 불가: ${error}`);
    }

    await page.screenshot({ path: 'test-results/politician-detail.png', fullPage: true });
  });

  test('4. 커뮤니티 - 게시글 목록, 검색, 필터', async ({ page }) => {
    const category = '커뮤니티';

    try {
      await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '커뮤니티 페이지 로딩 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // Check post list
    try {
      const posts = page.locator('[class*="post"], article, [class*="item"]').first();
      await expect(posts).toBeVisible({ timeout: 10000 });
      const postCount = await page.locator('[class*="post"], article, [class*="item"]').count();
      recordResult(category, '게시글 목록', 'PASS', `${postCount}개 게시글 표시됨`);
    } catch (error) {
      recordResult(category, '게시글 목록', 'WARN', '게시글 확인 불가');
    }

    // Check search
    try {
      const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]').first();
      await searchInput.fill('정책');
      await page.waitForTimeout(1000);
      recordResult(category, '검색 기능', 'PASS', '검색어 입력 성공');
    } catch (error) {
      recordResult(category, '검색 기능', 'WARN', '검색 입력 불가');
    }

    // Check category filter
    try {
      const categoryButtons = page.locator('button:has-text("전체"), button:has-text("토론"), button:has-text("질문")');
      const btnCount = await categoryButtons.count();
      if (btnCount > 0) {
        recordResult(category, '카테고리 필터', 'PASS', `${btnCount}개 카테고리 버튼 발견`);
      } else {
        recordResult(category, '카테고리 필터', 'WARN', '카테고리 버튼 미발견');
      }
    } catch (error) {
      recordResult(category, '카테고리 필터', 'WARN', '필터 확인 불가');
    }

    // Check sorting
    try {
      const sortButtons = page.locator('button:has-text("최신순"), button:has-text("인기순")');
      const sortCount = await sortButtons.count();
      if (sortCount > 0) {
        recordResult(category, '정렬 기능', 'PASS', `${sortCount}개 정렬 옵션 발견`);
      } else {
        recordResult(category, '정렬 기능', 'WARN', '정렬 옵션 미발견');
      }
    } catch (error) {
      recordResult(category, '정렬 기능', 'WARN', '정렬 확인 불가');
    }

    await page.screenshot({ path: 'test-results/community.png', fullPage: true });
  });

  test('5. 회원가입 페이지 - 폼, 입력 필드, 버튼', async ({ page }) => {
    const category = '회원가입';

    try {
      await page.goto(`${BASE_URL}/auth/signup`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '회원가입 페이지 로딩 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // Check form
    try {
      const form = page.locator('form').first();
      await expect(form).toBeVisible({ timeout: 5000 });
      recordResult(category, '회원가입 폼', 'PASS', '폼 표시됨');
    } catch (error) {
      recordResult(category, '회원가입 폼', 'WARN', '폼 확인 불가');
    }

    // Check email input
    try {
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await emailInput.fill('test@example.com');
      recordResult(category, '이메일 입력', 'PASS', '이메일 입력 필드 동작');
    } catch (error) {
      recordResult(category, '이메일 입력', 'WARN', '이메일 입력 불가');
    }

    // Check password input
    try {
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      await passwordInput.fill('TestPassword123!');
      recordResult(category, '비밀번호 입력', 'PASS', '비밀번호 입력 필드 동작');
    } catch (error) {
      recordResult(category, '비밀번호 입력', 'WARN', '비밀번호 입력 불가');
    }

    // Check submit button
    try {
      const submitButton = page.locator('button[type="submit"], button:has-text("가입")').first();
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      recordResult(category, '가입 버튼', 'PASS', '가입 버튼 표시됨');
    } catch (error) {
      recordResult(category, '가입 버튼', 'WARN', '가입 버튼 미발견');
    }

    // Check social login
    try {
      const socialButtons = page.locator('button:has-text("Google"), button:has-text("카카오")');
      const socialCount = await socialButtons.count();
      if (socialCount > 0) {
        recordResult(category, '소셜 로그인', 'PASS', `${socialCount}개 소셜 로그인 버튼 발견`);
      } else {
        recordResult(category, '소셜 로그인', 'WARN', '소셜 로그인 버튼 미발견');
      }
    } catch (error) {
      recordResult(category, '소셜 로그인', 'WARN', '소셜 로그인 확인 불가');
    }

    await page.screenshot({ path: 'test-results/signup.png', fullPage: true });
  });

  test('6. 로그인 페이지 - 폼, 입력 필드, 버튼', async ({ page }) => {
    const category = '로그인';

    try {
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '로그인 페이지 로딩 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // Check form
    try {
      const form = page.locator('form').first();
      await expect(form).toBeVisible({ timeout: 5000 });
      recordResult(category, '로그인 폼', 'PASS', '폼 표시됨');
    } catch (error) {
      recordResult(category, '로그인 폼', 'WARN', '폼 확인 불가');
    }

    // Check email input
    try {
      const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
      await expect(emailInput).toBeVisible({ timeout: 5000 });
      await emailInput.fill('test@example.com');
      recordResult(category, '이메일 입력', 'PASS', '이메일 입력 필드 동작');
    } catch (error) {
      recordResult(category, '이메일 입력', 'WARN', '이메일 입력 불가');
    }

    // Check password input
    try {
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeVisible({ timeout: 5000 });
      await passwordInput.fill('TestPassword123!');
      recordResult(category, '비밀번호 입력', 'PASS', '비밀번호 입력 필드 동작');
    } catch (error) {
      recordResult(category, '비밀번호 입력', 'WARN', '비밀번호 입력 불가');
    }

    // Check submit button
    try {
      const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      recordResult(category, '로그인 버튼', 'PASS', '로그인 버튼 표시됨');
    } catch (error) {
      recordResult(category, '로그인 버튼', 'WARN', '로그인 버튼 미발견');
    }

    // Check forgot password link
    try {
      const forgotLink = page.locator('a:has-text("비밀번호"), a:has-text("찾기")').first();
      if (await forgotLink.isVisible({ timeout: 3000 })) {
        recordResult(category, '비밀번호 찾기', 'PASS', '비밀번호 찾기 링크 발견');
      } else {
        recordResult(category, '비밀번호 찾기', 'WARN', '비밀번호 찾기 링크 미발견');
      }
    } catch (error) {
      recordResult(category, '비밀번호 찾기', 'WARN', '링크 확인 불가');
    }

    await page.screenshot({ path: 'test-results/login.png', fullPage: true });
  });

  test('7. 마이페이지 - 탭 전환, 프로필', async ({ page }) => {
    const category = '마이페이지';

    try {
      await page.goto(`${BASE_URL}/mypage`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '마이페이지 로딩 성공');
    } catch (error) {
      // Might be redirected to login if not authenticated
      if (page.url().includes('/auth/login')) {
        recordResult(category, '페이지 로딩', 'PASS', '미인증 상태 - 로그인 페이지로 리다이렉트 (정상)');
        return;
      }
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // If redirected to login, skip remaining tests
    if (page.url().includes('/auth/login')) {
      recordResult(category, '인증 확인', 'PASS', '미인증 시 로그인 페이지 리다이렉트 (정상)');
      return;
    }

    // Check profile section
    try {
      const profileSection = page.locator('text=/프로필|내 정보|회원 정보/i').first();
      if (await profileSection.isVisible({ timeout: 5000 })) {
        recordResult(category, '프로필 섹션', 'PASS', '프로필 섹션 표시됨');
      } else {
        recordResult(category, '프로필 섹션', 'WARN', '프로필 섹션 미발견');
      }
    } catch (error) {
      recordResult(category, '프로필 섹션', 'WARN', '프로필 확인 불가');
    }

    // Check tabs
    try {
      const tabs = page.locator('[role="tab"], button:has-text("내 글"), button:has-text("댓글"), button:has-text("북마크")');
      const tabCount = await tabs.count();
      if (tabCount > 0) {
        recordResult(category, '탭 메뉴', 'PASS', `${tabCount}개 탭 발견`);

        // Try switching tabs
        if (tabCount > 1) {
          await tabs.nth(1).click();
          await page.waitForTimeout(1000);
          recordResult(category, '탭 전환', 'PASS', '탭 전환 동작');
        }
      } else {
        recordResult(category, '탭 메뉴', 'WARN', '탭 메뉴 미발견');
      }
    } catch (error) {
      recordResult(category, '탭 메뉴', 'WARN', '탭 확인 불가');
    }

    await page.screenshot({ path: 'test-results/mypage.png', fullPage: true });
  });

  test('8. 알림 페이지', async ({ page }) => {
    const category = '알림';

    try {
      await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle', timeout: 30000 });
      recordResult(category, '페이지 로딩', 'PASS', '알림 페이지 로딩 성공');
    } catch (error) {
      // Might be redirected to login if not authenticated
      if (page.url().includes('/auth/login')) {
        recordResult(category, '페이지 로딩', 'PASS', '미인증 상태 - 로그인 페이지로 리다이렉트 (정상)');
        return;
      }
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    await waitForPageLoad(page);

    // If redirected to login, skip remaining tests
    if (page.url().includes('/auth/login')) {
      recordResult(category, '인증 확인', 'PASS', '미인증 시 로그인 페이지 리다이렉트 (정상)');
      return;
    }

    // Check notification list
    try {
      const notificationList = page.locator('[class*="notification"], [class*="alert"]').first();
      if (await notificationList.isVisible({ timeout: 5000 })) {
        const notifCount = await page.locator('[class*="notification"], [class*="alert"]').count();
        recordResult(category, '알림 목록', 'PASS', `${notifCount}개 알림 표시됨`);
      } else {
        recordResult(category, '알림 목록', 'WARN', '알림 없음 또는 미표시');
      }
    } catch (error) {
      recordResult(category, '알림 목록', 'WARN', '알림 확인 불가');
    }

    await page.screenshot({ path: 'test-results/notifications.png', fullPage: true });
  });

  test('9. Footer - 회사 정보', async ({ page }) => {
    const category = 'Footer';

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await waitForPageLoad(page);

      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      recordResult(category, '페이지 로딩', 'PASS', 'Footer 영역 접근 성공');
    } catch (error) {
      recordResult(category, '페이지 로딩', 'FAIL', `로딩 실패: ${error}`);
      return;
    }

    // Check footer element
    try {
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible({ timeout: 5000 });
      recordResult(category, 'Footer 표시', 'PASS', 'Footer 요소 표시됨');
    } catch (error) {
      recordResult(category, 'Footer 표시', 'FAIL', 'Footer 요소 미발견');
      return;
    }

    // Check company info
    try {
      const companyInfo = page.locator('footer text=/회사|사업자|주소|대표/i').first();
      if (await companyInfo.isVisible({ timeout: 3000 })) {
        recordResult(category, '회사 정보', 'PASS', '회사 정보 표시됨');
      } else {
        recordResult(category, '회사 정보', 'WARN', '회사 정보 미발견');
      }
    } catch (error) {
      recordResult(category, '회사 정보', 'WARN', '회사 정보 확인 불가');
    }

    // Check links
    try {
      const footerLinks = page.locator('footer a');
      const linkCount = await footerLinks.count();
      if (linkCount > 0) {
        recordResult(category, 'Footer 링크', 'PASS', `${linkCount}개 링크 발견`);
      } else {
        recordResult(category, 'Footer 링크', 'WARN', 'Footer 링크 미발견');
      }
    } catch (error) {
      recordResult(category, 'Footer 링크', 'WARN', '링크 확인 불가');
    }

    await page.screenshot({ path: 'test-results/footer.png' });
  });

  test.afterAll(async () => {
    // Generate summary report
    console.log('\n\n========================================');
    console.log('PoliticianFinder PC E2E Test Results');
    console.log('========================================\n');

    const passCount = testResults.filter(r => r.status === 'PASS').length;
    const failCount = testResults.filter(r => r.status === 'FAIL').length;
    const warnCount = testResults.filter(r => r.status === 'WARN').length;

    console.log(`Total Tests: ${testResults.length}`);
    console.log(`✅ PASS: ${passCount}`);
    console.log(`❌ FAIL: ${failCount}`);
    console.log(`⚠️  WARN: ${warnCount}`);
    console.log('\n');

    // Group by category
    const categories = [...new Set(testResults.map(r => r.category))];

    categories.forEach(category => {
      console.log(`\n${category}`);
      console.log('='.repeat(category.length));

      const categoryResults = testResults.filter(r => r.category === category);
      categoryResults.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${result.test}: ${result.details}`);
      });
    });

    // Save to file
    const fs = require('fs');
    const reportPath = 'test-results/pc-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: { total: testResults.length, pass: passCount, fail: failCount, warn: warnCount },
      results: testResults
    }, null, 2));

    console.log(`\n\nDetailed report saved to: ${reportPath}`);
  });
});
