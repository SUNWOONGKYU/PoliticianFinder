# Mock Authentication APIs - Phase 1

**Task ID**: P1BA1
**Status**: Complete
**Type**: Mock APIs (Phase 1 - No real authentication)
**Created**: 2025-11-07

---

## Overview

This document describes the 6 Mock Authentication APIs implemented for Phase 1. These are **NOT real authentication APIs** - they use in-memory Mock data for testing and UI development.

**Important**: These APIs will be replaced with real Supabase Auth in Phase 3.

---

## API Endpoints Summary

| # | Endpoint | Method | Description | Status |
|---|----------|--------|-------------|--------|
| 1 | `/api/auth/signup` | POST | Mock signup | ✅ Complete |
| 2 | `/api/auth/login` | POST | Mock login | ✅ Complete |
| 3 | `/api/auth/google` | GET | Mock Google OAuth | ✅ Complete |
| 3b | `/api/auth/google/callback` | GET | Mock Google OAuth callback | ✅ Complete |
| 4 | `/api/auth/reset-password` | POST, PUT | Mock password reset | ✅ Complete |
| 5 | `/api/auth/refresh` | POST | Mock token refresh | ✅ Complete |
| 6 | `/api/auth/logout` | POST | Mock logout | ✅ Complete |

---

## 1. Signup API (회원가입)

### POST `/api/auth/signup`

**Description**: Mock user signup with validation

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "password_confirm": "Password123!",
  "nickname": "사용자이름",
  "terms_agreed": true,
  "privacy_agreed": true,
  "marketing_agreed": false
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1234567890-abc123",
      "email": "user@example.com",
      "name": "사용자이름",
      "email_confirmed": false
    },
    "message": "회원가입이 완료되었습니다. (Mock)"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Validation error
- `409 Conflict` - Email already exists
- `429 Too Many Requests` - Rate limit (3 requests per 10 minutes)

**Features**:
- ✅ Zod schema validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Password match validation
- ✅ Duplicate email check
- ✅ Rate limiting

---

## 2. Login API (로그인)

### POST `/api/auth/login`

**Description**: Mock user login with session creation

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "remember_me": false
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-1234567890-abc123",
      "email": "user@example.com",
      "name": "사용자이름",
      "avatar_url": null,
      "role": "user",
      "is_email_verified": false
    },
    "session": {
      "access_token": "mock_access_user-123_1234567890_xyz",
      "refresh_token": "mock_refresh_user-123_1234567890_abc",
      "expires_in": 3600,
      "expires_at": 1234567890
    },
    "message": "로그인에 성공했습니다. (Mock)"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit (5 requests per 5 minutes)

**Features**:
- ✅ Email/password validation
- ✅ Mock session creation
- ✅ Remember me (30 days vs 1 hour)
- ✅ Rate limiting

**Test User**:
```json
{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

---

## 3. Google OAuth API (구글 로그인)

### GET `/api/auth/google`

**Description**: Mock Google OAuth flow initiation

**Response**: 302 Redirect to `/api/auth/google/callback?code=mock_google_code_xxx`

### GET `/api/auth/google/callback`

**Description**: Mock Google OAuth callback

**Query Parameters**:
- `code`: Mock authorization code

**Response**: 302 Redirect
- Success: `/dashboard?google_login=success`
- Error: `/login?error=oauth_failed&message=xxx`

**Features**:
- ✅ Auto-creates Mock Google user
- ✅ Pre-seeded email: `google.user@example.com`
- ✅ Auto-verified email
- ✅ Mock session creation

---

## 4. Password Reset API (비밀번호 재설정)

### POST `/api/auth/reset-password`

**Description**: Mock password reset request

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "비밀번호 재설정 링크를 이메일로 발송했습니다. (Mock)"
  }
}
```

### PUT `/api/auth/reset-password`

**Description**: Mock password reset confirmation

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "NewPassword123!",
  "password_confirm": "NewPassword123!"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "비밀번호가 성공적으로 변경되었습니다. (Mock)"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Validation error / Weak password
- `404 Not Found` - User not found (PUT only)
- `429 Too Many Requests` - Rate limit (3 requests per 10 minutes)

**Features**:
- ✅ Email validation
- ✅ Password strength validation
- ✅ Security: Always returns success for POST (doesn't reveal if email exists)
- ✅ Rate limiting

---

## 5. Token Refresh API (토큰 리프레시)

### POST `/api/auth/refresh`

**Description**: Mock access token refresh

**Request Body**:
```json
{
  "refresh_token": "mock_refresh_user-123_1234567890_abc"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "mock_access_user-123_1234567891_xyz",
      "refresh_token": "mock_refresh_user-123_1234567891_abc",
      "expires_in": 2592000,
      "expires_at": 1234567891
    },
    "message": "토큰이 갱신되었습니다. (Mock)"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid/expired refresh token

**Features**:
- ✅ Refresh token validation
- ✅ New access token generation
- ✅ New refresh token generation
- ✅ Old refresh token invalidation

---

## 6. Logout API (로그아웃)

### POST `/api/auth/logout`

**Description**: Mock logout (session invalidation)

**Headers**:
```
Authorization: Bearer mock_access_user-123_1234567890_xyz
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "로그아웃되었습니다. (Mock)"
  }
}
```

**Error Responses**:
- `401 Unauthorized` - Missing/invalid authorization header

**Features**:
- ✅ Access token extraction
- ✅ Session invalidation
- ✅ Security: Always returns success (doesn't reveal session state)

---

## Mock Data Store

### Location
`C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend\src\lib\mock\authStore.ts`

### Pre-seeded Users

```typescript
{
  'test@example.com': {
    id: 'user-test-001',
    email: 'test@example.com',
    name: '테스트사용자',
    password: 'Test1234!',
    role: 'user',
    is_email_verified: true
  }
}
```

### Helper Functions

- `generateMockAccessToken(userId)` - Generate access token
- `generateMockRefreshToken(userId)` - Generate refresh token
- `validateMockAccessToken(token)` - Validate access token
- `validateMockRefreshToken(token)` - Validate refresh token
- `createMockSession(userId, rememberMe)` - Create session
- `revokeMockSession(accessToken)` - Revoke session
- `refreshMockSession(refreshToken)` - Refresh session

---

## Error Response Format

All APIs return consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자 친화적 메시지",
    "details": {} // Optional
  }
}
```

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INVALID_EMAIL` - Invalid email format
- `WEAK_PASSWORD` - Password doesn't meet requirements
- `PASSWORD_MISMATCH` - Passwords don't match
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `INVALID_CREDENTIALS` - Wrong email/password
- `UNAUTHORIZED` - Authentication required
- `USER_NOT_FOUND` - User doesn't exist
- `INVALID_REFRESH_TOKEN` - Refresh token invalid/expired
- `INTERNAL_SERVER_ERROR` - Server error

---

## Rate Limiting

| API | Rate Limit |
|-----|------------|
| Signup | 3 requests / 10 minutes |
| Login | 5 requests / 5 minutes |
| Google OAuth | 5 requests / 5 minutes |
| Password Reset | 3 requests / 10 minutes |
| Token Refresh | No limit |
| Logout | No limit |

---

## Testing

### Test with cURL

**Signup**:
```bash
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123!",
    "password_confirm": "Password123!",
    "nickname": "새사용자",
    "terms_agreed": true,
    "privacy_agreed": true
  }'
```

**Login**:
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

**Logout**:
```bash
curl -X POST http://localhost:3002/api/auth/logout \
  -H "Authorization: Bearer mock_access_user-123_1234567890_xyz"
```

### Test with Browser

1. **Google OAuth**: Navigate to `http://localhost:3002/api/auth/google`
2. **Should redirect to**: `/dashboard?google_login=success`

---

## Migration Path to Real Auth (Phase 3)

These Mock APIs will be replaced in Phase 3 with:

1. **Real Supabase Auth** integration
2. **Database-backed** user storage
3. **Real email** verification
4. **Real OAuth** with Google
5. **Secure password** hashing (bcrypt)
6. **HTTP-only cookies** for tokens
7. **Database sessions**

**No frontend changes required** - API contracts remain the same!

---

## Files Created/Modified

### New Files
1. `src/lib/mock/authStore.ts` - Mock data store
2. `src/app/api/auth/logout/route.ts` - Logout API
3. `src/app/api/auth/refresh/route.ts` - Token refresh API

### Modified Files
1. `src/app/api/auth/signup/route.ts` - Converted to Mock
2. `src/app/api/auth/login/route.ts` - Converted to Mock
3. `src/app/api/auth/google/route.ts` - Converted to Mock
4. `src/app/api/auth/google/callback/route.ts` - Converted to Mock
5. `src/app/api/auth/reset-password/route.ts` - Converted to Mock

---

## Validation Rules

### Email
- Valid email format
- Required

### Password
- Minimum 8 characters
- Maximum 128 characters
- Must contain letters and numbers (enforced by validatePasswordStrength)

### Nickname
- Minimum 2 characters
- Maximum 100 characters

---

## CORS Configuration

All APIs support CORS with:
- Methods: GET, POST, PUT, OPTIONS
- Headers: Content-Type, Authorization
- Origin: * (all origins - for development)

---

**Status**: All 6 Auth APIs implemented and ready for Phase 1 testing
**Next Step**: Frontend integration and E2E testing
