# CORS Configuration Guide

## Overview

This document describes the Cross-Origin Resource Sharing (CORS) configuration for the PoliticianFinder application. The implementation follows OWASP security best practices and provides defense-in-depth security.

**Reference**: [OWASP CORS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)

## Table of Contents

- [Architecture](#architecture)
- [Security Features](#security-features)
- [Environment Configuration](#environment-configuration)
- [Implementation Details](#implementation-details)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

## Architecture

### Backend (FastAPI)

```
api/
├── app/
│   ├── core/
│   │   ├── cors.py         # CORS configuration module
│   │   └── config.py       # Settings with CORS support
│   └── main.py             # CORS middleware registration
```

### Frontend (Next.js)

```
frontend/
├── src/
│   └── middleware.ts       # Edge middleware for CORS
└── next.config.ts          # Security headers
```

## Security Features

### 1. Environment-Based Origins

Origins are strictly controlled based on environment:

#### Development
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

#### Staging
- `https://staging.politicianfinder.vercel.app`
- `https://politician-finder-staging.vercel.app`

#### Production
- `https://politicianfinder.vercel.app`
- `https://www.politicianfinder.com`
- `https://politicianfinder.com`

### 2. No Wildcards in Production

**Critical**: Wildcard origins (`*`) are NEVER used in production, especially with credentials enabled.

```python
# Development: Wildcards allowed for methods/headers
allow_methods = ["*"]
allow_headers = ["*"]

# Production: Explicit list only
allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
allow_headers = ["Accept", "Content-Type", "Authorization", "X-Requested-With", ...]
```

### 3. Explicit Method and Header Allowlists

Allowed HTTP Methods:
- GET
- POST
- PUT
- DELETE
- OPTIONS
- PATCH

Allowed Headers:
- Accept
- Accept-Language
- Content-Type
- Authorization
- X-Requested-With
- X-CSRF-Token
- X-Request-ID

Exposed Headers:
- Content-Type
- X-Request-ID
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

### 4. Credentials Support

Credentials are enabled to support:
- HTTP-only cookies
- Authorization headers
- Client certificates

**Important**: When credentials are enabled, origins MUST be explicit (no wildcards).

### 5. Preflight Caching

```python
max_age = 3600  # 1 hour
```

Reduces preflight requests for improved performance while maintaining security.

### 6. Request Logging

All CORS requests are logged for monitoring and security auditing:

```python
log_cors_request(origin, method, path, allowed)
```

## Environment Configuration

### Development (.env)

```env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=True
ENABLE_CORS_LOGGING=True
LOG_LEVEL=INFO
```

### Staging (.env.staging)

```env
ENVIRONMENT=staging
CORS_ORIGINS=https://staging.politicianfinder.vercel.app
CORS_CREDENTIALS=True
ENABLE_SECURITY_HEADERS=True
ENABLE_CORS_LOGGING=True
LOG_LEVEL=INFO
```

### Production (.env.production)

```env
ENVIRONMENT=production
CORS_ORIGINS=https://politicianfinder.vercel.app,https://www.politicianfinder.com
CORS_CREDENTIALS=True
ENABLE_SECURITY_HEADERS=True
ENABLE_CORS_LOGGING=True
LOG_LEVEL=WARNING
```

### Custom Origins (Optional)

Override environment defaults:

```env
CORS_ALLOWED_ORIGINS=https://custom-domain1.com,https://custom-domain2.com
```

## Implementation Details

### Backend Configuration

#### 1. CORS Module (`api/app/core/cors.py`)

Core CORS configuration with security utilities:

```python
from app.core.cors import CORSConfig, CORSSecurityHeaders

# Get environment-specific origins
origins = CORSConfig.get_origins_for_environment("production")

# Validate origin
is_valid = CORSConfig.is_origin_allowed(origin, environment)

# Get complete CORS config
config = CORSConfig.get_cors_config(environment)
```

#### 2. Settings Integration (`api/app/core/config.py`)

```python
class Settings(BaseSettings):
    # Environment-aware CORS configuration
    def get_cors_config(self) -> Dict[str, Any]:
        return CORSConfig.get_cors_config(self.ENVIRONMENT)
```

#### 3. Middleware Registration (`api/app/main.py`)

```python
# Get environment-based CORS configuration
cors_config = settings.get_cors_config()

# Register CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_config["allow_origins"],
    allow_credentials=cors_config["allow_credentials"],
    allow_methods=cors_config["allow_methods"],
    allow_headers=cors_config["allow_headers"],
    expose_headers=cors_config["expose_headers"],
    max_age=cors_config["max_age"],
)

# Custom middleware for logging and security headers
@app.middleware("http")
async def add_security_headers_and_log_cors(request, call_next):
    # Log CORS requests
    # Add security headers
    pass

# Explicit preflight handler
@app.options("/{full_path:path}")
async def preflight_handler(request, full_path):
    # Handle OPTIONS requests with proper CORS headers
    pass
```

### Frontend Configuration

#### 1. Edge Middleware (`frontend/src/middleware.ts`)

```typescript
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Handle preflight
  if (request.method === 'OPTIONS') {
    // Check origin and return appropriate headers
  }

  // Add security headers to all responses
  addSecurityHeaders(response);

  return response;
}
```

#### 2. Next.js Config (`frontend/next.config.ts`)

Security headers are configured in Next.js:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        // ... more security headers
      ]
    }
  ];
}
```

## Testing

### 1. Manual Testing

#### Test Allowed Origin

```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/v1/politicians
```

Expected response headers:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Accept, Content-Type, Authorization, ...
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

#### Test Blocked Origin

```bash
curl -H "Origin: https://malicious-site.com" \
     -X OPTIONS \
     http://localhost:8000/api/v1/politicians
```

Expected response:
```json
{
  "error": "CORS_ERROR",
  "message": "Origin not allowed",
  "origin": "https://malicious-site.com"
}
```

### 2. Automated Tests

```bash
# Run CORS tests
cd api
pytest tests/test_cors.py -v

# Run with coverage
pytest tests/test_cors.py --cov=app.core.cors --cov-report=html
```

### 3. Browser Testing

1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Make API request from frontend
4. Check response headers for CORS headers
5. Verify no CORS errors in console

### 4. Security Testing

Test for common CORS vulnerabilities:

```bash
# Test 1: Reflected origin vulnerability
curl -H "Origin: https://attacker.com" http://localhost:8000/health

# Test 2: Null origin
curl -H "Origin: null" http://localhost:8000/health

# Test 3: Wildcard with credentials
curl -H "Origin: http://localhost:3000" http://localhost:8000/health
# Should NOT return: Access-Control-Allow-Origin: *
```

## Troubleshooting

### Common Issues

#### 1. CORS Error: "No 'Access-Control-Allow-Origin' header"

**Cause**: Origin not in allowed list

**Solution**:
- Check `CORS_ORIGINS` in `.env`
- Verify environment is correct
- Check origin format (no trailing slash)

```bash
# Correct
CORS_ORIGINS=http://localhost:3000

# Incorrect
CORS_ORIGINS=http://localhost:3000/
```

#### 2. CORS Error with Credentials

**Cause**: Wildcard origin with credentials

**Solution**: Use explicit origins

```python
# Wrong
allow_origins = ["*"]
allow_credentials = True

# Correct
allow_origins = ["http://localhost:3000"]
allow_credentials = True
```

#### 3. Preflight Request Fails

**Cause**: OPTIONS request not handled

**Solution**: Verify preflight handler is registered

```python
@app.options("/{full_path:path}")
async def preflight_handler(request, full_path):
    # Handle preflight
    pass
```

#### 4. Headers Not Exposed to Frontend

**Cause**: Headers not in `expose_headers` list

**Solution**: Add headers to expose list

```python
expose_headers = [
    "Content-Type",
    "X-Request-ID",
    "X-Your-Custom-Header"
]
```

### Debugging Tips

#### 1. Enable CORS Logging

```env
ENABLE_CORS_LOGGING=True
LOG_LEVEL=DEBUG
```

#### 2. Check Logs

```bash
# Watch API logs
tail -f logs/app.log | grep CORS

# Check for blocked origins
grep "CORS Request.*Allowed: False" logs/app.log
```

#### 3. Browser DevTools

1. Network tab → Select request → Headers tab
2. Check "Request Headers" for Origin
3. Check "Response Headers" for Access-Control-* headers
4. Console tab → Look for CORS errors

## Security Checklist

### Pre-Deployment Checklist

- [ ] **No wildcards in production**
  - [ ] `allow_origins` uses explicit list
  - [ ] `allow_methods` uses explicit list (production)
  - [ ] `allow_headers` uses explicit list (production)

- [ ] **HTTPS enforcement**
  - [ ] Production origins use HTTPS only
  - [ ] HSTS header enabled
  - [ ] Mixed content warnings resolved

- [ ] **Credentials security**
  - [ ] Credentials only enabled where needed
  - [ ] No wildcard origins with credentials
  - [ ] Secure cookie settings (HttpOnly, Secure, SameSite)

- [ ] **Headers configuration**
  - [ ] Only necessary headers allowed
  - [ ] Only necessary headers exposed
  - [ ] Security headers enabled

- [ ] **Environment configuration**
  - [ ] Correct origins for each environment
  - [ ] Environment variable validation
  - [ ] No sensitive data in logs

- [ ] **Testing**
  - [ ] All CORS tests passing
  - [ ] Manual testing completed
  - [ ] Security scanning done
  - [ ] Browser testing verified

### Ongoing Monitoring

- [ ] Monitor CORS error logs
- [ ] Review blocked origins regularly
- [ ] Audit allowed origins quarterly
- [ ] Update security headers as needed
- [ ] Keep dependencies updated

## Common CORS Attack Scenarios

### 1. Origin Reflection Attack

**Attack**: Attacker tries to get server to reflect their origin

```http
Origin: https://attacker.com
```

**Defense**: Only allow explicitly configured origins

### 2. Null Origin Attack

**Attack**: Using `null` origin (e.g., from sandboxed iframe)

```http
Origin: null
```

**Defense**: Reject null origins

### 3. Subdomain Takeover

**Attack**: If `*.example.com` is allowed and subdomain is vulnerable

**Defense**: Only allow specific subdomains explicitly

### 4. Wildcard with Credentials

**Attack**: Combined wildcard + credentials exposes data

**Defense**: Never use wildcard with credentials enabled

## Best Practices

### 1. Principle of Least Privilege

- Only allow necessary origins
- Only allow necessary methods
- Only allow necessary headers
- Only expose necessary headers

### 2. Defense in Depth

- CORS configuration
- Security headers
- CSRF protection
- Rate limiting
- Authentication/authorization

### 3. Monitoring and Logging

- Log all CORS requests
- Alert on suspicious patterns
- Regular security audits
- Dependency scanning

### 4. Documentation

- Document all allowed origins
- Document reason for each origin
- Keep this guide updated
- Train team on CORS security

## Additional Resources

- [OWASP CORS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)
- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [FastAPI CORS Documentation](https://fastapi.tiangolo.com/tutorial/cors/)

## Support

For CORS configuration issues:

1. Check this documentation
2. Review application logs
3. Test with curl commands
4. Check browser DevTools
5. Contact development team

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0
**Owner**: Security Team
