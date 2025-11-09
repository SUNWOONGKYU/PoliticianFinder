# E2E Tests - PoliticianFinder

**Task ID**: P5T2
**Created**: 2025-11-10
**Framework**: Playwright

## Overview

Comprehensive end-to-end tests for all critical user flows in the PoliticianFinder application.

## Test Files

### 1. auth.spec.ts (27 tests)
Authentication and user registration flows:
- User registration with validation
- Login/logout functionality
- Password reset flow
- Google OAuth login
- Form validation
- Navigation between auth pages

### 2. politicians.spec.ts (18 tests)
Politician search and profile features:
- Search politicians by name
- Filter by party, region, position
- View politician details
- AI evaluation display
- Bookmark functionality
- Responsive design

### 3. posts.spec.ts (22 tests)
Community post management:
- Create, edit, delete posts
- Post validation
- Draft saving
- File attachments
- Politician tagging
- Comments and replies
- Like/unlike posts

### 4. admin.spec.ts (32 tests)
Admin panel functionality:
- Admin login and authentication
- Dashboard statistics
- Report management
- Content moderation
- User management (suspend/unsuspend)
- Politician verification

### 5. helpers.ts
Shared utility functions for E2E tests:
- Login/logout helpers
- Navigation utilities
- Element interaction helpers
- Screenshot utilities
- API mocking helpers

## Test Statistics

- **Total Tests**: 85+
- **Test Coverage**: All critical user scenarios
- **Browsers**: Chromium, Firefox, WebKit
- **Execution Time**: ~5-10 minutes (full suite)

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/politicians.spec.ts
npx playwright test e2e/posts.spec.ts
npx playwright test e2e/admin.spec.ts
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run specific test by name
```bash
npx playwright test -g "should successfully login"
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report
```bash
npm run test:e2e:report
```

## Test Structure

All tests follow the AAA pattern:
- **Arrange**: Set up test data and navigate to page
- **Act**: Perform user actions
- **Assert**: Verify expected outcomes

```typescript
test('should create a new post', async ({ page }) => {
  // Arrange
  await page.goto('/community/posts/create');

  // Act
  await page.fill('#title', 'Test Post');
  await page.fill('#content', 'Test content');
  await page.click('button[type="submit"]');

  // Assert
  await expect(page).toHaveURL(/\/community/);
});
```

## Test Data

Test data is defined at the top of each spec file:
- `TEST_USER`: Standard user credentials
- `ADMIN_USER`: Admin credentials
- `TEST_POST`: Sample post data
- `SEARCH_QUERIES`: Search test cases

## Best Practices

1. **Isolation**: Each test is independent
2. **Cleanup**: Clear cookies/storage before tests
3. **Waits**: Use proper waits (networkidle, waitForSelector)
4. **Selectors**: Prefer semantic selectors (IDs, roles, text)
5. **Screenshots**: Auto-captured on failure
6. **Error Handling**: Graceful handling of missing elements

## Configuration

See `playwright.config.ts` for:
- Base URL configuration
- Timeout settings
- Browser configurations
- Screenshot/video settings
- Reporter configuration

## Debugging

### Take screenshots
```typescript
await page.screenshot({ path: 'debug.png' });
```

### Pause execution
```typescript
await page.pause();
```

### Console logs
```typescript
page.on('console', msg => console.log(msg.text()));
```

### Network requests
```typescript
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Headless mode by default
- Retries enabled in CI
- Single worker in CI to avoid conflicts
- HTML reporter for test results

## Known Limitations

1. Some tests require actual backend API (not mocked)
2. File upload tests are limited without actual files
3. OAuth tests require proper credentials
4. Some tests may be flaky due to timing issues (use `waitForTimeout` sparingly)

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Use `waitForLoadState('networkidle')`
- Check for slow API responses

### Element not found
- Verify selectors match actual DOM
- Use `page.pause()` to inspect page state
- Check for dynamic content loading

### Tests passing locally but failing in CI
- Check for environment-specific issues
- Verify dev server is running
- Check network/API availability

## Future Improvements

- [ ] Add visual regression tests
- [ ] Implement API mocking for faster tests
- [ ] Add accessibility tests
- [ ] Improve test data management
- [ ] Add performance monitoring
- [ ] Create reusable page object models

## Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test logs in `test-results/`
- View HTML report: `npx playwright show-report`
