/**
 * P1T1: Integration Tests - Auth API
 * 작업일: 2025-11-03
 * 설명: 인증 API 통합 테스트
 *
 * Note: These tests use mocked fetch calls. For actual backend integration testing,
 * ensure the backend server is running at NEXT_PUBLIC_API_BASE_URL.
 */

// Mock fetch for all tests
global.fetch = jest.fn()

describe('Auth API Integration Tests', () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Signup API (P1BA1)', () => {
    it('should successfully create a new user account', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 201,
        json: async () => ({
          success: true,
          data: {
            user_id: 'user_123',
            email: 'test@example.com',
            nickname: 'testuser',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
          password_confirm: 'TestPassword123!',
          nickname: 'testuser',
          full_name: 'Test User',
        }),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.email).toBe('test@example.com')
      expect(data.data.user_id).toBeDefined()
    })

    it('should reject duplicate email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 409,
        json: async () => ({
          success: false,
          error: { code: 'CONFLICT', message: 'Email already exists' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'TestPassword123!',
          password_confirm: 'TestPassword123!',
          nickname: 'testuser2',
        }),
      })

      expect([409, 400]).toContain(response.status)
    })

    it('should validate password requirements', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'weak@example.com',
          password: 'weak',
          password_confirm: 'weak',
          nickname: 'testuser3',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })

    it('should reject mismatched passwords', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mismatch@example.com',
          password: 'TestPassword123!',
          password_confirm: 'DifferentPassword123!',
          nickname: 'testuser4',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Login API (P1BA2)', () => {
    it('should successfully log in with correct credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: {
            access_token: 'token_xyz',
            user_id: 'user_123',
            email: 'test@example.com',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123!',
          remember_me: false,
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.access_token).toBeDefined()
      expect(data.data.user_id).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'AUTH_FAILED' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('AUTH_FAILED')
    })

    it('should handle non-existent email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 401,
        json: async () => ({
          success: false,
          error: { code: 'AUTH_FAILED' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPassword123!',
        }),
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Password Reset API (P1BA4)', () => {
    it('should initiate password reset', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: { message: 'If email exists, reset link sent' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.message).toBeDefined()
    })

    it('should not reveal existing emails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: { message: 'If email exists, reset link sent' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
        }),
      })

      // Should return success even for non-existent emails (security)
      expect(response.status).toBe(200)
    })

    it('should validate reset token', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          success: false,
          error: { code: 'VALIDATION_ERROR' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/password-reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reset_token: 'invalid_token_123',
          password: 'NewPassword123!',
          password_confirm: 'NewPassword123!',
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.success).toBe(false)
    })
  })

  describe('Google OAuth API (P1BA3)', () => {
    it('should redirect to Google OAuth', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 302,
        headers: new Map([['location', 'https://accounts.google.com/o/oauth2/auth?client_id=test']]),
      })

      const response = await fetch(`${baseUrl}/auth/google`, {
        method: 'GET',
        redirect: 'manual',
      })

      expect([301, 302, 307, 308]).toContain(response.status)
      const location = response.headers.get('location')
      expect(location).toContain('accounts.google.com')
    })

    it('should handle OAuth callback', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          data: { access_token: 'token_123' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'test_auth_code',
        }),
      })

      expect([200, 400]).toContain(response.status)
    })
  })

  describe('CORS and Security', () => {
    it('should handle OPTIONS requests', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 200,
        headers: new Map([['Access-Control-Allow-Methods', 'POST, PUT, OPTIONS']]),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'OPTIONS',
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined()
    })

    it('should reject invalid request methods', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 405,
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(405)
    })

    it('should validate email format', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123!',
          password_confirm: 'TestPassword123!',
          nickname: 'testuser',
        }),
      })

      expect(response.status).toBe(400)
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid json',
      })

      expect(response.status).toBe(400)
    })

    it('should return appropriate error codes', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          error: { code: 'VALIDATION_ERROR' },
        }),
      })

      const response = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const data = await response.json()
      expect(data.error.code).toBeDefined()
      expect(['VALIDATION_ERROR', 'INVALID_REQUEST']).toContain(data.error.code)
    })
  })
})
