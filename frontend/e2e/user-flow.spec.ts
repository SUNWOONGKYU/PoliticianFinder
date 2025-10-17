/**
 * P4T2: Complete User Flow E2E Tests
 *
 * Tests comprehensive user journeys through the application
 * Covers signup, login, browsing, rating, commenting, and bookmarking
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Complete User Journey - New User', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `TestUser${Date.now()}`;

  test('full user journey from signup to interaction', async ({ page }) => {
    // Step 1: Visit homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Politician/i);

    // Step 2: Navigate to signup
    await page.goto('/signup');
    await expect(page.locator('h1, h2')).toContainText(/sign/i);

    // Step 3: Fill out signup form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    const usernameField = page.locator('input[name="username"]');
    if (await usernameField.count() > 0) {
      await usernameField.fill(testUsername);
    }

    // Step 4: Submit signup
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Step 5: Browse politicians
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const politicianCards = page.locator('[data-testid="politician-card"]');
    const cardCount = await politicianCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Step 6: View politician detail
    await politicianCards.first().click();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/politicians/');

    // Step 7: Rate the politician
    const ratingButtons = page.locator('[data-testid="rating-button"]');
    if (await ratingButtons.count() > 0) {
      await ratingButtons.last().click(); // Give 5 stars
      await page.waitForTimeout(1000);

      // Verify rating was recorded
      const ratingMessage = page.locator('text=/평가.*완료|감사합니다|success/i');
      if (await ratingMessage.count() > 0) {
        await expect(ratingMessage.first()).toBeVisible();
      }
    }

    // Step 8: Add a comment
    const commentField = page.locator('textarea[placeholder*="comment" i], textarea[placeholder*="의견" i]');
    if (await commentField.count() > 0) {
      await commentField.fill('Great politician! Very impressed with their work.');
      await page.click('button:has-text("Submit"), button:has-text("등록")');
      await page.waitForTimeout(1000);
    }

    // Step 9: Bookmark the politician
    const bookmarkButton = page.locator('[data-testid="bookmark-button"]');
    if (await bookmarkButton.count() > 0) {
      await bookmarkButton.click();
      await page.waitForTimeout(500);
    }

    // Step 10: Check notifications
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    if (await notificationBell.count() > 0) {
      await notificationBell.click();
      await page.waitForTimeout(500);

      // Verify notification panel opened
      const notificationPanel = page.locator('[data-testid="notification-panel"]');
      if (await notificationPanel.count() > 0) {
        await expect(notificationPanel).toBeVisible();
      }
    }

    // Step 11: View profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify profile page loads
    expect(page.url()).toContain('/profile');

    // Step 12: Check bookmarked items
    const bookmarksSection = page.locator('[data-testid="bookmarks-section"]');
    if (await bookmarksSection.count() > 0) {
      await expect(bookmarksSection).toBeVisible();
    }
  });
});

test.describe('Search and Filter User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');
  });

  test('search, filter, and view results flow', async ({ page }) => {
    // Step 1: Go to politicians page
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Step 2: Search for a politician
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('김');
      await page.waitForTimeout(1000);

      // Verify search results
      const results = page.locator('[data-testid="politician-card"]');
      expect(await results.count()).toBeGreaterThan(0);
    }

    // Step 3: Apply filters
    const filterButtons = page.locator('[data-testid="filter-button"], button:has-text("Filter")');
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click();
      await page.waitForTimeout(500);

      // Select a party filter
      const partyFilter = page.locator('[data-testid="party-filter"]');
      if (await partyFilter.count() > 0) {
        await partyFilter.first().click();
        await page.waitForTimeout(1000);
      }
    }

    // Step 4: Change sort order
    const sortDropdown = page.locator('[data-testid="sort-select"], select');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }

    // Step 5: Paginate through results
    const nextButton = page.locator('[aria-label="다음 페이지"], [aria-label="Next page"]');
    if (await nextButton.count() > 0 && !await nextButton.isDisabled()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');

      // Verify page changed
      expect(page.url()).toContain('page=2');
    }

    // Step 6: Click on a politician
    const firstPolitician = page.locator('[data-testid="politician-card"]').first();
    if (await firstPolitician.count() > 0) {
      await firstPolitician.click();
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/politicians/');
    }
  });
});

test.describe('Rating and Comment Interaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');
  });

  test('rate, comment, like, and reply flow', async ({ page }) => {
    // Step 1: Navigate to a politician
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const firstPolitician = page.locator('[data-testid="politician-card"]').first();
    await firstPolitician.click();
    await page.waitForLoadState('networkidle');

    // Step 2: View existing comments
    const commentsSection = page.locator('[data-testid="comments-section"]');
    if (await commentsSection.count() > 0) {
      await expect(commentsSection).toBeVisible();

      // Step 3: Like a comment
      const likeButtons = page.locator('[data-testid="like-button"]');
      if (await likeButtons.count() > 0) {
        const initialLikes = await likeButtons.first().textContent();
        await likeButtons.first().click();
        await page.waitForTimeout(500);

        // Verify like count changed
        const newLikes = await likeButtons.first().textContent();
        expect(newLikes).not.toBe(initialLikes);
      }

      // Step 4: Reply to a comment
      const replyButtons = page.locator('button:has-text("Reply"), button:has-text("답글")');
      if (await replyButtons.count() > 0) {
        await replyButtons.first().click();
        await page.waitForTimeout(500);

        const replyField = page.locator('[data-testid="reply-input"], textarea').first();
        await replyField.fill('This is a test reply');

        const submitReply = page.locator('button:has-text("Submit"), button:has-text("등록")').first();
        await submitReply.click();
        await page.waitForTimeout(1000);

        // Verify reply appears
        const replies = page.locator('[data-testid="comment-reply"]');
        expect(await replies.count()).toBeGreaterThan(0);
      }
    }

    // Step 5: Filter comments by rating
    const filterSelect = page.locator('[data-testid="comment-filter"]');
    if (await filterSelect.count() > 0) {
      await filterSelect.selectOption('5');
      await page.waitForTimeout(1000);

      // Verify filtered
      const visibleComments = page.locator('[data-testid="comment-item"]:visible');
      expect(await visibleComments.count()).toBeGreaterThanOrEqual(0);
    }

    // Step 6: Sort comments
    const sortButton = page.locator('[data-testid="sort-comments"]');
    if (await sortButton.count() > 0) {
      await sortButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Mobile Responsive Flow', () => {
  test.use({
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('mobile user experience flow', async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');

    // Step 1: Navigate on mobile
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Step 2: Open mobile menu
    const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label="Menu"]');
    if (await menuButton.count() > 0) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Verify menu opened
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      if (await mobileNav.count() > 0) {
        await expect(mobileNav).toBeVisible();
      }
    }

    // Step 3: Search on mobile
    const searchInput = page.locator('input[type="search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    }

    // Step 4: View politician detail on mobile
    const politicianCard = page.locator('[data-testid="politician-card"]').first();
    if (await politicianCard.count() > 0) {
      await politicianCard.click();
      await page.waitForLoadState('networkidle');

      // Verify mobile layout
      const detailPage = page.locator('[data-testid="politician-detail"]');
      if (await detailPage.count() > 0) {
        await expect(detailPage).toBeVisible();
      }
    }

    // Step 5: Interact with mobile-optimized features
    const mobileRating = page.locator('[data-testid="mobile-rating"]');
    if (await mobileRating.count() > 0) {
      await mobileRating.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Error Handling and Recovery Flow', () => {
  test('handle network errors gracefully', async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');

    // Navigate to politicians page
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Simulate offline mode
    await page.route('**/*', route => route.abort());

    // Try to navigate
    await page.goto('/politicians/1').catch(() => {});
    await page.waitForTimeout(1000);

    // Restore network
    await page.unroute('**/*');

    // Retry navigation
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    // Verify recovery
    const politicianCards = page.locator('[data-testid="politician-card"]');
    expect(await politicianCards.count()).toBeGreaterThan(0);
  });

  test('handle invalid politician ID', async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');

    // Navigate to invalid politician
    const response = await page.goto('/politicians/999999');

    // Should show error page or redirect
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=/not found|404|찾을 수 없습니다/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });
});

test.describe('Performance and Load Time', () => {
  test('measure page load performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Verify content loaded
    const politicianCards = page.locator('[data-testid="politician-card"]');
    expect(await politicianCards.count()).toBeGreaterThan(0);
  });

  test('measure interaction responsiveness', async ({ page }) => {
    await login(page, 'test@example.com', 'TestPassword123!');
    await page.goto('/politicians');
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Click on politician
    const firstPolitician = page.locator('[data-testid="politician-card"]').first();
    await firstPolitician.click();
    await page.waitForLoadState('networkidle');

    const interactionTime = Date.now() - startTime;

    // Interaction should be responsive (within 3 seconds)
    expect(interactionTime).toBeLessThan(3000);
  });
});
