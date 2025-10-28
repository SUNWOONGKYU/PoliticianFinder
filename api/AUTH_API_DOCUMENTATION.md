# Authentication API Documentation

## Overview

The PoliticianFinder API implements JWT-based authentication with access and refresh tokens. This document covers all authentication and user management endpoints implemented in Phase 1.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication Flow

1. **User Registration** → Create new account
2. **User Login** → Get access & refresh tokens
3. **Authenticated Requests** → Use access token in Authorization header
4. **Token Refresh** → Use refresh token to get new access token
5. **User Profile Management** → Update profile, change password

## Endpoints

### 1. User Registration

**POST** `/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "full_name": "John Doe"
}
```

**Validation Rules:**
- Email: Valid email format
- Password: Minimum 8 characters, must include:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one digit
  - At least one special character
- Username: 3-50 characters, alphanumeric with underscores/hyphens

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": null,
  "avatar_url": null,
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-16T12:00:00",
  "updated_at": "2025-10-16T12:00:00",
  "last_login_at": null
}
```

**Error Responses:**
- `409 Conflict` - Email or username already exists
- `422 Unprocessable Entity` - Validation error

---

### 2. User Login

**POST** `/auth/login`

Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account deactivated

---

### 3. OAuth2 Compatible Login (for Swagger UI)

**POST** `/auth/login/oauth2`

OAuth2 password flow compatible endpoint.

**Request Body (form-data):**
- `username`: Email address
- `password`: Password

**Response:** Same as regular login endpoint

---

### 4. Token Refresh

**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

---

### 5. Get Current User

**GET** `/auth/me` or `/users/me`

Get authenticated user information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": "Software developer",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-16T12:00:00",
  "updated_at": "2025-10-16T12:00:00",
  "last_login_at": "2025-10-16T13:00:00"
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token

---

### 6. Update User Profile

**PATCH** `/users/me`

Update current user profile information.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body (all fields optional):**
```json
{
  "username": "newusername",
  "full_name": "New Name",
  "bio": "Updated bio",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):** Updated user object

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `409 Conflict` - Username already taken

---

### 7. Change Password

**POST** `/users/me/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer {access_token}
```

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Password successfully updated"
}
```

**Error Responses:**
- `400 Bad Request` - Current password incorrect or new password same as old
- `401 Unauthorized` - Missing or invalid token

---

### 8. Get User by ID

**GET** `/users/{user_id}`

Get user information by ID (requires authentication).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** User object

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

---

### 9. Get User by Username

**GET** `/users/username/{username}`

Get user information by username (requires authentication).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):** User object

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found

---

### 10. Logout

**POST** `/auth/logout`

Logout current user (informational endpoint).

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

Note: Actual logout should be handled client-side by removing stored tokens.

---

## Authentication Headers

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer {access_token}
```

## Token Details

- **Access Token**: Short-lived (30 minutes by default)
- **Refresh Token**: Long-lived (7 days by default)
- **Algorithm**: HS256
- **Token Type**: Bearer

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message here"
}
```

For validation errors (422):

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "validation error message",
      "type": "error_type"
    }
  ]
}
```

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt
2. **Token Security**:
   - Store tokens securely (httpOnly cookies or secure storage)
   - Never expose tokens in URLs
   - Use HTTPS in production
3. **Rate Limiting**: Consider implementing rate limiting on auth endpoints
4. **Email Verification**: Currently not implemented but field exists for future use
5. **Account Deactivation**: Soft delete implemented (is_active flag)

## Testing with cURL

### Register
```bash
curl -X POST "http://localhost:8000/api/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "username": "testuser",
    "full_name": "Test User"
  }'
```

### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Get Current User
```bash
curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Swagger UI

Interactive API documentation is available at:

```
http://localhost:8000/docs
```

Use the "Authorize" button with the OAuth2 password flow to test authenticated endpoints.

## Implementation Status

✅ **Completed:**
- User registration with validation
- Login with JWT tokens
- Token refresh mechanism
- Get current user
- Update user profile
- Change password
- Get user by ID/username
- Logout endpoint

⚠️ **Pending/Future Work:**
- Email verification
- Password reset via email
- Social login (OAuth providers)
- Two-factor authentication
- Token blacklisting
- Admin user management endpoints

---

**Last Updated:** October 16, 2025
**Version:** 1.0.0