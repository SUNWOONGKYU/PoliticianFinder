# E2E Tests Quick Start Guide

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers (first time only):
```bash
npx playwright install
```

## Running Tests

### Development Mode (Recommended)

Run tests in interactive UI mode:
```bash
npm run test:e2e:ui
```

### Run All Tests

Run all tests in headless mode:
```bash
npm run test:e2e
```

### Run Specific Browser

```bash
npm run test:e2e:chromium   # Chrome
npm run test:e2e:firefox    # Firefox
npm run test:e2e:mobile     # Mobile Chrome
```

### Debug Mode

Run tests with Playwright Inspector:
```bash
npm run test:e2e:debug
```

### View Test Report

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

## Test Files

- `politician-detail.spec.ts` - Main E2E tests (70+ test cases)
- `politician-detail-integration.spec.ts` - Integration tests with real API

## Running Specific Tests

### Run specific test file:
```bash
npx playwright test politician-detail.spec.ts
```

### Run specific test by name:
```bash
npx playwright test -g "should load politician detail page"
```

### Run specific test by line number:
```bash
npx playwright test politician-detail.spec.ts:42
```

## Test Modes

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Slow Motion (Debugging)
```bash
npx playwright test --headed --slow-mo=1000
```

### Single Worker (No Parallel)
```bash
npx playwright test --workers=1
```

## Integration Tests

Integration tests require backend API to be running.

### Skip integration tests:
```bash
SKIP_INTEGRATION=1 npm run test:e2e
```

### Run only integration tests:
```bash
npx playwright test politician-detail-integration.spec.ts
```

## Common Issues

### Dev server not running
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### Browsers not installed
```bash
npx playwright install
```

### Port 3000 already in use
```bash
# Change port in playwright.config.ts
baseURL: 'http://localhost:3001'
```

## Test Structure

```
e2e/
├── politician-detail.spec.ts        # Main tests
├── politician-detail-integration.spec.ts  # Integration tests
├── fixtures/
│   └── politician-data.ts           # Mock data
└── helpers/
    ├── api-mock.ts                  # API mocking
    └── viewport.ts                  # Responsive testing
```

## Environment Variables

```bash
# Base URL for tests
PLAYWRIGHT_BASE_URL=http://localhost:3000

# API URL for integration tests
API_URL=http://localhost:8000

# Skip integration tests
SKIP_INTEGRATION=1
```

## Quick Commands Cheat Sheet

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:headed` | Show browser |
| `npm run test:e2e:debug` | Debug with inspector |
| `npm run test:e2e:report` | View HTML report |
| `npm run test:e2e:chromium` | Chrome only |
| `npm run test:e2e:firefox` | Firefox only |
| `npm run test:e2e:mobile` | Mobile Chrome |

## Next Steps

1. Start dev server: `npm run dev`
2. Run tests: `npm run test:e2e:ui`
3. View results in the UI
4. Check test report: `npm run test:e2e:report`

## Documentation

- Full documentation: `e2e/README.md`
- Implementation report: `P2T3_TEST_IMPLEMENTATION_REPORT.md`
- Playwright docs: https://playwright.dev/
