/**
 * Authentication Helpers for E2E Tests
 *
 * This module provides helper functions for authentication operations
 * in end-to-end tests, including login, logout, and session management.
 */

import { Page, expect } from '@playwright/test'

/**
 * Test user credentials
 */
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  username: 'testuser',
}

/**
 * Login helper - performs login using email and password
 *
 * @param page - Playwright page object
 * @param email - User email (defaults to TEST_USER.email)
 * @param password - User password (defaults to TEST_USER.password)
 */
export async function login(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password
) {
  // Navigate to login page
  await page.goto('/login')

  // Fill in login form
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 })

  // Verify login was successful by checking for user menu or authenticated state
  // This might need adjustment based on your actual UI
  await page.waitForSelector('[data-testid="user-menu"], .user-profile, header', { timeout: 5000 })
}

/**
 * Login with Google OAuth (mocked for testing)
 *
 * @param page - Playwright page object
 */
export async function loginWithGoogle(page: Page) {
  await page.goto('/login')

  // Click Google login button
  await page.click('text=Google로 로그인')

  // In a real test, you would need to handle OAuth flow
  // For now, we'll assume it redirects back with a valid session
  await page.waitForURL('/', { timeout: 15000 })
}

/**
 * Logout helper - performs logout operation
 *
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click on user menu or profile dropdown
  const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("로그아웃")')

  if (await userMenu.count() > 0) {
    await userMenu.first().click()

    // Click logout button
    const logoutButton = page.locator('button:has-text("로그아웃"), a:has-text("로그아웃")')
    if (await logoutButton.count() > 0) {
      await logoutButton.first().click()
    }
  }

  // Wait for redirect to home or login page
  await page.waitForTimeout(1000)
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright page object
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for authenticated state indicators
    const authIndicator = await page.locator('[data-testid="user-menu"], .user-profile, button:has-text("로그아웃")').count()
    return authIndicator > 0
  } catch {
    return false
  }
}

/**
 * Setup authenticated session using API
 * This is faster than going through the UI for tests that need authentication
 *
 * @param page - Playwright page object
 */
export async function setupAuthenticatedSession(page: Page) {
  // Option 1: Use storage state (recommended for speed)
  const authState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: 'auth-storage',
            value: JSON.stringify({
              state: {
                user: {
                  id: 1,
                  email: TEST_USER.email,
                  username: TEST_USER.username,
                  full_name: 'Test User',
                  bio: null,
                  avatar_url: null,
                  is_active: true,
                  is_verified: true,
                },
                accessToken: 'test-access-token',
                refreshToken: 'test-refresh-token',
                isAuthenticated: true,
              },
            }),
          },
        ],
      },
    ],
  }

  // This is a placeholder - in a real scenario, you'd need to:
  // 1. Make an API call to get a real token
  // 2. Or use Playwright's context.addCookies() to set auth cookies

  // For now, we'll use the UI login method
  await login(page)
}

/**
 * Wait for authentication state to be ready
 *
 * @param page - Playwright page object
 */
export async function waitForAuthReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500) // Give time for auth state to initialize
}

/**
 * Create a test user (for setup)
 * This would typically hit your API to create a user for testing
 *
 * @param page - Playwright page object
 * @param userData - User data to create
 */
export async function createTestUser(
  page: Page,
  userData = TEST_USER
) {
  // Navigate to signup page
  await page.goto('/signup')

  // Fill in signup form
  await page.fill('input[name="email"]', userData.email)
  await page.fill('input[name="username"]', userData.username)
  await page.fill('input[name="password"]', userData.password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for redirect after successful signup
  await page.waitForURL('/', { timeout: 10000 })
}

/**
 * Delete test user (for cleanup)
 * This would typically hit your API to delete the test user
 *
 * @param email - Email of user to delete
 */
export async function deleteTestUser(email: string = TEST_USER.email) {
  // This would be implemented based on your API
  // For now, it's a placeholder
  console.log(`Would delete user: ${email}`)
}
