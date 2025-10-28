import { test, expect } from '@playwright/test';

/**
 * Integration Tests for Politician Detail Page
 * Tests with real API (requires backend running)
 *
 * Skip these tests if backend is not available:
 * SKIP_INTEGRATION=1 npm run test:e2e
 */

const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === '1';

test.describe.skip(SKIP_INTEGRATION)('Politician Detail Integration Tests', () => {
  const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  const API_URL = process.env.API_URL || 'http://localhost:8000';

  test.beforeEach(async ({ page }) => {
    // No mocking - use real API
  });

  test('should load real politician data from API', async ({ page }) => {
    await page.goto('/politicians/1');

    // Wait for API call
    await page.waitForResponse(response =>
      response.url().includes('/api/politicians/') && response.status() === 200
    );

    // Check that real data is loaded
    await expect(page.getByText(/정치인 정보를 불러오는 중/)).not.toBeVisible();

    // Should show politician name (any name is fine)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should load real ratings from API', async ({ page }) => {
    await page.goto('/politicians/1');

    // Wait for ratings API call
    await page.waitForResponse(response =>
      response.url().includes('/api/ratings') && response.status() === 200
    );

    // Should show ratings section
    await expect(page.getByText(/평가|시민 평가/)).toBeVisible();
  });

  test('should handle real pagination', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // If pagination exists, test it
    const nextButton = page.getByRole('button', { name: '다음' });

    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();

      // Wait for new data
      await page.waitForResponse('**/api/ratings**');

      // Should update page
      await expect(page.getByRole('button', { name: '2' })).toBeVisible();
    }
  });

  test('should filter ratings by category with real API', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('policy');

    // Wait for API call with filter
    await page.waitForResponse(response =>
      response.url().includes('category=policy') && response.status() === 200
    );

    await expect(categorySelect).toHaveValue('policy');
  });

  test('should sort ratings with real API', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const sortSelect = page.locator('select').last();
    await sortSelect.selectOption('highest');

    // Wait for API call with sort
    await page.waitForResponse(response =>
      response.url().includes('sort') && response.status() === 200
    );

    await expect(sortSelect).toHaveValue('highest');
  });

  test('should handle real 404 error', async ({ page }) => {
    await page.goto('/politicians/999999');

    // Should show error page
    await expect(page.getByText(/찾을 수 없습니다/)).toBeVisible();
  });

  test('should measure real API performance', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within reasonable time (5 seconds with real API)
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle real network interruption', async ({ page, context }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // Simulate offline
    await context.setOffline(true);

    // Try to change page
    const nextButton = page.getByRole('button', { name: '다음' });
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      await nextButton.click();

      // Should handle error gracefully (no crash)
      await page.waitForTimeout(2000);
    }

    // Go back online
    await context.setOffline(false);
  });
});

/**
 * Tests that verify API contract
 */
test.describe.skip(SKIP_INTEGRATION)('API Contract Tests', () => {
  test('politician API should return correct schema', async ({ request }) => {
    const response = await request.get('/api/politicians/1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify schema
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('party');
    expect(data).toHaveProperty('region');
    expect(data).toHaveProperty('avg_rating');
    expect(data).toHaveProperty('total_ratings');
    expect(data).toHaveProperty('rating_distribution');
  });

  test('ratings API should return paginated response', async ({ request }) => {
    const response = await request.get('/api/ratings?politician_id=1&page=1&limit=10');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify pagination schema
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('limit');
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('totalPages');

    // Verify data is array
    expect(Array.isArray(data.data)).toBeTruthy();
  });

  test('ratings API should support filtering', async ({ request }) => {
    const response = await request.get('/api/ratings?politician_id=1&category=policy');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('data');

    // All ratings should be policy category (if any)
    if (data.data.length > 0) {
      const allPolicy = data.data.every((rating: any) => rating.category === 'policy');
      expect(allPolicy).toBeTruthy();
    }
  });

  test('ratings API should support sorting', async ({ request }) => {
    const response = await request.get('/api/ratings?politician_id=1&sort=score:desc');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify descending order (if multiple items)
    if (data.data.length > 1) {
      for (let i = 0; i < data.data.length - 1; i++) {
        expect(data.data[i].score).toBeGreaterThanOrEqual(data.data[i + 1].score);
      }
    }
  });

  test('politician API should return 404 for invalid ID', async ({ request }) => {
    const response = await request.get('/api/politicians/999999');
    expect(response.status()).toBe(404);
  });
});
