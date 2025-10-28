# Phase 3 E2E Testing Documentation

Comprehensive testing guide for Phase 3 community features (P3T1-P3T3).

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [CI/CD Integration](#cicd-integration)
6. [Test Data Management](#test-data-management)

---

## Overview

Phase 3 E2E tests cover three main areas:
- **P3T1**: Notification System
- **P3T2**: Bookmark System
- **P3T3**: Comment System (CRUD, Replies, Likes)

### Technologies

- **Framework**: Playwright
- **Language**: TypeScript
- **Test Runner**: Playwright Test
- **Reporters**: HTML, JSON, List

---

## Test Structure

### Test Files

```
e2e/
├── notifications.spec.ts    # P3T1: Notification tests
├── bookmarks.spec.ts        # P3T2: Bookmark tests
├── comments.spec.ts         # P3T3: Comment system tests
├── helpers/
│   └── auth-helpers.ts     # Authentication helpers
└── fixtures/
    └── test-data.ts        # Test data fixtures
```

### Test Organization

Each test file follows this structure:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});

test.describe('Error Handling', () => {
  // Error cases
});
```

---

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run specific test suite
npm run test:notifications
npm run test:bookmarks
npm run test:comments

# Run all Phase 3 tests
npm run test:phase3

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug -- notifications.spec.ts
```

### Browser-Specific Tests

```bash
# Chrome only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# Mobile Chrome
npm run test:e2e:mobile
```

### View Test Reports

```bash
npm run test:e2e:report
```

---

## Test Coverage

### P3T1: Notification System (notifications.spec.ts)

#### Test Cases

1. **Notification Retrieval**
   - ✅ Fetch user notifications list
   - ✅ Display unread notification count
   - ✅ Filter notifications by type
   - ✅ Paginate notifications correctly
   - ✅ Filter by date range

2. **Read Status Management**
   - ✅ Mark single notification as read
   - ✅ Mark all notifications as read
   - ✅ Bulk mark specific notifications as read

3. **Statistics**
   - ✅ Get notification count statistics
   - ✅ View notifications by type breakdown

4. **Integration**
   - ✅ Handle notification creation on comment
   - ✅ Display notifications in UI

5. **Error Handling**
   - ✅ Handle invalid notification ID
   - ✅ Validate pagination parameters
   - ✅ Require authentication for protected endpoints

#### API Endpoints Tested

- `GET /api/notifications`
- `GET /api/notifications/unread`
- `GET /api/notifications/count`
- `PUT /api/notifications/[id]/read`
- `PUT /api/notifications/read-all`

---

### P3T2: Bookmark System (bookmarks.spec.ts)

#### Test Cases

1. **Bookmark UI**
   - ✅ Display bookmark button on politician card
   - ✅ Show bookmark count (if implemented)
   - ✅ Display bookmarked politicians in user profile

2. **Bookmark Operations**
   - ✅ Add politician to bookmarks
   - ✅ Remove politician from bookmarks
   - ✅ Handle rapid bookmark toggle

3. **Persistence**
   - ✅ Persist bookmarks across sessions
   - ✅ Maintain bookmark state after page refresh

4. **Filtering**
   - ✅ Filter bookmarks by category (if implemented)

5. **API Tests**
   - ✅ Add bookmark via API
   - ✅ Remove bookmark via API
   - ✅ Get user bookmarks list
   - ✅ Check if politician is bookmarked

6. **Error Handling**
   - ✅ Handle invalid politician ID
   - ✅ Prevent duplicate bookmarks
   - ✅ Require authentication

#### API Endpoints Tested

- `POST /api/bookmarks`
- `DELETE /api/bookmarks`
- `GET /api/bookmarks`
- `GET /api/bookmarks/check`

---

### P3T3: Comment System (comments.spec.ts)

#### Test Cases

1. **Comment CRUD**
   - ✅ Display comment section on politician detail page
   - ✅ Create a new comment
   - ✅ Display existing comments
   - ✅ Edit own comment
   - ✅ Delete own comment
   - ✅ Prevent editing others' comments

2. **Reply System**
   - ✅ Create a reply to comment
   - ✅ Display nested replies
   - ✅ Show reply count
   - ✅ Toggle reply visibility

3. **Like System**
   - ✅ Like a comment
   - ✅ Unlike a comment
   - ✅ Display like count

4. **API Tests**
   - ✅ Create comment via API
   - ✅ Update comment via API
   - ✅ Delete comment via API
   - ✅ Get comments for politician
   - ✅ Paginate comments correctly
   - ✅ Sort comments by different criteria

5. **Error Handling**
   - ✅ Validate comment content
   - ✅ Prevent unauthorized comment deletion
   - ✅ Require authentication

#### API Endpoints Tested

- `POST /api/comments`
- `GET /api/comments`
- `PUT /api/comments/[id]`
- `DELETE /api/comments/[id]`
- `POST /api/comments/[id]/replies`
- `GET /api/comments/[id]/replies`
- `POST /api/likes`
- `DELETE /api/likes`

---

## CI/CD Integration

### GitHub Actions Configuration

The tests are integrated into the CI/CD pipeline via `.github/workflows/e2e-tests.yml`.

#### Workflow Features

- ✅ Runs on pull requests
- ✅ Runs on push to main
- ✅ Parallel execution across browsers
- ✅ Artifact upload for failed tests
- ✅ Test report generation

#### Example Configuration

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.PLAYWRIGHT_BASE_URL }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### Running in CI

Tests automatically run when:
- Opening a pull request
- Pushing to main branch
- Manual workflow dispatch

---

## Test Data Management

### Authentication

Tests use helper functions for authentication:

```typescript
import { login } from './helpers/auth-helpers';

test('my test', async ({ page }) => {
  const auth = await login(page, 'user@example.com', 'password');
  // auth.token, auth.userId available
});
```

### Test Users

Required test accounts:

```
test-notifications@example.com
test-bookmarks@example.com
test-comments@example.com
test-comments-2@example.com (for multi-user tests)
```

Password for all: `TestPassword123!`

### Test Data Cleanup

Tests should:
1. Create isolated test data
2. Use unique identifiers (timestamps)
3. Not depend on existing data
4. Clean up after themselves (if possible)

### Environment Variables

```env
# .env.test
PLAYWRIGHT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
```

---

## Test Reports

### HTML Report

Generated after test run:

```bash
npm run test:e2e:report
```

Opens in browser with:
- Test results summary
- Failed test screenshots
- Test traces for debugging
- Performance metrics

### JSON Report

Located at: `test-results/results.json`

Can be parsed for CI/CD integrations:

```json
{
  "tests": [...],
  "errors": [...],
  "stats": {
    "passed": 45,
    "failed": 0,
    "skipped": 0
  }
}
```

---

## Debugging Failed Tests

### 1. Run with UI

```bash
npm run test:e2e:ui
```

Provides interactive test runner.

### 2. Run in Headed Mode

```bash
npm run test:e2e:headed
```

Shows browser window during test execution.

### 3. Use Debug Mode

```bash
npm run test:e2e:debug -- notifications.spec.ts
```

Opens Playwright Inspector for step-by-step debugging.

### 4. Check Screenshots

Failed tests automatically capture:
- Screenshot at failure point
- Video recording (if enabled)
- Trace file for replay

Located in: `test-results/`

---

## Best Practices

### 1. Use Data Test IDs

```tsx
<button data-testid="submit-comment">Submit</button>
```

```typescript
await page.locator('[data-testid="submit-comment"]').click();
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Handle Optional Elements

```typescript
const element = page.locator('[data-testid="optional"]');
if (await element.count() > 0) {
  await element.click();
}
```

### 4. Use Meaningful Test Names

```typescript
test('should display notification count badge when user has unread notifications', ...)
```

### 5. Isolate Tests

Each test should be independent and not rely on other tests.

---

## Performance Benchmarks

Target test execution times:

- **Notification tests**: ~60 seconds
- **Bookmark tests**: ~45 seconds
- **Comment tests**: ~90 seconds
- **Total Phase 3 suite**: ~3-5 minutes

---

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check for slow API responses
- Verify database connectivity

### Authentication Failures

- Check test user credentials
- Verify Supabase configuration
- Check for rate limiting

### Flaky Tests

- Add explicit waits
- Use `waitForLoadState('networkidle')`
- Increase action timeout
- Check for race conditions

### CI Failures (Local Pass)

- Check environment variables in CI
- Verify test database is accessible
- Review CI logs for network issues
- Ensure browsers are installed in CI

---

## Coverage Summary

### Total Test Cases: 60+

- **Notification System**: 15+ tests
- **Bookmark System**: 15+ tests
- **Comment System**: 30+ tests

### Coverage Metrics

- ✅ **API Coverage**: All Phase 3 endpoints tested
- ✅ **UI Coverage**: Key user interactions covered
- ✅ **Error Cases**: Comprehensive error handling
- ✅ **Edge Cases**: Authentication, permissions, validation
- ✅ **Integration**: Cross-feature interactions tested

---

## Next Steps

### Future Enhancements

1. **Visual Regression Testing**
   - Add screenshot comparison tests
   - Use Playwright's screenshot assertions

2. **Performance Testing**
   - Measure page load times
   - Test API response times
   - Monitor Web Vitals

3. **Accessibility Testing**
   - Add axe-core integration
   - Test keyboard navigation
   - Verify screen reader support

4. **Load Testing**
   - Test concurrent user scenarios
   - Stress test API endpoints
   - Verify rate limiting

---

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [E2E Testing Guide](./E2E_TESTING_GUIDE.md)
- [Phase 3 API Documentation](./src/app/api/PHASE3_API_DOCS.md)

---

**Last Updated**: 2025-10-17
**Phase**: Phase 3
**Status**: Implementation Complete
**Test Coverage**: 60+ test cases
