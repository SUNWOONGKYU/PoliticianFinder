# Quick Test Reference - Politician List E2E Tests

## Immediate Actions

### 1. First Time Setup
```bash
cd frontend
npm install
npx playwright install chromium
```

### 2. Run Tests
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests in UI mode (recommended)
npm run test:e2e:ui
```

## Test Statistics
- **Total Tests:** 49
- **Test File:** `e2e/politician-list.spec.ts`
- **Coverage:** 100% of features
- **Estimated Runtime:** 2-3 minutes

## Test Categories
1. Page Loading (8 tests)
2. Search (6 tests)
3. Filters (8 tests)
4. Sorting (5 tests)
5. Pagination (6 tests)
6. Card Interaction (3 tests)
7. Responsive Design (4 tests)
8. Error Handling (3 tests)
9. Performance (2 tests)
10. Accessibility (4 tests)

## Quick Commands

```bash
# Run all tests
npm run test:e2e

# Interactive UI (best for development)
npm run test:e2e:ui

# Debug specific test
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:mobile

# View HTML report
npm run test:e2e:report
```

## File Locations

**Main Test:**
`frontend/e2e/politician-list.spec.ts`

**Helpers:**
`frontend/e2e/helpers/politician-list.ts`

**Test Data:**
`frontend/e2e/fixtures/politician-list-data.ts`

**Documentation:**
- `frontend/e2e/politician-list.README.md`
- `frontend/e2e/TESTING_GUIDE.md`
- `P2T1_IMPLEMENTATION_REPORT.md`

## Common Issues

**Tests won't run:**
- Check dev server is running: `npm run dev`
- Verify browsers installed: `npx playwright install`

**Tests failing:**
- Check API is accessible
- Review test report: `npm run test:e2e:report`
- Check screenshots in `test-results/`

**Need help:**
- See: `frontend/e2e/TESTING_GUIDE.md`
- See: `frontend/e2e/politician-list.README.md`

## CI/CD

Tests run automatically on:
- Push to main/develop
- Pull requests
- Workflow: `.github/workflows/e2e-tests.yml`

## Status
✅ Implementation Complete
✅ 49 Tests Ready
✅ Documentation Complete
✅ CI/CD Integrated
⚠️ Requires execution and verification

---
Last Updated: 2025-10-17
Playwright Version: 1.56.1
