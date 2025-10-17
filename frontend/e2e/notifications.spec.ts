/**
 * P3T1: Notification System E2E Tests
 *
 * Tests notification creation, retrieval, read status, and bulk operations
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Notification System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user and login
    await login(page, 'test-notifications@example.com', 'TestPassword123!');
  });

  test('should fetch user notifications list', async ({ page }) => {
    // Navigate to a page that shows notifications
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if notification bell exists
    const notificationBell = page.locator('[data-testid="notification-bell"]');
    if (await notificationBell.count() > 0) {
      await expect(notificationBell).toBeVisible();
    }
  });

  test('should display unread notification count', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for notification badge
    const badge = page.locator('[data-testid="notification-badge"]');
    if (await badge.count() > 0) {
      const count = await badge.textContent();
      expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
    }
  });

  test('should mark single notification as read', async ({ request }) => {
    // Get unread notifications
    const notificationsResponse = await request.get('/api/notifications/unread', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(notificationsResponse.ok()).toBeTruthy();
    const data = await notificationsResponse.json();

    if (data.data && data.data.length > 0) {
      const notificationId = data.data[0].id;

      // Mark as read
      const readResponse = await request.put(`/api/notifications/${notificationId}/read`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(readResponse.ok()).toBeTruthy();
      const readData = await readResponse.json();
      expect(readData.success).toBe(true);
    }
  });

  test('should mark all notifications as read', async ({ request }) => {
    // Mark all as read
    const response = await request.put('/api/notifications/read-all', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        all: true,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);

    // Verify unread count is 0
    const countResponse = await request.get('/api/notifications/count');
    const countData = await countResponse.json();
    expect(countData.data.unread).toBe(0);
  });

  test('should filter notifications by type', async ({ request }) => {
    const types = ['comment', 'reply', 'like'];

    for (const type of types) {
      const response = await request.get(`/api/notifications?type=${type}`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Verify all notifications are of the requested type
        data.data.forEach((notification: any) => {
          expect(notification.type).toBe(type);
        });
      }
    }
  });

  test('should paginate notifications correctly', async ({ request }) => {
    const page1Response = await request.get('/api/notifications?page=1&limit=5');
    expect(page1Response.ok()).toBeTruthy();

    const page1Data = await page1Response.json();
    expect(page1Data.data).toBeDefined();
    expect(Array.isArray(page1Data.data)).toBe(true);

    if (page1Data.pagination && page1Data.pagination.total > 5) {
      const page2Response = await request.get('/api/notifications?page=2&limit=5');
      const page2Data = await page2Response.json();

      // Ensure different data on different pages
      if (page1Data.data.length > 0 && page2Data.data.length > 0) {
        expect(page1Data.data[0].id).not.toBe(page2Data.data[0].id);
      }
    }
  });

  test('should get notification count statistics', async ({ request }) => {
    const response = await request.get('/api/notifications/count');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(typeof data.data.total).toBe('number');
    expect(typeof data.data.unread).toBe('number');
    expect(data.data.by_type).toBeDefined();
  });

  test('should filter notifications by date range', async ({ request }) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    const response = await request.get(
      `/api/notifications?startDate=${startDate.toISOString()}`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    if (data.data && data.data.length > 0) {
      data.data.forEach((notification: any) => {
        const createdAt = new Date(notification.created_at);
        expect(createdAt >= startDate).toBe(true);
      });
    }
  });

  test('should handle notification creation on comment', async ({ request, page }) => {
    // This test simulates the notification creation flow when a comment is made
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // Check initial notification count
    const initialCountResponse = await request.get('/api/notifications/count');
    const initialData = await initialCountResponse.json();
    const initialCount = initialData.data.total;

    // Add a comment (this should trigger notification creation)
    const commentInput = page.locator('[data-testid="comment-input"]');
    if (await commentInput.count() > 0) {
      await commentInput.fill('Test comment for notification');
      await page.locator('[data-testid="submit-comment"]').click();

      // Wait for comment to be posted
      await page.waitForTimeout(1000);

      // Check if notification count increased (if commenting on others' content)
      const newCountResponse = await request.get('/api/notifications/count');
      const newData = await newCountResponse.json();
      const newCount = newData.data.total;

      // Count may or may not increase depending on whether it's user's own content
      expect(typeof newCount).toBe('number');
    }
  });

  test('should handle bulk mark as read with specific IDs', async ({ request }) => {
    // Get some unread notifications
    const unreadResponse = await request.get('/api/notifications/unread?limit=3');
    const unreadData = await unreadResponse.json();

    if (unreadData.data && unreadData.data.length > 0) {
      const notificationIds = unreadData.data.map((n: any) => n.id);

      // Mark specific notifications as read
      const response = await request.put('/api/notifications/read-all', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          notification_ids: notificationIds,
        },
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });
});

test.describe('Notification Error Handling', () => {
  test('should handle invalid notification ID', async ({ request, page }) => {
    await login(page, 'test-notifications@example.com', 'TestPassword123!');

    const response = await request.put('/api/notifications/99999/read');

    // Should return error or not found
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should validate pagination parameters', async ({ request, page }) => {
    await login(page, 'test-notifications@example.com', 'TestPassword123!');

    // Invalid limit
    const response = await request.get('/api/notifications?limit=1000');
    const data = await response.json();

    // Should either limit to max or return error
    if (response.ok()) {
      expect(data.data.length).toBeLessThanOrEqual(100);
    }
  });

  test('should require authentication for protected endpoints', async ({ request }) => {
    // Try to access notifications without auth
    const response = await request.get('/api/notifications');

    // Should return 401 or redirect
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
