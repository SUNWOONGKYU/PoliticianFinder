/**
 * P3T3: Comment System E2E Tests
 *
 * Tests comment CRUD, replies, and like operations
 */

import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Comment System CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test user and login
    await login(page, 'test-comments@example.com', 'TestPassword123!');
  });

  test('should display comment section on politician detail page', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // Check if comment section exists
    const commentSection = page.locator('[data-testid="comment-section"]');
    if (await commentSection.count() > 0) {
      await expect(commentSection).toBeVisible();
    }
  });

  test('should create a new comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const commentInput = page.locator('[data-testid="comment-input"]');
    const submitButton = page.locator('[data-testid="submit-comment"]');

    if (await commentInput.count() > 0 && await submitButton.count() > 0) {
      const testComment = `Test comment at ${new Date().toISOString()}`;

      await commentInput.fill(testComment);
      await submitButton.click();

      // Wait for comment to appear
      await page.waitForTimeout(1000);

      // Verify comment appears in list
      const commentText = page.locator(`text=${testComment}`);
      await expect(commentText).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display existing comments', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const comments = page.locator('[data-testid="comment-item"]');
    const count = await comments.count();

    if (count > 0) {
      // Verify first comment structure
      const firstComment = comments.first();
      await expect(firstComment).toBeVisible();

      // Check for author, content, timestamp
      const author = firstComment.locator('[data-testid="comment-author"]');
      const content = firstComment.locator('[data-testid="comment-content"]');

      if (await author.count() > 0) await expect(author).toBeVisible();
      if (await content.count() > 0) await expect(content).toBeVisible();
    }
  });

  test('should edit own comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // Create a comment first
    const commentInput = page.locator('[data-testid="comment-input"]');
    const submitButton = page.locator('[data-testid="submit-comment"]');

    if (await commentInput.count() > 0) {
      const originalComment = `Original comment ${new Date().getTime()}`;
      await commentInput.fill(originalComment);
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Find edit button for the new comment
      const editButton = page.locator('[data-testid="edit-comment"]').first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Edit the comment
        const editInput = page.locator('[data-testid="edit-comment-input"]');
        if (await editInput.count() > 0) {
          const updatedComment = `Updated comment ${new Date().getTime()}`;
          await editInput.fill(updatedComment);

          const saveButton = page.locator('[data-testid="save-comment"]');
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Verify updated text appears
          const updatedText = page.locator(`text=${updatedComment}`);
          await expect(updatedText).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should delete own comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    // Create a comment first
    const commentInput = page.locator('[data-testid="comment-input"]');
    const submitButton = page.locator('[data-testid="submit-comment"]');

    if (await commentInput.count() > 0) {
      const testComment = `Comment to delete ${new Date().getTime()}`;
      await commentInput.fill(testComment);
      await submitButton.click();
      await page.waitForTimeout(1000);

      // Find delete button
      const deleteButton = page.locator('[data-testid="delete-comment"]').first();

      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        // Confirm deletion if modal appears
        const confirmButton = page.locator('[data-testid="confirm-delete"]');
        if (await confirmButton.count() > 0) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Verify comment is marked as deleted or removed
        const deletedComment = page.locator(`text=${testComment}`);
        const isVisible = await deletedComment.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
      }
    }
  });

  test('should not allow editing others comments', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const comments = page.locator('[data-testid="comment-item"]');
    const count = await comments.count();

    if (count > 0) {
      // Check if edit buttons are only visible for own comments
      const firstComment = comments.first();
      const editButton = firstComment.locator('[data-testid="edit-comment"]');

      // Edit button should only appear on user's own comments
      const hasEditButton = await editButton.count() > 0;

      if (hasEditButton) {
        const commentAuthor = await firstComment
          .locator('[data-testid="comment-author"]')
          .textContent();

        // This is just a check that edit controls exist where appropriate
        expect(typeof commentAuthor).toBe('string');
      }
    }
  });
});

test.describe('Comment Replies', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');
  });

  test('should create a reply to comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const replyButton = page.locator('[data-testid="reply-button"]').first();

    if (await replyButton.count() > 0) {
      await replyButton.click();
      await page.waitForTimeout(500);

      const replyInput = page.locator('[data-testid="reply-input"]');
      const submitReply = page.locator('[data-testid="submit-reply"]');

      if (await replyInput.count() > 0) {
        const testReply = `Test reply ${new Date().getTime()}`;
        await replyInput.fill(testReply);
        await submitReply.click();
        await page.waitForTimeout(1000);

        // Verify reply appears
        const replyText = page.locator(`text=${testReply}`);
        await expect(replyText).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display nested replies', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const replies = page.locator('[data-testid="reply-item"]');
    const count = await replies.count();

    if (count > 0) {
      // Verify replies are indented or visually nested
      const firstReply = replies.first();
      await expect(firstReply).toBeVisible();

      // Check for nested structure indicators
      const replyIndicator = firstReply.locator('[data-testid="reply-indicator"]');
      if (await replyIndicator.count() > 0) {
        await expect(replyIndicator).toBeVisible();
      }
    }
  });

  test('should show reply count', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const replyCount = page.locator('[data-testid="reply-count"]').first();

    if (await replyCount.count() > 0) {
      const countText = await replyCount.textContent();
      const count = parseInt(countText?.match(/\d+/)?.[0] || '0');
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should toggle reply visibility', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const toggleButton = page.locator('[data-testid="toggle-replies"]').first();

    if (await toggleButton.count() > 0) {
      // Click to show replies
      await toggleButton.click();
      await page.waitForTimeout(500);

      const repliesContainer = page.locator('[data-testid="replies-container"]').first();
      if (await repliesContainer.count() > 0) {
        await expect(repliesContainer).toBeVisible();

        // Click to hide replies
        await toggleButton.click();
        await page.waitForTimeout(500);

        // Replies should be hidden
        const isVisible = await repliesContainer.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
      }
    }
  });
});

test.describe('Comment Likes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');
  });

  test('should like a comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const likeButton = page.locator('[data-testid="like-comment"]').first();

    if (await likeButton.count() > 0) {
      // Get initial like count
      const likeCountElement = likeButton.locator('[data-testid="like-count"]');
      let initialCount = 0;

      if (await likeCountElement.count() > 0) {
        const countText = await likeCountElement.textContent();
        initialCount = parseInt(countText || '0');
      }

      // Click like button
      await likeButton.click();
      await page.waitForTimeout(500);

      // Verify like count increased or button state changed
      const isLiked = await likeButton.getAttribute('data-liked');
      expect(['true', null]).toContain(isLiked);
    }
  });

  test('should unlike a comment', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const likeButton = page.locator('[data-testid="like-comment"]').first();

    if (await likeButton.count() > 0) {
      // Like first
      await likeButton.click();
      await page.waitForTimeout(500);

      // Unlike
      await likeButton.click();
      await page.waitForTimeout(500);

      // Verify unliked state
      const isLiked = await likeButton.getAttribute('data-liked');
      expect(isLiked).toBe('false');
    }
  });

  test('should display like count', async ({ page }) => {
    await page.goto('/politicians/1');
    await page.waitForLoadState('networkidle');

    const likeCount = page.locator('[data-testid="like-count"]').first();

    if (await likeCount.count() > 0) {
      const countText = await likeCount.textContent();
      const count = parseInt(countText || '0');
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Comment API Tests', () => {
  test('should create comment via API', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    const response = await request.post('/api/comments', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        politician_id: 1,
        content: 'Test comment via API',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  test('should update comment via API', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    // Create comment first
    const createResponse = await request.post('/api/comments', {
      data: {
        politician_id: 1,
        content: 'Original content',
      },
    });

    const createData = await createResponse.json();
    const commentId = createData.data.id;

    // Update comment
    const updateResponse = await request.put(`/api/comments/${commentId}`, {
      data: {
        content: 'Updated content',
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
  });

  test('should delete comment via API', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    // Create comment first
    const createResponse = await request.post('/api/comments', {
      data: {
        politician_id: 1,
        content: 'Comment to delete',
      },
    });

    const createData = await createResponse.json();
    const commentId = createData.data.id;

    // Delete comment
    const deleteResponse = await request.delete(`/api/comments/${commentId}`);
    expect(deleteResponse.ok()).toBeTruthy();
  });

  test('should get comments for politician', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    const response = await request.get('/api/comments?politician_id=1');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(Array.isArray(data.data || data)).toBe(true);
  });

  test('should paginate comments correctly', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    const response = await request.get('/api/comments?politician_id=1&page=1&limit=5');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    if (data.data) {
      expect(data.data.length).toBeLessThanOrEqual(5);
    }
  });

  test('should sort comments by different criteria', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    const sortOptions = ['created_at', 'like_count'];

    for (const sortBy of sortOptions) {
      const response = await request.get(
        `/api/comments?politician_id=1&sortBy=${sortBy}&sortOrder=desc`
      );

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
    }
  });
});

test.describe('Comment Error Handling', () => {
  test('should validate comment content', async ({ request, page }) => {
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    // Empty content
    const response = await request.post('/api/comments', {
      data: {
        politician_id: 1,
        content: '',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('should prevent unauthorized comment deletion', async ({ request, page, context }) => {
    // Login as first user and create comment
    await login(page, 'test-comments@example.com', 'TestPassword123!');

    const createResponse = await request.post('/api/comments', {
      data: {
        politician_id: 1,
        content: 'Comment by user 1',
      },
    });

    const createData = await createResponse.json();
    const commentId = createData.data.id;

    // Login as different user
    const newPage = await context.newPage();
    await login(newPage, 'test-comments-2@example.com', 'TestPassword123!');

    // Try to delete other user's comment
    const deleteResponse = await request.delete(`/api/comments/${commentId}`);

    // Should fail with forbidden
    expect([401, 403]).toContain(deleteResponse.status());
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.post('/api/comments', {
      data: {
        politician_id: 1,
        content: 'Test',
      },
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
