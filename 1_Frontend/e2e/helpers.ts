// Task: P5T2
// E2E Test Helpers and Utilities
// ‘Å|: 2025-11-10
// $…: E2E L¤¸Ð õµ<\ ¬©” ì| hä

import { Page, expect } from '@playwright/test';

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 3000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Login helper
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.fill('#email, input[type="email"]', email);
  await page.fill('#password, input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  const logoutButton = page.locator('button:has-text("\øDÃ"), a:has-text("\øDÃ")').first();
  if (await logoutButton.count() > 0) {
    await logoutButton.click();
    await page.waitForTimeout(1000);
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(c => c.name.includes('session') || c.name.includes('auth'));
}

/**
 * Clear all cookies and storage
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

/**
 * Safe click - click only if element exists
 */
export async function safeClick(page: Page, selector: string): Promise<boolean> {
  if (await elementExists(page, selector)) {
    await page.click(selector);
    return true;
  }
  return false;
}

/**
 * Safe fill - fill only if element exists
 */
export async function safeFill(page: Page, selector: string, value: string): Promise<boolean> {
  if (await elementExists(page, selector)) {
    await page.fill(selector, value);
    return true;
  }
  return false;
}

/**
 * Get text content safely
 */
export async function getTextContent(page: Page, selector: string): Promise<string | null> {
  if (await elementExists(page, selector)) {
    return await page.locator(selector).first().textContent();
  }
  return null;
}

/**
 * Navigate and wait
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await waitForNetworkIdle(page);
}

/**
 * Accept cookies/privacy notice if exists
 */
export async function acceptCookieNotice(page: Page) {
  const cookieButton = page.locator('button:has-text("ÙX"), button:has-text("Accept")').first();
  if (await cookieButton.count() > 0) {
    await cookieButton.click();
  }
}

/**
 * Close modal/dialog if exists
 */
export async function closeModal(page: Page) {
  const closeButton = page.locator('[role="dialog"] button:has-text("ë0"), [role="dialog"] button:has-text("×")').first();
  if (await closeButton.count() > 0) {
    await closeButton.click();
  }
}

/**
 * Generate unique email for testing
 */
export function generateTestEmail(prefix = 'test'): string {
  return `${prefix}.${Date.now()}@example.com`;
}

/**
 * Generate unique username for testing
 */
export function generateTestUsername(prefix = 'user'): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * Scroll to bottom of page
 */
export async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}

/**
 * Check if page has error
 */
export async function hasPageError(page: Page): Promise<boolean> {
  const errorElements = page.locator('.error, [role="alert"], .text-red-500, .text-red-700');
  return (await errorElements.count()) > 0;
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, urlPattern: string, timeout = 5000) {
  return await page.waitForResponse(
    response => response.url().includes(urlPattern),
    { timeout }
  ).catch(() => null);
}

/**
 * Mock API response
 */
export async function mockApiResponse(page: Page, urlPattern: string, responseData: any) {
  await page.route(`**/${urlPattern}`, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}
