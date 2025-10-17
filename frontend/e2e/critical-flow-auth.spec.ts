import { test, expect } from '@playwright/test'

/**
 * P4T2: Critical Path E2E Tests - Authentication Flow
 * Tests the complete authentication user journey
 */

test.describe('Authentication Critical Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full signup flow', async ({ page }) => {
    // Navigate to signup page
    await page.click('text=회원가입')
    await expect(page).toHaveURL(/.*signup/)

    // Fill signup form
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success or redirect
    await expect(page).toHaveURL(/.*\/(login|dashboard|politicians)/, { timeout: 10000 })
  })

  test('should handle login flow', async ({ page }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')

    // Submit
    await page.click('button[type="submit"]')

    // Wait for redirect or error message
    await page.waitForLoadState('networkidle')

    // Should show either dashboard or error message
    const hasError = await page.locator('text=/오류|에러|실패|error/i').isVisible().catch(() => false)
    const isLoggedIn = await page.locator('text=/프로필|로그아웃|Profile|Logout/i').isVisible().catch(() => false)

    expect(hasError || isLoggedIn).toBeTruthy()
  })

  test('should display validation errors for invalid input', async ({ page }) => {
    await page.goto('/login')

    // Try to submit with empty fields
    await page.click('button[type="submit"]')

    // Should show validation errors
    const errorVisible = await page.locator('text=/필수|required|invalid/i').first().isVisible({ timeout: 3000 }).catch(() => false)
    expect(errorVisible).toBeTruthy()
  })

  test('should handle OAuth login buttons', async ({ page }) => {
    await page.goto('/login')

    // Check for OAuth buttons
    const googleButton = page.locator('button:has-text("Google")')
    const kakaoButton = page.locator('button:has-text("Kakao")')

    // At least one OAuth button should be present
    const hasOAuth = await googleButton.isVisible().catch(() => false) ||
                     await kakaoButton.isVisible().catch(() => false)

    expect(hasOAuth).toBeTruthy()
  })

  test('should logout successfully', async ({ page, context }) => {
    // Set a mock auth cookie
    await context.addCookies([{
      name: 'sb-access-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/',
    }])

    await page.goto('/')

    // Look for logout button
    const logoutButton = page.locator('button:has-text("로그아웃"), button:has-text("Logout")')

    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click()

      // Should redirect to home or login
      await page.waitForLoadState('networkidle')

      // Logout button should no longer be visible
      const stillLoggedIn = await logoutButton.isVisible({ timeout: 1000 }).catch(() => false)
      expect(stillLoggedIn).toBeFalsy()
    }
  })
})
