/**
 * Project Grid Task ID: P1T1
 * 작업명: 인증 E2E 테스트
 * 생성시간: 2025-11-03
 * 생성자: Claude Code
 * 의존성: P1BA1, P1BA2, P1BA3, P1BA4, P1F3, P1F4, P1F5
 * 설명: 회원가입, 로그인, Google OAuth, 비밀번호 재설정 플로우의 End-to-End 테스트
 */

import { test, expect } from '@playwright/test';

// 테스트 설정
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!@#';
const TEST_NICKNAME = `test-user-${Date.now()}`;

// ============================================================================
// 회원가입 (P1BA1) E2E 테스트
// ============================================================================
test.describe('회원가입 플로우', () => {
  test('정상적인 회원가입', async ({ page }) => {
    // 1. 회원가입 페이지 접근
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator('text=회원가입')).toBeVisible();

    // 2. 폼 작성
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', TEST_NICKNAME);

    // 3. 약관 동의
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');

    // 4. 제출
    await page.click('button:has-text("회원가입")');

    // 5. 성공 메시지 확인
    await expect(page.locator('text=회원가입이 완료되었습니다')).toBeVisible({
      timeout: 5000,
    });

    // 6. 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(`${BASE_URL}/login`, { timeout: 3000 });
  });

  test('이메일 중복 거부', async ({ page }) => {
    // 1. 먼저 첫 가입자 생성
    const firstEmail = `first-${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', firstEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}-1`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. 같은 이메일로 재가입 시도
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', firstEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}-2`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');

    // 3. 에러 메시지 확인
    await expect(
      page.locator('text=이미 사용 중인 이메일입니다')
    ).toBeVisible({ timeout: 5000 });
  });

  test('비밀번호 불일치 거부', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', 'DifferentPassword123!@#');
    await page.fill('input[name="nickname"]', TEST_NICKNAME);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');

    await expect(page.locator('text=비밀번호가 일치하지 않습니다')).toBeVisible(
      { timeout: 5000 }
    );
  });
});

// ============================================================================
// 로그인 (P1BA2) E2E 테스트
// ============================================================================
test.describe('로그인 플로우', () => {
  test('정상적인 로그인', async ({ page }) => {
    // 1. 먼저 계정 생성
    const email = `login-test-${Date.now()}@example.com`;
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. 로그인 페이지로 이동
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('text=로그인')).toBeVisible();

    // 3. 폼 작성 및 제출
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("로그인")');

    // 4. 홈페이지로 리다이렉트 확인
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 5000 });
  });

  test('잘못된 비밀번호 거부', async ({ page }) => {
    const email = `wrong-pwd-${Date.now()}@example.com`;

    // 1. 계정 생성
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. 잘못된 비밀번호로 로그인 시도
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'WrongPassword123!@#');
    await page.click('button:has-text("로그인")');

    // 3. 에러 메시지 확인
    await expect(
      page.locator('text=이메일 또는 비밀번호가 올바르지 않습니다')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Remember Me 기능', async ({ page, context }) => {
    const email = `remember-me-${Date.now()}@example.com`;

    // 1. 계정 생성
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. Remember Me 체크하고 로그인
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.check('input[name="remember-me"]');
    await page.click('button:has-text("로그인")');

    // 3. 로그인 성공 확인
    await expect(page).toHaveURL(`${BASE_URL}/`, { timeout: 5000 });

    // 4. 쿠키 확인 (session 토큰 확인)
    const cookies = await context.cookies();
    const sessionCookie = cookies.find((c) => c.name.includes('session'));
    expect(sessionCookie).toBeDefined();
  });
});

// ============================================================================
// Google OAuth (P1BA3) E2E 테스트
// ============================================================================
test.describe('Google OAuth 플로우', () => {
  test('Google OAuth 버튼 접근 가능', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Google 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("구글로 계속하기")');
    await expect(googleButton).toBeVisible();
  });

  test('회원가입에서 Google OAuth 버튼 표시', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);

    // Google 로그인 버튼 확인
    const googleButton = page.locator('button:has-text("구글로 계속하기")');
    await expect(googleButton).toBeVisible();
  });
});

// ============================================================================
// 비밀번호 재설정 (P1BA4) E2E 테스트
// ============================================================================
test.describe('비밀번호 재설정 플로우', () => {
  test('비밀번호 재설정 페이지 접근', async ({ page }) => {
    await page.goto(`${BASE_URL}/password-reset`);

    // 페이지 요소 확인
    await expect(page.locator('text=비밀번호를 잊으셨나요?')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("인증 메일 보내기")')).toBeVisible();
  });

  test('이메일 입력 폼 제출', async ({ page }) => {
    const email = `reset-test-${Date.now()}@example.com`;

    // 1. 먼저 계정 생성
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. 비밀번호 재설정 페이지로 이동
    await page.goto(`${BASE_URL}/password-reset`);

    // 3. 이메일 입력 및 제출
    await page.fill('input[name="email"]', email);
    await page.click('button:has-text("인증 메일 보내기")');

    // 4. 확인 메시지 표시 확인
    await expect(page.locator('text=인증 메일을 발송했습니다')).toBeVisible({
      timeout: 5000,
    });
  });

  test('비밀번호 재설정 페이지 UI 요소 검증', async ({ page }) => {
    await page.goto(`${BASE_URL}/password-reset`);

    // Step indicator 확인
    await expect(page.locator('text=이메일 인증')).toBeVisible();
    await expect(page.locator('text=비밀번호 재설정')).toBeVisible();

    // 로그인 페이지 링크 확인
    await expect(page.locator('a:has-text("로그인 페이지로 돌아가기")')).toBeVisible();
  });
});

// ============================================================================
// 통합 플로우 테스트
// ============================================================================
test.describe('통합 인증 플로우', () => {
  test('회원가입 → 로그인 → 마이페이지 전체 플로우', async ({ page }) => {
    const email = `flow-test-${Date.now()}@example.com`;

    // 1. 회원가입
    await page.goto(`${BASE_URL}/signup`);
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="password_confirm"]', TEST_PASSWORD);
    await page.fill('input[name="nickname"]', `nick-${Date.now()}`);
    await page.check('input[name="terms_agreed"]');
    await page.check('input[name="privacy_agreed"]');
    await page.click('button:has-text("회원가입")');
    await page.waitForTimeout(2000);

    // 2. 로그인 페이지 확인
    await expect(page).toHaveURL(`${BASE_URL}/login`);

    // 3. 로그인
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button:has-text("로그인")');

    // 4. 홈페이지 도착 확인
    await expect(page).toHaveURL(`${BASE_URL}/`);

    // 5. 마이페이지 접근 (로그인 후 표시되는 링크)
    await page.goto(`${BASE_URL}/mypage`);
    await expect(page).toHaveURL(`${BASE_URL}/mypage`);
  });
});
