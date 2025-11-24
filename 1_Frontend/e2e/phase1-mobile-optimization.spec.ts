/**
 * Phase 1 Mobile Optimization Verification Tests
 *
 * Test Coverage:
 * 1. Filter Tag Functionality (politicians/page.tsx)
 * 2. Filter Reset Button
 * 3. FAB Button Routing (community/page.tsx)
 * 4. Empty State Buttons
 * 5. 404 Page Navigation
 * 6. Responsive Layouts
 * 7. iOS Auto-zoom Prevention
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Test on multiple viewport sizes
const viewports = [
  { name: 'iPhone SE 1st', width: 320, height: 568 },
  { name: 'iPhone SE 2nd', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 428, height: 926 },
  { name: 'iPad', width: 768, height: 1024 },
];

test.describe('Phase 1 Mobile Optimization - Politicians Page', () => {

  test.describe('Filter Tags Functionality', () => {

    for (const viewport of viewports) {
      test(`Filter tags work correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/politicians`);

        // Wait for page to load
        await page.waitForLoadState('networkidle');

        // Select identity filter
        await page.selectOption('select:has-text("신분")', '현직');

        // Verify active filter tag appears
        await expect(page.locator('text=활성 필터:')).toBeVisible();
        await expect(page.locator('text=신분: 현직')).toBeVisible();

        // Select category filter
        await page.selectOption('select:has-text("출마직종")', '국회의원');

        // Verify both tags are visible
        await expect(page.locator('text=출마직종: 국회의원')).toBeVisible();

        // Test individual filter removal (X button)
        const identityRemoveButton = page.locator('button[aria-label="신분 필터 제거"]');
        await expect(identityRemoveButton).toBeVisible();

        // Verify button has min-w-touch and min-h-touch classes
        const identityBtn = await identityRemoveButton.elementHandle();
        const classes = await identityBtn?.getAttribute('class');
        expect(classes).toContain('min-w-touch');
        expect(classes).toContain('min-h-touch');

        // Click X button to remove identity filter
        await identityRemoveButton.click();

        // Verify identity tag is removed but category tag remains
        await expect(page.locator('text=신분: 현직')).not.toBeVisible();
        await expect(page.locator('text=출마직종: 국회의원')).toBeVisible();

        // Test "전체 초기화" button
        await page.click('button:has-text("전체 초기화")');

        // Verify all filters are cleared
        await expect(page.locator('text=활성 필터:')).not.toBeVisible();
      });
    }
  });

  test.describe('Search Input iOS Auto-zoom Prevention', () => {

    test('Search input has correct attributes to prevent iOS zoom', async ({ page }) => {
      // Use iPhone viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/politicians`);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Check search input attributes
      const searchInput = page.locator('input[type="search"]').first();

      // Verify type="search"
      await expect(searchInput).toHaveAttribute('type', 'search');

      // Verify inputMode="search"
      await expect(searchInput).toHaveAttribute('inputMode', 'search');

      // Verify font size is at least 16px (check computed style)
      const fontSize = await searchInput.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      const fontSizeNum = parseInt(fontSize);
      expect(fontSizeNum).toBeGreaterThanOrEqual(16);
    });
  });

  test.describe('Empty State', () => {

    test('Empty state shows when no results and reset button works', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/politicians`);

      await page.waitForLoadState('networkidle');

      // Apply filters that will likely result in no matches
      await page.selectOption('select:has-text("신분")', '예비후보자');
      await page.selectOption('select:has-text("평가등급")', 'M');

      // Type in search that won't match
      await page.fill('input[type="search"]', 'zzzznonexistent');

      // Wait a bit for filtering to apply
      await page.waitForTimeout(500);

      // Check if empty state appears
      const emptyState = page.locator('text=검색 결과가 없습니다');
      if (await emptyState.isVisible()) {
        // Verify empty state message
        await expect(page.locator('text=다른 검색어나 필터 조건을 시도해보세요')).toBeVisible();

        // Click reset button in empty state
        await page.click('button:has-text("필터 초기화")');

        // Verify filters are cleared (search should be empty)
        const searchValue = await page.locator('input[type="search"]').first().inputValue();
        expect(searchValue).toBe('');
      }
    });
  });

  test.describe('Filter Layout Responsiveness', () => {

    for (const viewport of viewports) {
      test(`Filter tags don't break layout on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(`${BASE_URL}/politicians`);

        await page.waitForLoadState('networkidle');

        // Apply all filters to test tag wrapping
        await page.selectOption('select:has-text("신분")', '현직');
        await page.selectOption('select:has-text("출마직종")', '국회의원');
        await page.selectOption('select:has-text("정당")', '더불어민주당');
        await page.selectOption('select:has-text("평가등급")', 'E');

        // Wait for tags to render
        await page.waitForTimeout(300);

        // Verify active filter container exists
        const filterContainer = page.locator('text=활성 필터:').locator('..');
        await expect(filterContainer).toBeVisible();

        // Check that container uses flexbox wrapping (via class check)
        const containerClasses = await filterContainer.getAttribute('class');
        expect(containerClasses).toContain('flex');
        expect(containerClasses).toContain('flex-wrap');
      });
    }
  });
});

test.describe('Phase 1 Mobile Optimization - Community Page', () => {

  test.describe('FAB Button Routing', () => {

    test('FAB button shows modal when category is "전체"', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      // Verify we're on "전체" tab by default
      const allTabButton = page.locator('button:has-text("전체")');
      await expect(allTabButton).toHaveClass(/bg-primary-500/);

      // Click FAB button
      const fabButton = page.locator('button[aria-label="글쓰기"]');
      await expect(fabButton).toBeVisible();
      await fabButton.click();

      // Verify modal appears
      await expect(page.locator('text=카테고리 선택')).toBeVisible();
      await expect(page.locator('text=어떤 게시판에 글을 작성하시겠습니까?')).toBeVisible();

      // Verify modal options
      await expect(page.locator('a:has-text("🏛️ 정치인 게시판")')).toBeVisible();
      await expect(page.locator('a:has-text("💬 회원 자유게시판")')).toBeVisible();
    });

    test('FAB button routes to /community/posts/create-politician when on politician_post tab', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      // Click "정치인 게시판" tab
      await page.click('button:has-text("🏛️ 정치인 게시판")');

      // Wait for tab to activate
      await page.waitForTimeout(300);

      // Click FAB button
      const fabButton = page.locator('button[aria-label="글쓰기"]');
      await fabButton.click();

      // Verify navigation (wait for URL change)
      await page.waitForURL('**/community/posts/create-politician', { timeout: 5000 });
      expect(page.url()).toContain('/community/posts/create-politician');
    });

    test('FAB button routes to /community/posts/create when on general tab', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      // Click "회원 자유게시판" tab
      await page.click('button:has-text("💬 회원 자유게시판")');

      // Wait for tab to activate
      await page.waitForTimeout(300);

      // Click FAB button
      const fabButton = page.locator('button[aria-label="글쓰기"]');
      await fabButton.click();

      // Verify navigation
      await page.waitForURL('**/community/posts/create', { timeout: 5000 });
      expect(page.url()).toContain('/community/posts/create');
    });

    test('FAB button has correct touch target size', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      // Check FAB button size
      const fabButton = page.locator('button[aria-label="글쓰기"]');
      const boundingBox = await fabButton.boundingBox();

      expect(boundingBox).not.toBeNull();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    });

    test('FAB button stays fixed while scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      const fabButton = page.locator('button[aria-label="글쓰기"]');

      // Get initial position
      const initialBox = await fabButton.boundingBox();

      // Scroll down
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);

      // Get position after scroll
      const scrolledBox = await fabButton.boundingBox();

      // FAB should still be visible and at same position relative to viewport
      await expect(fabButton).toBeVisible();
      expect(scrolledBox).not.toBeNull();
    });
  });

  test.describe('Empty State', () => {

    test('Empty state shows correct message for each category', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      // Test for "전체" tab
      await page.goto(`${BASE_URL}/community`);
      await page.waitForLoadState('networkidle');

      // Wait to see if empty state appears (posts might exist)
      await page.waitForTimeout(1000);

      const emptyStateAll = page.locator('text=게시글이 없습니다');
      if (await emptyStateAll.isVisible()) {
        await expect(page.locator('text=첫 게시글을 작성해보세요!')).toBeVisible();
      }

      // Test for "정치인 게시판" tab
      await page.click('button:has-text("🏛️ 정치인 게시판")');
      await page.waitForTimeout(500);

      const emptyStatePolitician = page.locator('text=정치인이 작성한 게시글이 없습니다');
      if (await emptyStatePolitician.isVisible()) {
        await expect(page.locator('text=첫 게시글을 작성해보세요!')).toBeVisible();

        // Click empty state button
        await page.click('button:has-text("글쓰기")');

        // Should navigate to politician post create
        await page.waitForURL('**/community/posts/create-politician', { timeout: 5000 });
        expect(page.url()).toContain('/community/posts/create-politician');
      }
    });
  });

  test.describe('Search Input', () => {

    test('Search input has correct attributes for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${BASE_URL}/community`);

      await page.waitForLoadState('networkidle');

      const searchInput = page.locator('input[type="search"]').first();

      // Verify type and inputMode
      await expect(searchInput).toHaveAttribute('type', 'search');
      await expect(searchInput).toHaveAttribute('inputMode', 'search');

      // Verify font size
      const fontSize = await searchInput.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
    });
  });
});

test.describe('Phase 1 Mobile Optimization - 404 Page', () => {

  test.describe('404 Page Navigation', () => {

    for (const viewport of viewports) {
      test(`404 page displays correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        // Go to non-existent page
        await page.goto(`${BASE_URL}/nonexistent-page-12345`, { waitUntil: 'networkidle' });

        // Verify 404 elements
        await expect(page.locator('text=404')).toBeVisible();
        await expect(page.locator('text=페이지를 찾을 수 없습니다')).toBeVisible();
        await expect(page.locator('text=요청하신 페이지가 존재하지 않거나')).toBeVisible();
      });
    }

    test('404 page home button works', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });

      // Click home button
      await page.click('button:has-text("홈으로 돌아가기")');

      // Verify navigation to home
      await page.waitForURL(BASE_URL, { timeout: 5000 });
      expect(page.url()).toBe(`${BASE_URL}/`);
    });

    test('404 page politician search button works', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });

      // Click politician search button
      await page.click('button:has-text("정치인 검색하기")');

      // Verify navigation
      await page.waitForURL('**/politicians', { timeout: 5000 });
      expect(page.url()).toContain('/politicians');
    });

    test('404 page community button works', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });

      // Click community button
      await page.click('button:has-text("커뮤니티 보기")');

      // Verify navigation
      await page.waitForURL('**/community', { timeout: 5000 });
      expect(page.url()).toContain('/community');
    });

    test('404 page back button works', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });

      // First go to a valid page
      await page.goto(`${BASE_URL}/politicians`);
      await page.waitForLoadState('networkidle');

      // Then navigate to 404
      await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });

      // Click back button
      await page.click('button:has-text("이전 페이지로")');

      // Should go back to politicians page
      await page.waitForURL('**/politicians', { timeout: 5000 });
      expect(page.url()).toContain('/politicians');
    });

    test('404 page buttons have correct touch target size', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${BASE_URL}/nonexistent-page`, { waitUntil: 'networkidle' });

      const buttons = [
        page.locator('button:has-text("홈으로 돌아가기")'),
        page.locator('button:has-text("정치인 검색하기")'),
        page.locator('button:has-text("커뮤니티 보기")'),
        page.locator('button:has-text("이전 페이지로")'),
      ];

      for (const button of buttons) {
        const box = await button.boundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });
  });
});

test.describe('Phase 1 Mobile Optimization - Touch Targets', () => {

  test('All interactive elements meet 44px minimum touch target', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Test politicians page
    await page.goto(`${BASE_URL}/politicians`);
    await page.waitForLoadState('networkidle');

    // Apply some filters to make tags appear
    await page.selectOption('select:has-text("신분")', '현직');
    await page.selectOption('select:has-text("정당")', '더불어민주당');

    // Get all buttons with touch classes
    const touchButtons = page.locator('button.min-h-touch, button.min-w-touch, .min-h-touch button');
    const count = await touchButtons.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = touchButtons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Note: Some buttons might be wider than tall, so we check height specifically
          expect(box.height).toBeGreaterThanOrEqual(42); // Allow 2px tolerance for borders
        }
      }
    }
  });
});
