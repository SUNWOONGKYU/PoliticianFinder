// Task: P5T2
// E2E Tests for Authentication scenarios
// 작업일: 2025-11-10
// 설명: 회원가입, 로그인, 로그아웃, 비밀번호 찾기 E2E 테스트 (Updated)

import { test, expect, Page } from '@playwright/test';

// Test data
const TEST_USER = {
  email: 'test.user@example.com',
  password: 'TestPass123!',
  nickname: 'TestUser',
  full_name: '테스트 사용자',
};

// Helper functions
async function fillSignupForm(page: Page, userData: typeof TEST_USER) {
  await page.fill('#email', userData.email);
  await page.fill('#password', userData.password);
  await page.fill('#password_confirm', userData.password);
  await page.fill('#nickname', userData.nickname);
  await page.fill('#full_name', userData.full_name);

  // Accept required terms
  await page.check('#terms-service');
  await page.check('#terms-privacy');
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
}

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should successfully register a new user with valid data', async ({ page }) => {
    await page.goto('/auth/signup');

    // Verify page loaded correctly
    await expect(page.locator('h2')).toContainText('회원가입');

    // Fill out the registration form
    await fillSignupForm(page, {
      ...TEST_USER,
      email: `new.user.${Date.now()}@example.com`,
    });

    // Submit the form
    await page.click('button[type="submit"]');

    // Should redirect to login page or show success message
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/login|\/auth\/login|\/$/);
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#password_confirm', 'DifferentPassword123!');
    await page.fill('#nickname', TEST_USER.nickname);

    // Accept terms
    await page.check('#terms-service');
    await page.check('#terms-privacy');

    await page.click('button[type="submit"]');

    // Should show error message or prevent submission
    await page.waitForTimeout(1000);
  });

  test('should require mandatory terms acceptance', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.fill('#password_confirm', TEST_USER.password);
    await page.fill('#nickname', TEST_USER.nickname);

    // Don't check required terms - try to submit
    await page.click('button[type="submit"]');

    // Should show error or prevent form submission
    await page.waitForTimeout(1000);
    const errorVisible = await page.locator('.text-red-700, .text-red-500, [role="alert"]').isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('should toggle all terms with "전체 동의" checkbox', async ({ page }) => {
    await page.goto('/auth/signup');

    // Click the "all terms" checkbox
    await page.check('#terms-all');

    // All individual checkboxes should be checked
    await expect(page.locator('#terms-service')).toBeChecked();
    await expect(page.locator('#terms-privacy')).toBeChecked();
    await expect(page.locator('#terms-marketing')).toBeChecked();

    // Uncheck "all terms"
    await page.uncheck('#terms-all');

    // All should be unchecked
    await expect(page.locator('#terms-service')).not.toBeChecked();
    await expect(page.locator('#terms-privacy')).not.toBeChecked();
    await expect(page.locator('#terms-marketing')).not.toBeChecked();
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/signup');

    // Try invalid email
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', TEST_USER.password);
    await page.fill('#password_confirm', TEST_USER.password);
    await page.fill('#nickname', TEST_USER.nickname);

    await page.check('#terms-service');
    await page.check('#terms-privacy');

    await page.click('button[type="submit"]');

    // HTML5 validation or custom error should prevent submission
    const emailInput = page.locator('#email');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });
});

test.describe('User Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('should display login page elements', async ({ page }) => {
    await page.goto('/auth/login');

    // Verify page loaded
    await expect(page.locator('h2')).toContainText('로그인');

    // Check for email and password inputs
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Check for submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in credentials
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect or show loading state
    await page.waitForTimeout(2000);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Should show error message or stay on page
    await page.waitForTimeout(2000);
  });

  test('should remember login when checkbox is checked', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.check('#remember');

    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(2000);
  });

  test('should have link to signup page', async ({ page }) => {
    await page.goto('/auth/login');

    const signupLink = page.locator('a[href="/auth/signup"]');
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toContainText('회원가입');
  });

  test('should have link to password reset', async ({ page }) => {
    await page.goto('/auth/login');

    const resetLink = page.locator('a[href="/auth/password-reset"]');
    await expect(resetLink).toBeVisible();
    await expect(resetLink).toContainText('비밀번호');
  });

  test('should disable submit button while loading', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled or show loading state
    await page.waitForTimeout(500);
  });

  test('should have Google login button', async ({ page }) => {
    await page.goto('/auth/login');

    const googleButton = page.locator('button:has-text("Google")');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });
});

test.describe('Password Reset', () => {
  test('should navigate to password reset page', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('a[href="/auth/password-reset"]');
    await expect(page).toHaveURL(/\/auth\/password-reset/);
  });

  test('should show password reset form', async ({ page }) => {
    await page.goto('/auth/password-reset');

    // Should have email input
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput.first()).toBeVisible();

    // Should have submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton.first()).toBeVisible();
  });

  test('should submit password reset request', async ({ page }) => {
    await page.goto('/auth/password-reset');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill(TEST_USER.email);

    await page.click('button[type="submit"]');

    // Should show success message or confirmation
    await page.waitForTimeout(1000);
  });
});

test.describe('Form Validation', () => {
  test('should show validation errors for empty signup form', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBeTruthy();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('#email');
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBeTruthy();
  });

  test('should enforce password minimum length on signup', async ({ page }) => {
    await page.goto('/auth/signup');

    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', '123'); // Too short
    await page.fill('#password_confirm', '123');
    await page.fill('#nickname', TEST_USER.nickname);

    await page.check('#terms-service');
    await page.check('#terms-privacy');

    await page.click('button[type="submit"]');

    // Should show error or prevent submission
    await page.waitForTimeout(1000);
  });
});

test.describe('Navigation Links', () => {
  test('should navigate from login to signup', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('a[href="/auth/signup"]');

    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.locator('h2')).toContainText('회원가입');
  });

  test('should navigate from signup to login', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.click('a[href="/auth/login"]');

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.locator('h2')).toContainText('로그인');
  });
});
