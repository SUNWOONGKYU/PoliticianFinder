import { test, expect } from '@playwright/test';

test.describe('Final Scenario Testing', () => {
  test.describe('User Authentication Flow', () => {
    test('complete registration and login cycle', async ({ page }) => {
      // Visit homepage
      await page.goto('/');
      await expect(page).toHaveTitle(/PoliticianFinder/);

      // Navigate to signup
      await page.click('text=Sign Up');
      await expect(page).toHaveURL(/.*signup/);

      // Fill registration form
      const timestamp = Date.now();
      await page.fill('input[name="email"]', `test${timestamp}@example.com`);
      await page.fill('input[name="password"]', 'SecurePassword123!');
      await page.fill('input[name="name"]', 'Test User');

      // Submit registration
      await page.click('button[type="submit"]');

      // Should redirect or show success message
      await expect(page.locator('text=/success|verify/i')).toBeVisible({ timeout: 5000 });
    });

    test('password reset flow', async ({ page }) => {
      await page.goto('/auth/password-reset');

      // Enter email
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('text=/sent|check/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Beta Tester Invitation', () => {
    test('beta signup with valid code', async ({ page }) => {
      await page.goto('/beta-signup');

      // Enter invite code
      await page.fill('input[name="inviteCode"]', 'TESTCODE');
      await page.click('button[type="submit"]');

      // Should verify or show error
      await page.waitForSelector('[role="alert"]', { timeout: 5000 });
    });
  });

  test.describe('Politician Search & Filter', () => {
    test('search with filters and view profile', async ({ page }) => {
      await page.goto('/politicians');

      // Apply filters
      await page.click('text=/Filter/i');
      await page.click('text=/Party/i');

      // Wait for results
      await page.waitForSelector('[data-testid="politician-card"]', { timeout: 5000 });

      // Click first result
      const firstCard = page.locator('[data-testid="politician-card"]').first();
      await firstCard.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/.*politicians\/\d+/);
    });
  });

  test.describe('Rating & Review System', () => {
    test('submit and manage review', async ({ page, context }) => {
      // Mock authentication
      await context.addCookies([
        {
          name: 'auth-token',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/politicians/1');

      // Submit rating
      await page.click('[data-testid="star-5"]');
      await page.fill('textarea[name="review"]', 'Great politician!');
      await page.click('button[type="submit"]');

      // Should show success
      await expect(page.locator('text=/success/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Bookmark Functionality', () => {
    test('bookmark and unbookmark politician', async ({ page, context }) => {
      // Mock authentication
      await context.addCookies([
        {
          name: 'auth-token',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/politicians/1');

      // Click bookmark
      await page.click('[data-testid="bookmark-button"]');
      await expect(page.locator('[data-testid="bookmark-button"][data-bookmarked="true"]')).toBeVisible();

      // Navigate to bookmarks
      await page.goto('/profile/bookmarks');
      await expect(page.locator('[data-testid="politician-card"]')).toHaveCount(1);
    });
  });

  test.describe('Comment & Reply System', () => {
    test('post comment and reply', async ({ page, context }) => {
      // Mock authentication
      await context.addCookies([
        {
          name: 'auth-token',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/politicians/1');

      // Post comment
      await page.fill('textarea[name="comment"]', 'This is a test comment');
      await page.click('button:has-text("Post Comment")');

      // Should appear in list
      await expect(page.locator('text=This is a test comment')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('mobile navigation and functionality', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/');

      // Check mobile menu
      await page.click('[data-testid="mobile-menu-button"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

      // Navigate to politicians
      await page.click('text=Politicians');
      await expect(page).toHaveURL(/.*politicians/);

      // Cards should be stacked
      const cards = page.locator('[data-testid="politician-card"]');
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
      }
    });
  });

  test.describe('Performance Testing', () => {
    test('page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('API response time', async ({ page }) => {
      await page.goto('/politicians');

      const response = await page.waitForResponse(
        (response) => response.url().includes('/api/politicians'),
        { timeout: 5000 }
      );

      const timing = response.timing();
      expect(timing.responseEnd - timing.requestStart).toBeLessThan(500);
    });
  });

  test.describe('Security Testing', () => {
    test('protected routes require authentication', async ({ page }) => {
      await page.goto('/profile');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('XSS protection in comments', async ({ page, context }) => {
      await context.addCookies([
        {
          name: 'auth-token',
          value: 'mock-token',
          domain: 'localhost',
          path: '/',
        },
      ]);

      await page.goto('/politicians/1');

      // Try to inject script
      await page.fill('textarea[name="comment"]', '<script>alert("XSS")</script>');
      await page.click('button:has-text("Post Comment")');

      // Script should be sanitized
      const comment = page.locator('[data-testid="comment"]').first();
      const html = await comment.innerHTML();
      expect(html).not.toContain('<script>');
    });
  });

  test.describe('Error Handling', () => {
    test('404 page displays', async ({ page }) => {
      await page.goto('/non-existent-page');
      await expect(page.locator('text=/404|not found/i')).toBeVisible();
    });

    test('network error handling', async ({ page, context }) => {
      // Block API calls
      await context.route('**/api/**', (route) => route.abort());

      await page.goto('/politicians');

      // Should show error message
      await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Accessibility Testing', () => {
    test('keyboard navigation', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();

      // Should be able to activate with Enter
      await page.keyboard.press('Enter');
    });

    test('proper ARIA labels', async ({ page }) => {
      await page.goto('/politicians');

      // Check for ARIA labels
      const searchButton = page.locator('button:has-text("Search")');
      const ariaLabel = await searchButton.getAttribute('aria-label');
      expect(ariaLabel || await searchButton.textContent()).toBeTruthy();
    });
  });
});
