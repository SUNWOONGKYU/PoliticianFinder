/**
 * Mock Authentication Data Store
 * Phase 1 - In-memory storage for Mock Auth APIs
 */

// Mock Users Database
export const mockUsers: Record<string, any> = {
  // Pre-seeded test user
  'test@example.com': {
    id: 'user-test-001',
    email: 'test@example.com',
    name: '테스트사용자',
    password: 'Test1234!', // In real app, this would be hashed
    marketing_agreed: false,
    role: 'user' as const,
    is_email_verified: true,
    created_at: '2025-01-01T00:00:00Z',
    avatar_url: null,
  },
};

// Mock Sessions Database (token -> user mapping)
export const mockSessions: Record<string, any> = {};

// Mock Refresh Tokens
export const mockRefreshTokens: Record<string, any> = {};

// Helper: Generate Mock Access Token
export function generateMockAccessToken(userId: string): string {
  return `mock_access_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Generate Mock Refresh Token
export function generateMockRefreshToken(userId: string): string {
  return `mock_refresh_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Validate Mock Access Token
export function validateMockAccessToken(token: string): string | null {
  const session = mockSessions[token];
  if (!session) return null;

  // Check expiration
  if (Date.now() > session.expires_at) {
    delete mockSessions[token];
    return null;
  }

  return session.user_id;
}

// Helper: Validate Mock Refresh Token
export function validateMockRefreshToken(token: string): string | null {
  const refreshToken = mockRefreshTokens[token];
  if (!refreshToken) return null;

  // Check expiration
  if (Date.now() > refreshToken.expires_at) {
    delete mockRefreshTokens[token];
    return null;
  }

  return refreshToken.user_id;
}

// Helper: Create Mock Session
export function createMockSession(userId: string, rememberMe: boolean = false) {
  const accessToken = generateMockAccessToken(userId);
  const refreshToken = generateMockRefreshToken(userId);

  const accessTokenExpiry = rememberMe
    ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    : Date.now() + 60 * 60 * 1000; // 1 hour

  const refreshTokenExpiry = Date.now() + 90 * 24 * 60 * 60 * 1000; // 90 days

  mockSessions[accessToken] = {
    user_id: userId,
    created_at: Date.now(),
    expires_at: accessTokenExpiry,
  };

  mockRefreshTokens[refreshToken] = {
    user_id: userId,
    created_at: Date.now(),
    expires_at: refreshTokenExpiry,
  };

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: rememberMe ? 30 * 24 * 60 * 60 : 60 * 60,
    expires_at: Math.floor(accessTokenExpiry / 1000),
  };
}

// Helper: Revoke Mock Session
export function revokeMockSession(accessToken: string): boolean {
  const session = mockSessions[accessToken];
  if (!session) return false;

  delete mockSessions[accessToken];
  return true;
}

// Helper: Refresh Mock Session
export function refreshMockSession(refreshToken: string): any {
  const userId = validateMockRefreshToken(refreshToken);
  if (!userId) return null;

  // Delete old refresh token
  delete mockRefreshTokens[refreshToken];

  // Create new session
  return createMockSession(userId, true);
}
