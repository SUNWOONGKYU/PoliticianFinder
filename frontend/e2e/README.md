# E2E Tests for PoliticianFinder

This directory contains end-to-end tests for the PoliticianFinder application using Playwright.

## Structure

```
e2e/
├── fixtures/          # Mock data and test fixtures
│   ├── politician-data.ts
│   └── rating-data.ts     # Rating system test data
├── helpers/          # Test utilities and helpers
│   ├── api-mock.ts   # API mocking utilities
│   ├── auth.ts       # Authentication helpers
│   └── viewport.ts   # Responsive testing helpers
├── politician-detail.spec.ts  # Politician detail page tests
└── rating-system.spec.ts      # Rating system E2E tests
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run tests for specific browser
```bash
npm run test:e2e:chromium  # Chromium only
npm run test:e2e:firefox   # Firefox only
npm run test:e2e:mobile    # Mobile Chrome
```

## Test Scenarios

### 1. Page Load
- ✓ Load politician detail page successfully
- ✓ Render politician profile information
- ✓ Load and display profile image
- ✓ Measure page load performance (< 2 seconds)

### 2. Rating Statistics
- ✓ Display average rating
- ✓ Display total rating count
- ✓ Render rating distribution chart
- ✓ Display rating statistics section

### 3. Rating List
- ✓ Render rating cards
- ✓ Display rating author information
- ✓ Sort ratings by latest (default)
- ✓ Sort ratings by score
- ✓ Filter ratings by category
- ✓ Display empty state when no ratings

### 4. Pagination
- ✓ Display pagination controls
- ✓ Navigate to next page
- ✓ Navigate to previous page
- ✓ Scroll to top when changing pages

### 5. Navigation
- ✓ Back button functionality
- ✓ Navigate to home on error
- ✓ Display back button with icon

### 6. Error Handling
- ✓ Display 404 error for non-existent politician
- ✓ Handle network error gracefully
- ✓ Handle server error (500)
- ✓ Handle invalid politician ID

### 7. Rating CRUD Operations (rating-system.spec.ts)
- ✓ Create rating with authentication
- ✓ Prevent unauthenticated rating creation
- ✓ Validate rating score requirement
- ✓ Edit own ratings
- ✓ Delete own ratings with confirmation
- ✓ Cannot edit/delete other users' ratings
- ✓ Display rating button
- ✓ Show placeholder alert on click
- ✓ Display rate button in empty state

### 8. Responsive Design
- ✓ Display correctly on mobile viewport
- ✓ Display correctly on tablet viewport
- ✓ Display correctly on desktop viewport
- ✓ Adapt filter controls on mobile
- ✓ Work across multiple viewports

### 9. Accessibility
- ✓ Proper heading hierarchy
- ✓ Keyboard navigation support
- ✓ Proper alt text for images
- ✓ Accessible form controls

### 10. Performance
- ✓ Lazy load images
- ✓ Handle rapid filter changes
- ✓ Measure rendering performance

## Browser Support

Tests run on the following browsers and devices:

### Desktop
- Chromium (1920x1080)
- Firefox (1920x1080)
- WebKit/Safari (1920x1080)

### Mobile
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Tablet
- iPad Pro

## Configuration

The test configuration is in `playwright.config.ts`. Key settings:

- **Timeout**: 30 seconds per test
- **Retries**: 2 times on CI, 0 locally
- **Base URL**: http://localhost:3000
- **Screenshots**: On failure only
- **Video**: On failure only
- **Trace**: On first retry

## Writing New Tests

### Example test structure:

```typescript
import { test, expect } from '@playwright/test';
import { setupStandardMocks } from './helpers/api-mock';
import { setViewport } from './helpers/viewport';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await setupStandardMocks(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/politicians/1');
    await expect(page.getByText('Expected Text')).toBeVisible();
  });
});
```

### Using helpers:

```typescript
// Mock API responses
import { setupStandardMocks, mockPoliticianNotFound } from './helpers/api-mock';

// Setup standard mocks
await setupStandardMocks(page);

// Mock 404 error
await mockPoliticianNotFound(page);

// Test responsive design
import { setViewport, testAcrossViewports } from './helpers/viewport';

await setViewport(page, 'mobile');
await testAcrossViewports(page, ['mobile', 'tablet', 'desktop'], async (viewport) => {
  // Test logic here
});
```

## Mock Data

Test fixtures are available:

### `fixtures/politician-data.ts`:
- `mockPoliticianDetail`: Sample politician data
- `mockRatings`: Sample ratings data
- `mockApiResponses`: Helper functions for API mocking
- `generateMockRatings()`: Generate mock ratings for pagination

### `fixtures/rating-data.ts`:
- `VALID_RATING_DATA`: Valid rating creation data
- `RATING_SAMPLES`: Multiple rating samples with different scores
- `UPDATE_RATING_DATA`: Rating update data
- `INVALID_RATING_DATA`: Invalid data for validation tests
- `MOCK_RATING_RESPONSE`: Mock API responses
- `generateRatings()`: Generate bulk rating data

## Best Practices

1. **Use data-testid for stable selectors**
   ```typescript
   await page.getByTestId('politician-name').click();
   ```

2. **Wait for network idle before assertions**
   ```typescript
   await page.waitForLoadState('networkidle');
   await expect(page.getByText('Content')).toBeVisible();
   ```

3. **Mock API responses consistently**
   ```typescript
   await setupStandardMocks(page);
   ```

4. **Test across viewports**
   ```typescript
   await testAcrossViewports(page, ['mobile', 'desktop'], async (viewport) => {
     // Tests
   });
   ```

5. **Handle async operations**
   ```typescript
   await page.waitForResponse('**/api/ratings**');
   ```

## Debugging

### Debug specific test:
```bash
npx playwright test politician-detail.spec.ts:42 --debug
```

### View trace:
```bash
npx playwright show-trace trace.zip
```

### Run with console logs:
```bash
DEBUG=pw:api npm run test:e2e
```

## CI/CD Integration

Tests automatically run in CI with:
- 2 retries for flaky tests
- 1 worker (sequential execution)
- Full reports saved as artifacts

## Performance Benchmarks

- **Page Load**: < 2 seconds
- **DOM Content Loaded**: < 1 second
- **API Response**: < 500ms (mocked)

## Troubleshooting

### Tests failing locally?
1. Ensure dev server is running: `npm run dev`
2. Clear browser cache: `npx playwright test --clear-cache`
3. Update browsers: `npx playwright install`

### Timeout errors?
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Flaky tests?
- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Use `waitForResponse` for API calls
- Increase action timeout

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
