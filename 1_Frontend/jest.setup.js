// jest.setup.js
import '@testing-library/jest-dom'

// Detect if running integration tests
const isIntegrationTest = process.env.TEST_INTEGRATION === 'true' ||
                          expect.getState().testPath?.includes('__tests__/integration');

if (!isIntegrationTest) {
  // Mock environment variables for unit tests
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
  process.env.NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

  // Setup global fetch mock for unit tests with default behavior
  global.fetch = jest.fn((url) => {
    // Return a mock response that rejects by default
    // Tests can override this with jest.mocked(fetch).mockResolvedValueOnce()
    return Promise.reject(new Error('Fetch not mocked for this test'))
  })
} else {
  // Integration tests: Use real environment variables
  // Load from .env.test.local or fall back to regular .env.local
  if (!process.env.TEST_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn('⚠️  Warning: No test database configuration found. Set TEST_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  // Don't mock fetch for integration tests
  // Integration tests use real HTTP requests
}

// Set test timeout for integration tests (30 seconds)
if (isIntegrationTest) {
  jest.setTimeout(30000);
} else {
  jest.setTimeout(10000);
}
