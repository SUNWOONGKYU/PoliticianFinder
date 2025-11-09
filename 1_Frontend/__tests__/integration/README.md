# Integration Tests

Integration tests for PoliticianFinder API + Database operations.

## Overview

These integration tests verify that API routes work correctly with the Supabase database:

- **auth-flow.test.ts**: Complete authentication flow (signup → login → update → logout)
- **api-db.test.ts**: API + Database operations (CRUD, RLS policies, transactions)

## Setup

### 1. Environment Variables

Create a `.env.test.local` file or set environment variables:

```bash
# Test Database Configuration
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your_test_anon_key
TEST_SUPABASE_SERVICE_KEY=your_test_service_role_key
```

**Important**: Use a separate test Supabase project or test database to avoid affecting production data.

### 2. Test Database Options

#### Option A: Separate Supabase Test Project (Recommended)

1. Create a new Supabase project for testing
2. Run the same database migrations as your main project
3. Set `TEST_SUPABASE_URL` and keys to the test project

#### Option B: Same Project with Test Schema

1. Use the same Supabase project
2. Create a separate schema for tests
3. Configure tests to use test schema

#### Option C: Local PostgreSQL

1. Install PostgreSQL locally
2. Run Supabase locally: `npx supabase start`
3. Use local connection strings

### 3. Database Schema

Ensure your test database has all required tables:

- `users` - User profiles
- `posts` - User posts
- `comments` - Post comments
- `notifications` - User notifications
- RLS policies configured

## Running Tests

### Run All Integration Tests

```bash
npm test -- __tests__/integration
```

### Run Specific Test File

```bash
npm test -- __tests__/integration/auth-flow.test.ts
npm test -- __tests__/integration/api-db.test.ts
```

### Run in Watch Mode

```bash
npm test -- --watch __tests__/integration
```

### Run with Coverage

```bash
npm test -- --coverage __tests__/integration
```

## Test Structure

### setup.ts

Provides utilities for integration tests:

- `createTestClient()` - Create test Supabase client
- `createAdminClient()` - Create admin client (bypasses RLS)
- `createTestUser()` - Create test user
- `loginTestUser()` - Login and get session
- `createTestPost()` - Create test post
- `createTestComment()` - Create test comment
- `cleanupTestData()` - Clean up test data

### auth-flow.test.ts

Tests authentication flows:

- User registration → Database user creation
- Login → JWT token generation
- Profile update → Database update verification
- Logout → Session cleanup
- Session management
- User ban flow

### api-db.test.ts

Tests API + Database integration:

- **Post CRUD**: Create, Read, Update, Delete posts
- **Comment Operations**: Create comments, cascade delete
- **RLS Policies**: User access control, public/private data
- **Concurrent Operations**: Multiple simultaneous operations
- **Data Integrity**: Foreign keys, referential integrity
- **Transactions**: Rollback on errors

## Test Data Cleanup

Tests automatically clean up data after each test using:

- `afterEach()` - Cleans up test users and related data
- `afterAll()` - Final cleanup of tracked users

To manually clean up all test data:

```typescript
import { cleanupAllTestData } from './setup';
await cleanupAllTestData(); // Deletes all users with @test.com emails
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach()`
3. **Real Data**: Use real database, not mocks
4. **Unique Data**: Generate unique emails/data for each test
5. **Fast Tests**: Keep tests fast by limiting data creation
6. **Error Handling**: Test both success and error cases
7. **RLS Testing**: Verify Row Level Security policies work

## Troubleshooting

### Tests Fail with "User already exists"

- Ensure cleanup is running properly
- Check that `generateTestEmail()` creates unique emails
- Verify test database is being used (not production)

### Tests Fail with "Unauthorized"

- Check that test user is being logged in
- Verify session/token is being passed correctly
- Check RLS policies allow the operation

### Tests Are Slow

- Use a dedicated test database
- Reduce test data volume
- Run tests in parallel (Jest default)
- Use local Supabase instance

### Database Connection Errors

- Verify `TEST_SUPABASE_URL` is correct
- Check network connectivity
- Ensure Supabase project is active
- Verify API keys are valid

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `TEST_SUPABASE_URL` | Yes | Test Supabase project URL |
| `TEST_SUPABASE_ANON_KEY` | Yes | Test project anon key |
| `TEST_SUPABASE_SERVICE_KEY` | Yes | Test project service role key (admin) |

If test environment variables are not set, tests will fall back to regular environment variables (`NEXT_PUBLIC_SUPABASE_URL`, etc.), but this is **not recommended** for safety.

## CI/CD Integration

For GitHub Actions or other CI/CD:

```yaml
# .github/workflows/test.yml
env:
  TEST_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
  TEST_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
  TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test -- __tests__/integration
```

## Next Steps

- Add more integration tests for other API routes
- Test file upload integration
- Test email sending integration
- Test payment processing integration
- Add performance tests
