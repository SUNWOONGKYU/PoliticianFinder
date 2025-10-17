# Testing Quick Reference - Phase 4

## Quick Start Commands

```bash
# Unit Tests (P4T1)
npm run test:unit              # Run all unit tests
npm run test:coverage          # Run with coverage report
npm run test:watch             # Watch mode for development

# E2E Tests (P4T2)
npm run test:critical          # Critical user flows
npm run test:e2e:ui            # Interactive UI mode
npm run test:e2e:headed        # Watch tests run

# Security Tests (P4T3)
npm run test:security          # OWASP security checks

# Performance Tests (P4T4)
npm run test:load              # Basic load test
npm run test:load:stress       # Stress test
npm run test:load:spike        # Spike test

# Complete Phase 4 Tests
npm run test:phase4            # Unit + E2E + Security
```

## Test Files Overview

### Unit Tests (Jest)
- `src/hooks/__tests__/usePoliticians.test.ts`
- `src/hooks/__tests__/useRatings.test.ts`
- `src/components/features/__tests__/PoliticianCard.test.tsx`
- `src/app/api/politicians/search/__tests__/route.test.ts`
- `src/lib/security/__tests__/xss-protection.test.ts`

### E2E Tests (Playwright)
- `e2e/critical-flow-auth.spec.ts`
- `e2e/critical-flow-search.spec.ts`
- `e2e/critical-flow-rating.spec.ts`
- `e2e/security-owasp.spec.ts`

### Performance Tests (K6)
- `k6/load-test-basic.js`
- `k6/load-test-stress.js`
- `k6/load-test-spike.js`

## Coverage Requirements

| Metric | Requirement | Status |
|--------|-------------|--------|
| Branches | 80% | ✓ Configured |
| Functions | 80% | ✓ Configured |
| Lines | 80% | ✓ Configured |
| Statements | 80% | ✓ Configured |

## Test Matrix

| Test Type | Tool | Files | Duration | Purpose |
|-----------|------|-------|----------|---------|
| Unit | Jest | 5 test files | ~30s | Code coverage 80%+ |
| E2E Critical | Playwright | 3 test files | ~5min | User flow validation |
| Security | Playwright | 1 test file | ~10min | OWASP Top 10 checks |
| Load Basic | K6 | 1 script | ~4min | Normal load (20 users) |
| Load Stress | K6 | 1 script | ~9min | Heavy load (150 users) |
| Load Spike | K6 | 1 script | ~3min | Spike handling (200 users) |

## Success Criteria

### P4T1: Unit Tests ✓
- [x] 80% code coverage target
- [x] Critical hooks tested
- [x] Components tested
- [x] API routes tested
- [x] Security utilities tested

### P4T2: E2E Tests ✓
- [x] Authentication flow
- [x] Search and filter flow
- [x] Rating submission flow
- [x] Cross-browser testing configured

### P4T3: Security Tests ✓
- [x] OWASP Top 10 coverage
- [x] XSS prevention
- [x] SQL injection checks
- [x] Access control validation
- [x] CSRF protection

### P4T4: Performance Tests ✓
- [x] Basic load test
- [x] Stress test
- [x] Spike test
- [x] Performance thresholds defined

## Debugging

```bash
# Unit test debugging
npm run test:watch -- --verbose

# E2E test debugging
npm run test:e2e:debug
npm run test:e2e:headed

# Performance debugging
k6 run --http-debug=full k6/load-test-basic.js
```

## CI/CD Integration

Tests are designed to run in CI/CD pipelines:
- Unit tests run on every push
- E2E tests run on PR and merge
- Security tests run daily
- Performance tests run weekly or on demand

## Documentation

Full documentation available in:
- `TEST_SUITE_P4.md` - Comprehensive testing guide
- `k6/README.md` - K6 performance testing guide
- `E2E_TESTING_GUIDE.md` - E2E testing guide

## Key Metrics

### Unit Test Coverage
- Target: 80%+
- Includes: Hooks, components, API routes, utilities

### E2E Test Coverage
- Critical paths: Authentication, Search, Rating
- Browsers: Chrome, Firefox, Safari (desktop + mobile)

### Security Coverage
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- Authentication and authorization

### Performance Thresholds
- Basic: p95 < 2s, errors < 5%
- Stress: p95 < 5s, errors < 10%
- Spike: p95 < 10s, errors < 20%
