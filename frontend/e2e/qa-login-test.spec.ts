import { test, expect } from '@playwright/test'

/**
 * QA Test: Login Functionality with Real Credentials
 * Account: wksun999@hanmail.net
 * Password: TestPass123!
 */

test.describe('QA Login Test - Real Account', () => {
  test('should login with test account wksun999@hanmail.net', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page-initial.png', fullPage: true })

    // Find and fill email field
    const emailField = page.locator('input[type="email"], input[name="email"]')
    await emailField.waitFor({ state: 'visible', timeout: 10000 })
    await emailField.fill('wksun999@hanmail.net')

    // Find and fill password field
    const passwordField = page.locator('input[type="password"], input[name="password"]')
    await passwordField.fill('TestPass123!')

    // Take screenshot before submit
    await page.screenshot({ path: 'login-page-filled.png', fullPage: true })

    // Find and click login button
    const loginButton = page.locator('button[type="submit"]').first()
    await loginButton.click()

    // Wait for navigation or response
    await page.waitForLoadState('networkidle', { timeout: 15000 })

    // Take screenshot after submit
    await page.screenshot({ path: 'login-page-after-submit.png', fullPage: true })

    // Check current URL
    const currentUrl = page.url()
    console.log('Current URL after login:', currentUrl)

    // Check for success indicators
    const hasError = await page.locator('text=/오류|에러|실패|error|invalid/i').isVisible().catch(() => false)
    const isLoggedIn = await page.locator('text=/프로필|대시보드|로그아웃|profile|dashboard|logout/i').isVisible().catch(() => false)

    // Log results
    console.log('Has Error:', hasError)
    console.log('Is Logged In:', isLoggedIn)

    // Assertions
    if (hasError) {
      const errorText = await page.locator('text=/오류|에러|실패|error|invalid/i').first().textContent()
      console.log('Error message:', errorText)
    }

    // Login should succeed (no error and user is logged in)
    expect(hasError).toBe(false)
    expect(isLoggedIn || currentUrl.includes('dashboard') || currentUrl.includes('politicians')).toBe(true)
  })

  test('should verify backend API is accessible', async ({ request }) => {
    // Test signup endpoint
    const signupResponse = await request.post('http://localhost:8000/api/v1/auth/login', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        email: 'wksun999@hanmail.net',
        password: 'TestPass123!'
      }
    })

    console.log('Backend login status:', signupResponse.status())
    const responseBody = await signupResponse.json()
    console.log('Backend response:', JSON.stringify(responseBody, null, 2))

    expect(signupResponse.status()).toBe(200)
    expect(responseBody).toHaveProperty('access_token')
    expect(responseBody).toHaveProperty('refresh_token')
  })
})
