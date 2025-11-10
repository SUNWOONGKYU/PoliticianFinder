// jest.setup.integration.js
// Issue #2: Integration test setup - NO fetch mocking, real Supabase calls

require('@testing-library/jest-dom')

// Integration tests: Use real environment variables
// Load from .env.test.local or fall back to regular .env.local
if (!process.env.TEST_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️  Warning: No test database configuration found. Set TEST_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
}

// DO NOT mock fetch for integration tests
// Integration tests use real HTTP requests to Supabase

// Set longer timeout for integration tests (30 seconds)
jest.setTimeout(30000);

// Mock only console methods to reduce noise
global.console = {
  ...console,
  // Suppress console.log in tests unless there's an error
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn
  error: console.error,
  warn: console.warn,
};
