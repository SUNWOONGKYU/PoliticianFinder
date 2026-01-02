const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';

const viewports = [
  { name: 'PC', width: 1280, height: 720 },
  { name: 'Mobile', width: 390, height: 844 }
];

const testResults = [];

test.describe('PoliticianFinder Admin Pages Test', () => {

  for (const viewport of viewports) {
    test.describe(`${viewport.name} (${viewport.width}px)`, () => {

      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      // Test 1: Admin Login Page
      test('Admin Login Page - Form Display', async ({ page }) => {
        const result = {
          viewport: viewport.name,
          page: 'Admin Login (/admin/login)',
          accessible: false,
          uiElements: [],
          notes: ''
        };

        try {
          const response = await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
          result.accessible = response.ok();

          // Check for login form elements
          const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
          const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
          const loginButton = await page.locator('button:has-text("로그인"), button:has-text("Login")').count();

          if (emailInput > 0) result.uiElements.push('Email input');
          if (passwordInput > 0) result.uiElements.push('Password input');
          if (loginButton > 0) result.uiElements.push('Login button');

          result.notes = `Status: ${response.status()}, Elements found: ${result.uiElements.length}`;

          // Take screenshot
          await page.screenshot({ path: `tests/screenshots/admin-login-${viewport.name.toLowerCase()}.png`, fullPage: true });

        } catch (error) {
          result.notes = `Error: ${error.message}`;
        }

        testResults.push(result);
      });

      // Test 2: Footer Admin Link
      test('Footer Admin Link - PC vs Mobile', async ({ page }) => {
        const result = {
          viewport: viewport.name,
          page: 'Footer Admin Link',
          accessible: true,
          uiElements: [],
          notes: ''
        };

        try {
          await page.goto(BASE_URL, { waitUntil: 'networkidle' });

          // Check for footer
          const footer = await page.locator('footer').count();
          if (footer > 0) result.uiElements.push('Footer exists');

          // Check for admin link in footer
          const adminLink = await page.locator('footer a:has-text("Admin"), footer a[href*="admin"]').count();

          if (viewport.name === 'PC') {
            if (adminLink > 0) {
              result.uiElements.push('Admin link visible');
              result.notes = 'Admin link should be visible on PC';
            } else {
              result.notes = 'WARNING: Admin link not found on PC';
            }
          } else {
            if (adminLink === 0) {
              result.uiElements.push('Admin link hidden');
              result.notes = 'Admin link correctly hidden on mobile';
            } else {
              result.notes = 'WARNING: Admin link visible on mobile (should be hidden)';
            }
          }

          await page.screenshot({ path: `tests/screenshots/footer-${viewport.name.toLowerCase()}.png`, fullPage: true });

        } catch (error) {
          result.notes = `Error: ${error.message}`;
        }

        testResults.push(result);
      });

      // Test 3: Notices List Page
      test('Notices List Page - Display', async ({ page }) => {
        const result = {
          viewport: viewport.name,
          page: 'Notices List (/notices)',
          accessible: false,
          uiElements: [],
          notes: ''
        };

        try {
          const response = await page.goto(`${BASE_URL}/notices`, { waitUntil: 'networkidle' });
          result.accessible = response.ok();

          // Check for notices list elements
          const title = await page.locator('h1, h2').filter({ hasText: /공지|Notice/i }).count();
          const noticeItems = await page.locator('[class*="notice"], [class*="card"], article, li').count();

          if (title > 0) result.uiElements.push('Page title');
          if (noticeItems > 0) result.uiElements.push(`${noticeItems} list items`);

          result.notes = `Status: ${response.status()}, Items: ${noticeItems}`;

          await page.screenshot({ path: `tests/screenshots/notices-list-${viewport.name.toLowerCase()}.png`, fullPage: true });

        } catch (error) {
          result.notes = `Error: ${error.message}`;
        }

        testResults.push(result);
      });

      // Test 4: Notice Detail Page
      test('Notice Detail Page - Content Display', async ({ page }) => {
        const result = {
          viewport: viewport.name,
          page: 'Notice Detail (/notices/[id])',
          accessible: false,
          uiElements: [],
          notes: ''
        };

        try {
          // Try to access a notice detail page (using ID 1 as example)
          const response = await page.goto(`${BASE_URL}/notices/1`, { waitUntil: 'networkidle' });
          result.accessible = response.ok();

          // Check for detail page elements
          const title = await page.locator('h1, h2').count();
          const content = await page.locator('article, [class*="content"], main').count();
          const backButton = await page.locator('a:has-text("목록"), button:has-text("Back")').count();

          if (title > 0) result.uiElements.push('Title');
          if (content > 0) result.uiElements.push('Content area');
          if (backButton > 0) result.uiElements.push('Back button');

          result.notes = `Status: ${response.status()}, Elements: ${result.uiElements.length}`;

          await page.screenshot({ path: `tests/screenshots/notice-detail-${viewport.name.toLowerCase()}.png`, fullPage: true });

        } catch (error) {
          result.notes = `Error: ${error.message}`;
        }

        testResults.push(result);
      });

    });
  }

  test.afterAll(async () => {
    // Print results summary
    console.log('\n\n=== TEST RESULTS SUMMARY ===\n');
    console.log(JSON.stringify(testResults, null, 2));
  });

});
