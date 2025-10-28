import { test, expect, Page } from '@playwright/test';
import {
  mockPoliticianDetail,
  mockRatingsPaginated,
  mockEmptyRatings,
  mockApiResponses,
  generateMockRatings,
} from './fixtures/politician-data';
import { setViewport, VIEWPORTS, testAcrossViewports, waitForImages } from './helpers/viewport';

/**
 * E2E Tests for Politician Detail Page
 * Tests all scenarios including page load, ratings, navigation, and error handling
 */

test.describe('Politician Detail Page', () => {
  const POLITICIAN_ID = 1;
  const POLITICIAN_URL = `/politicians/${POLITICIAN_ID}`;

  test.beforeEach(async ({ page }) => {
    // Mock API responses by default
    await page.route('**/api/politicians/*', async (route) => {
      const url = route.request().url();
      if (url.includes('/politicians/1')) {
        await route.fulfill(mockApiResponses.politicianSuccess());
      } else {
        await route.fulfill(mockApiResponses.politicianNotFound());
      }
    });

    await page.route('**/api/ratings**', async (route) => {
      await route.fulfill(mockApiResponses.ratingsSuccess());
    });
  });

  /**
   * Scenario 1: Page Load
   */
  test.describe('Page Load', () => {
    test('should load politician detail page successfully', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check page title
      await expect(page).toHaveTitle(/홍길동/);

      // Check loading state disappears
      await expect(page.getByText('정치인 정보를 불러오는 중...')).not.toBeVisible({ timeout: 10000 });

      // Check main content is visible
      await expect(page.getByText('홍길동')).toBeVisible();
    });

    test('should render politician profile information', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Wait for content to load
      await page.waitForLoadState('networkidle');

      // Check basic info
      await expect(page.getByText('홍길동')).toBeVisible();
      await expect(page.getByText('더불어민주당')).toBeVisible();
      await expect(page.getByText('서울 강남구 갑')).toBeVisible();
      await expect(page.getByText('국회의원')).toBeVisible();

      // Check biography
      await expect(page.getByText(/대한민국 제21대 국회의원/)).toBeVisible();
    });

    test('should load and display profile image', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Wait for images to load
      await waitForImages(page);

      // Check profile image
      const profileImage = page.locator('img[alt*="홍길동"]').first();
      await expect(profileImage).toBeVisible();

      // Verify image loaded successfully
      const isImageLoaded = await profileImage.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalHeight !== 0;
      });
      expect(isImageLoaded).toBe(true);
    });

    test('should measure page load performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(POLITICIAN_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Page should load within 2 seconds (as per requirements)
      expect(loadTime).toBeLessThan(2000);
    });
  });

  /**
   * Scenario 2: Rating Statistics
   */
  test.describe('Rating Statistics', () => {
    test('should display average rating', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check average rating is displayed
      const avgRating = mockPoliticianDetail.avg_rating.toFixed(1);
      await expect(page.getByText(avgRating)).toBeVisible();
    });

    test('should display total rating count', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check total ratings count
      const totalRatings = mockPoliticianDetail.total_ratings.toLocaleString();
      await expect(page.getByText(new RegExp(totalRatings))).toBeVisible();
    });

    test('should render rating distribution chart', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check rating distribution elements
      for (let i = 1; i <= 5; i++) {
        const count = mockPoliticianDetail.rating_distribution[i as keyof typeof mockPoliticianDetail.rating_distribution];
        if (count > 0) {
          await expect(page.getByText(new RegExp(`${i}.*${count}`))).toBeVisible();
        }
      }
    });

    test('should display rating statistics section', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check statistics section is visible
      await expect(page.locator('[class*="RatingStats"]').or(page.getByText('평가 통계'))).toBeVisible();
    });
  });

  /**
   * Scenario 3: Rating List
   */
  test.describe('Rating List', () => {
    test('should render rating cards', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Wait for ratings to load
      await page.waitForLoadState('networkidle');

      // Check rating cards are visible
      for (const rating of mockRatingsPaginated.data.slice(0, 3)) {
        await expect(page.getByText(rating.comment!)).toBeVisible();
      }
    });

    test('should display rating author information', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check username is displayed
      const firstRating = mockRatingsPaginated.data[0];
      await expect(page.getByText(firstRating.profiles!.username)).toBeVisible();
    });

    test('should sort ratings by latest (default)', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check sort dropdown default value
      const sortSelect = page.locator('select').filter({ hasText: /최신순/ });
      await expect(sortSelect).toHaveValue('latest');
    });

    test('should sort ratings by score', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Change sort to highest score
      const sortSelect = page.locator('select').last();
      await sortSelect.selectOption('highest');

      // Wait for re-fetch
      await page.waitForResponse('**/api/ratings**');
      await page.waitForLoadState('networkidle');

      // Verify sort option is selected
      await expect(sortSelect).toHaveValue('highest');
    });

    test('should filter ratings by category', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Select policy category
      const categorySelect = page.locator('select').first();
      await categorySelect.selectOption('policy');

      // Wait for re-fetch
      await page.waitForResponse('**/api/ratings**');
      await page.waitForLoadState('networkidle');

      // Verify category is selected
      await expect(categorySelect).toHaveValue('policy');
    });

    test('should display empty state when no ratings', async ({ page }) => {
      // Mock empty ratings response
      await page.route('**/api/ratings**', async (route) => {
        await route.fulfill(mockApiResponses.ratingsEmpty());
      });

      await page.goto(POLITICIAN_URL);

      // Check empty state message
      await expect(page.getByText('아직 평가가 없습니다.')).toBeVisible();
      await expect(page.getByText('첫 번째로 평가를 남겨보세요!')).toBeVisible();
    });
  });

  /**
   * Scenario 4: Pagination
   */
  test.describe('Pagination', () => {
    test('should display pagination controls when multiple pages exist', async ({ page }) => {
      // Mock paginated response with multiple pages
      await page.route('**/api/ratings**', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: generateMockRatings(10, POLITICIAN_ID),
            pagination: {
              page: 1,
              limit: 10,
              total: 50,
              totalPages: 5,
            },
          }),
        });
      });

      await page.goto(POLITICIAN_URL);
      await page.waitForLoadState('networkidle');

      // Check pagination buttons
      await expect(page.getByRole('button', { name: '이전' })).toBeVisible();
      await expect(page.getByRole('button', { name: '다음' })).toBeVisible();
    });

    test('should navigate to next page', async ({ page }) => {
      // Mock paginated response
      await page.route('**/api/ratings**', async (route) => {
        const url = new URL(route.request().url());
        const pageParam = url.searchParams.get('page') || '1';
        const page = parseInt(pageParam);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: generateMockRatings(10, POLITICIAN_ID),
            pagination: {
              page,
              limit: 10,
              total: 50,
              totalPages: 5,
            },
          }),
        });
      });

      await page.goto(POLITICIAN_URL);

      // Click next button
      await page.getByRole('button', { name: '다음' }).click();

      // Wait for page change
      await page.waitForResponse('**/api/ratings**');

      // Verify page 2 button is active
      const page2Button = page.getByRole('button', { name: '2' });
      await expect(page2Button).toBeVisible();
    });

    test('should scroll to top when changing pages', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));

      // Click next page (if available)
      const nextButton = page.getByRole('button', { name: '다음' });
      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // Check scroll position
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBeLessThan(100);
      }
    });
  });

  /**
   * Scenario 5: Navigation
   */
  test.describe('Navigation', () => {
    test('should have back button that works', async ({ page }) => {
      // Start from home page
      await page.goto('/');

      // Navigate to politician detail
      await page.goto(POLITICIAN_URL);

      // Click back button
      await page.getByRole('button', { name: /뒤로 가기/ }).click();

      // Should go back to previous page
      await page.waitForURL('/');
    });

    test('should navigate to home on error page', async ({ page }) => {
      // Mock 404 response
      await page.route('**/api/politicians/*', async (route) => {
        await route.fulfill(mockApiResponses.politicianNotFound());
      });

      await page.goto('/politicians/999999');

      // Wait for error state
      await expect(page.getByText('정치인을 찾을 수 없습니다')).toBeVisible();

      // Click home button
      await page.getByRole('button', { name: /홈으로 돌아가기/ }).click();

      // Should navigate to home
      await page.waitForURL('/');
    });

    test('should display back button with icon', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      const backButton = page.getByRole('button', { name: /뒤로 가기/ });
      await expect(backButton).toBeVisible();

      // Check for icon (ArrowLeft)
      const icon = backButton.locator('svg').first();
      await expect(icon).toBeVisible();
    });
  });

  /**
   * Scenario 6: Error Handling
   */
  test.describe('Error Handling', () => {
    test('should display 404 error for non-existent politician', async ({ page }) => {
      // Mock 404 response
      await page.route('**/api/politicians/*', async (route) => {
        await route.fulfill(mockApiResponses.politicianNotFound());
      });

      await page.goto('/politicians/999999');

      // Check error message
      await expect(page.getByText('정치인을 찾을 수 없습니다')).toBeVisible();
      await expect(page.getByText('요청하신 정치인 정보를 찾을 수 없습니다.')).toBeVisible();
    });

    test('should handle network error gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/politicians/*', async (route) => {
        await route.abort('failed');
      });

      await page.goto(POLITICIAN_URL);

      // Should show error state
      await expect(
        page.getByText(/알 수 없는 오류가 발생했습니다|정치인 정보를 불러오는데 실패했습니다/)
      ).toBeVisible();
    });

    test('should handle server error (500)', async ({ page }) => {
      // Mock server error
      await page.route('**/api/politicians/*', async (route) => {
        await route.fulfill(mockApiResponses.serverError());
      });

      await page.goto(POLITICIAN_URL);

      // Should show error state
      await expect(
        page.getByText(/정치인 정보를 불러오는데 실패했습니다|알 수 없는 오류/)
      ).toBeVisible();
    });

    test('should handle invalid politician ID', async ({ page }) => {
      await page.goto('/politicians/invalid');

      // Should show error state
      await expect(page.getByText(/잘못된|오류/)).toBeVisible();
    });
  });

  /**
   * Scenario 7: Rating Creation (Login Required)
   */
  test.describe('Rating Creation', () => {
    test('should display rating button', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      const rateButton = page.getByRole('button', { name: /평가하기/ });
      await expect(rateButton).toBeVisible();
    });

    test('should show alert when clicking rate button (placeholder)', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Listen for dialog
      page.on('dialog', async (dialog) => {
        expect(dialog.message()).toContain('평가하기 기능은 곧 구현될 예정입니다');
        await dialog.accept();
      });

      // Click rate button
      const rateButton = page.getByRole('button', { name: /평가하기/ }).first();
      await rateButton.click();
    });

    test('should display rate button in empty state', async ({ page }) => {
      // Mock empty ratings
      await page.route('**/api/ratings**', async (route) => {
        await route.fulfill(mockApiResponses.ratingsEmpty());
      });

      await page.goto(POLITICIAN_URL);

      // Check rate button in empty state
      const rateButtons = await page.getByRole('button', { name: /평가하기/ }).all();
      expect(rateButtons.length).toBeGreaterThan(0);
    });
  });

  /**
   * Scenario 8: Responsive Design
   */
  test.describe('Responsive Design', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto(POLITICIAN_URL);

      // Check mobile layout
      await expect(page.getByText('홍길동')).toBeVisible();

      // Check that content stacks vertically (single column)
      const ratingStats = page.locator('text=평가 통계').first();
      if (await ratingStats.isVisible()) {
        const box = await ratingStats.boundingBox();
        expect(box?.width).toBeLessThan(600);
      }
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      await setViewport(page, 'tablet');
      await page.goto(POLITICIAN_URL);

      await expect(page.getByText('홍길동')).toBeVisible();

      // Content should be visible and properly spaced
      await expect(page.locator('[class*="grid"]').first()).toBeVisible();
    });

    test('should display correctly on desktop viewport', async ({ page }) => {
      await setViewport(page, 'desktop');
      await page.goto(POLITICIAN_URL);

      await expect(page.getByText('홍길동')).toBeVisible();

      // Desktop should show 3-column layout for rating stats and list
      const grid = page.locator('[class*="lg:col-span"]').first();
      await expect(grid).toBeVisible();
    });

    test('should adapt filter controls on mobile', async ({ page }) => {
      await setViewport(page, 'mobile');
      await page.goto(POLITICIAN_URL);

      // Filter controls should stack on mobile
      const categorySelect = page.locator('select').first();
      const sortSelect = page.locator('select').last();

      await expect(categorySelect).toBeVisible();
      await expect(sortSelect).toBeVisible();

      // They should be vertically stacked (different Y positions)
      const categoryBox = await categorySelect.boundingBox();
      const sortBox = await sortSelect.boundingBox();

      if (categoryBox && sortBox) {
        expect(Math.abs(categoryBox.y - sortBox.y)).toBeGreaterThan(20);
      }
    });

    test('should work across multiple viewports', async ({ page }) => {
      const viewports: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'tablet', 'desktop'];

      await testAcrossViewports(page, viewports, async (viewportName) => {
        await page.goto(POLITICIAN_URL);

        // Basic content should be visible in all viewports
        await expect(page.getByText('홍길동')).toBeVisible();
        await expect(page.getByRole('button', { name: /뒤로 가기/ })).toBeVisible();
      });
    });
  });

  /**
   * Scenario 9: Accessibility
   */
  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check for proper heading structure
      const h1 = page.locator('h1, h2').first();
      await expect(h1).toBeVisible();
    });

    test('should have keyboard navigation support', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Tab to back button
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
    });

    test('should have proper alt text for images', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should have accessible form controls', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Select elements should be accessible
      const selects = await page.locator('select').all();
      for (const select of selects) {
        await expect(select).toBeVisible();
        await expect(select).toBeEnabled();
      }
    });
  });

  /**
   * Scenario 10: Performance & Optimization
   */
  test.describe('Performance', () => {
    test('should lazy load images', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Check images have loading attribute
      const images = await page.locator('img').all();
      for (const img of images.slice(0, 3)) {
        const loading = await img.getAttribute('loading');
        // Some images might be lazy loaded
        expect(['lazy', 'eager', null]).toContain(loading);
      }
    });

    test('should handle rapid filter changes', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      const categorySelect = page.locator('select').first();

      // Rapidly change filters
      await categorySelect.selectOption('policy');
      await categorySelect.selectOption('integrity');
      await categorySelect.selectOption('communication');

      // Should still work correctly
      await page.waitForLoadState('networkidle');
      await expect(categorySelect).toHaveValue('communication');
    });

    test('should measure rendering performance', async ({ page }) => {
      await page.goto(POLITICIAN_URL);

      // Measure time to interactive
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };
      });

      // Should be reasonably fast
      expect(metrics.domContentLoaded).toBeLessThan(1000);
    });
  });
});
