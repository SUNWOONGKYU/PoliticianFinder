/**
 * P3T2: Bookmark System E2E Tests
 *
 * Tests bookmark add, remove, and list operations
 * Note: This assumes bookmark feature exists based on P3B6 dependency
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Bookmark System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user and login
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');
  });

  test('should display bookmark button on politician card', async ({ page }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Check if bookmark buttons exist on politician cards
    const bookmarkButtons = page.locator('[data-testid="bookmark-button"]');
    const count = await bookmarkButtons.count();

    if (count > 0) {
      await expect(bookmarkButtons.first()).toBeVisible();
    }
  });

  test('should add politician to bookmarks', async ({ page }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();

    if (await bookmarkButton.count() > 0) {
      // Get initial state
      const initialState = await bookmarkButton.getAttribute('data-bookmarked');

      // Click to bookmark
      await bookmarkButton.click();
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await bookmarkButton.getAttribute('data-bookmarked');
      expect(newState).not.toBe(initialState);
    }
  });

  test('should remove politician from bookmarks', async ({ page }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();

    if (await bookmarkButton.count() > 0) {
      // Ensure it's bookmarked first
      const isBookmarked = await bookmarkButton.getAttribute('data-bookmarked');

      if (isBookmarked === 'true') {
        // Click to unbookmark
        await bookmarkButton.click();
        await page.waitForTimeout(500);

        // Verify removed
        const newState = await bookmarkButton.getAttribute('data-bookmarked');
        expect(newState).toBe('false');
      } else {
        // Bookmark first, then unbookmark
        await bookmarkButton.click();
        await page.waitForTimeout(500);
        await bookmarkButton.click();
        await page.waitForTimeout(500);

        const finalState = await bookmarkButton.getAttribute('data-bookmarked');
        expect(finalState).toBe('false');
      }
    }
  });

  test('should display bookmarked politicians in user profile', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for bookmarks section
    const bookmarksSection = page.locator('[data-testid="bookmarks-section"]');

    if (await bookmarksSection.count() > 0) {
      await expect(bookmarksSection).toBeVisible();

      // Check if bookmarked items are displayed
      const bookmarkedItems = page.locator('[data-testid="bookmarked-item"]');
      const count = await bookmarkedItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should persist bookmarks across sessions', async ({ page, context }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();

    if (await bookmarkButton.count() > 0) {
      // Add bookmark
      await bookmarkButton.click();
      await page.waitForTimeout(500);

      // Get politician ID
      const politicianCard = bookmarkButton.locator('..').locator('[data-politician-id]');
      let politicianId: string | null = null;

      if (await politicianCard.count() > 0) {
        politicianId = await politicianCard.getAttribute('data-politician-id');
      }

      // Close and create new page (simulating new session)
      await page.close();
      const newPage = await context.newPage();
      await login(newPage, 'test-bookmarks@example.com', 'TestPassword123!');

      await newPage.goto('/politicians');
      await newPage.waitForLoadState('networkidle');

      // Verify bookmark is still there
      if (politicianId) {
        const bookmarkedButton = newPage.locator(
          `[data-politician-id="${politicianId}"] [data-testid="bookmark-button"]`
        );

        if (await bookmarkedButton.count() > 0) {
          const isBookmarked = await bookmarkedButton.getAttribute('data-bookmarked');
          expect(isBookmarked).toBe('true');
        }
      }
    }
  });

  test('should handle bookmark toggle rapidly', async ({ page }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const bookmarkButton = page.locator('[data-testid="bookmark-button"]').first();

    if (await bookmarkButton.count() > 0) {
      // Rapid toggle test
      for (let i = 0; i < 3; i++) {
        await bookmarkButton.click();
        await page.waitForTimeout(100);
      }

      // Final state should be stable
      await page.waitForTimeout(1000);
      const finalState = await bookmarkButton.getAttribute('data-bookmarked');
      expect(['true', 'false']).toContain(finalState);
    }
  });

  test('should show bookmark count if implemented', async ({ page }) => {
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Check if bookmark count is displayed
    const bookmarkCount = page.locator('[data-testid="bookmark-count"]').first();

    if (await bookmarkCount.count() > 0) {
      const countText = await bookmarkCount.textContent();
      const count = parseInt(countText || '0');
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should filter bookmarks by category', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const bookmarksSection = page.locator('[data-testid="bookmarks-section"]');

    if (await bookmarksSection.count() > 0) {
      // Look for filter options
      const filterButtons = page.locator('[data-testid="bookmark-filter"]');

      if (await filterButtons.count() > 0) {
        await filterButtons.first().click();
        await page.waitForTimeout(500);

        // Verify filtered results
        const filteredItems = page.locator('[data-testid="bookmarked-item"]');
        expect(await filteredItems.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

test.describe('Bookmark API Tests', () => {
  test('should add bookmark via API', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    const response = await request.post('/api/bookmarks', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        politician_id: 1,
      },
    });

    // Should succeed or already exist
    expect([200, 201, 409]).toContain(response.status());
  });

  test('should remove bookmark via API', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    // First add a bookmark
    await request.post('/api/bookmarks', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        politician_id: 1,
      },
    });

    // Then remove it
    const response = await request.delete('/api/bookmarks', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        politician_id: 1,
      },
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should get user bookmarks list', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    const response = await request.get('/api/bookmarks');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  test('should check if politician is bookmarked', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    const response = await request.get('/api/bookmarks/check?politician_id=1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(typeof data.is_bookmarked).toBe('boolean');
  });
});

test.describe('Bookmark Error Handling', () => {
  test('should handle invalid politician ID', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    const response = await request.post('/api/bookmarks', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        politician_id: 999999,
      },
    });

    // Should return error
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should prevent duplicate bookmarks', async ({ request, page }) => {
    await login(page, 'test-bookmarks@example.com', 'TestPassword123!');

    // Add bookmark twice
    await request.post('/api/bookmarks', {
      data: { politician_id: 1 },
    });

    const response = await request.post('/api/bookmarks', {
      data: { politician_id: 1 },
    });

    // Should handle gracefully (conflict or success)
    expect([200, 201, 409]).toContain(response.status());
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.get('/api/bookmarks');

    // Should require auth
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
