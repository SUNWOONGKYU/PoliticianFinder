# Authentication System Quick Reference Guide

## Overview

The PoliticianFinder API uses JWT (JSON Web Tokens) for authentication. This guide provides quick reference for implementing authentication in your code.

## Token Structure

### Access Token (30 minutes)
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "type": "access",
  "exp": 1234567890
}
```

### Refresh Token (7 days)
```json
{
  "user_id": 1,
  "type": "refresh",
  "exp": 1234567890
}
```

## Authentication Flow

```
1. User Registration
   POST /api/v1/auth/signup
   → User created
   → Returns user info

2. User Login
   POST /api/v1/auth/login
   → Credentials validated
   → Tokens generated
   → Returns: { access_token, refresh_token, token_type, expires_in }

3. Access Protected Route
   GET /api/v1/users/me
   Header: Authorization: Bearer <access_token>
   → Token validated
   → User retrieved
   → Returns user data

4. Token Refresh
   POST /api/v1/auth/refresh
   Body: { refresh_token }
   → New access token generated
   → Returns: { access_token, token_type, expires_in }
```

## API Endpoints

### Public Endpoints

#### Register New User
```http
POST /api/v1/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "johndoe",
  "full_name": "John Doe"
}

Response: 201 Created
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-16T00:00:00Z"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response: 200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### Protected Endpoints

#### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer <access_token>

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "bio": null,
  "avatar_url": null,
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-16T00:00:00Z",
  "updated_at": "2025-10-16T00:00:00Z",
  "last_login_at": "2025-10-16T00:00:00Z"
}
```

## Using Authentication in Code

### Backend (FastAPI)

#### Protect a Route
```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user)):
    return {"message": f"Hello {current_user.email}"}
```

#### Admin-Only Route
```python
from app.api.deps import get_current_superuser

@router.delete("/admin/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_superuser)
):
    # Only superusers can access this
    return {"message": "User deleted"}
```

#### Generate Tokens Manually
```python
from app.core.security import create_access_token, create_refresh_token
from datetime import timedelta

# Create tokens
access_token = create_access_token(
    data={"user_id": user.id, "email": user.email}
)

refresh_token = create_refresh_token(
    data={"user_id": user.id}
)
```

#### Hash and Verify Passwords
```python
from app.core.security import get_password_hash, verify_password

# Hash password
hashed = get_password_hash("password123")

# Verify password
is_valid = verify_password("password123", hashed)
```

### Frontend (JavaScript/TypeScript)

#### Login and Store Token
```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  // Store tokens
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);

  return data;
}
```

#### Make Authenticated Request
```javascript
async function fetchProtectedData() {
  const token = localStorage.getItem('access_token');

  const response = await fetch('http://localhost:8000/api/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
}
```

#### Auto-Refresh Token
```javascript
async function refreshToken() {
  const refresh_token = localStorage.getItem('refresh_token');

  const response = await fetch('http://localhost:8000/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token })
  });

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);

  return data;
}

// Axios interceptor example
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response.status === 401) {
      // Token expired, try to refresh
      await refreshToken();
      // Retry original request
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Example valid passwords:
- `MySecure123!`
- `P@ssw0rd2024`
- `Admin#2025Pass`

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

#### 403 Forbidden
```json
{
  "detail": "Inactive user"
}
```

#### 409 Conflict
```json
{
  "detail": "Email already registered"
}
```

#### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "password"],
      "msg": "Password must contain at least one uppercase letter",
      "type": "value_error"
    }
  ]
}
```

## Security Best Practices

1. **Always use HTTPS in production**
2. **Never expose SECRET_KEY**
3. **Store tokens securely** (httpOnly cookies preferred over localStorage)
4. **Implement token refresh** before access token expires
5. **Clear tokens on logout**
6. **Validate token on every protected request**
7. **Use strong passwords** and enforce password requirements
8. **Implement rate limiting** for authentication endpoints
9. **Log authentication events** for security monitoring

## Configuration

### Environment Variables
```env
# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=True
```

### Update Token Expiry
Edit `.env` file:
```env
# Short-lived access tokens (in minutes)
ACCESS_TOKEN_EXPIRE_MINUTES=15

# Long-lived refresh tokens (in days)
REFRESH_TOKEN_EXPIRE_DAYS=30
```

## Testing Authentication

### Using curl
```bash
# Register
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","username":"test"}'

# Login
TOKEN=$(curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r .access_token)

# Use token
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### Using httpx (Python)
```python
import httpx

# Login
response = httpx.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "test@example.com", "password": "Test123!"}
)
token = response.json()["access_token"]

# Use token
response = httpx.get(
    "http://localhost:8000/api/v1/users/me",
    headers={"Authorization": f"Bearer {token}"}
)
print(response.json())
```

## Troubleshooting

### "Could not validate credentials"
- Token expired → Use refresh token to get new access token
- Invalid token → Re-authenticate
- Wrong token type → Make sure using access token, not refresh token

### "Email already registered"
- Email is already in use → Use different email or login instead

### "Inactive user"
- User account disabled → Contact administrator

### "Password validation failed"
- Password doesn't meet requirements → Check password requirements above

## Reference Links

- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **FastAPI Security**: https://fastapi.tiangolo.com/tutorial/security/
- **JWT.io**: https://jwt.io/