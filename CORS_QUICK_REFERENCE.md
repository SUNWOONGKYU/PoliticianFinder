# CORS Quick Reference Guide

## Quick Setup

### 1. Backend Environment Variables

```bash
# .env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=True
ENABLE_SECURITY_HEADERS=True
ENABLE_CORS_LOGGING=True
LOG_LEVEL=INFO
```

### 2. Frontend Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Services

```bash
# Terminal 1: Backend
cd api
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

## Quick Tests

### Test 1: Basic Connectivity

```bash
# Health check
curl http://localhost:8000/health

# Expected: 200 OK
```

### Test 2: CORS from Allowed Origin

```bash
curl -H "Origin: http://localhost:3000" \
     -I http://localhost:8000/health

# Expected headers:
# Access-Control-Allow-Origin: http://localhost:3000
# Access-Control-Allow-Credentials: true
```

### Test 3: CORS Preflight

```bash
curl -X OPTIONS \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     http://localhost:8000/api/v1/politicians

# Expected: 200 OK with CORS headers
```

### Test 4: Blocked Origin

```bash
curl -X OPTIONS \
     -H "Origin: https://malicious-site.com" \
     http://localhost:8000/api/v1/politicians

# Expected: 403 Forbidden
```

### Test 5: Run Test Suite

```bash
# Linux/Mac
chmod +x test_cors.sh
./test_cors.sh

# Windows PowerShell
.\test_cors.ps1
```

## Common Issues & Solutions

### Issue: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Cause**: Origin not in allowed list

**Solution**:
```bash
# Check .env file
CORS_ORIGINS=http://localhost:3000

# Restart backend after changes
```

### Issue: "Wildcard origin with credentials"

**Cause**: Security misconfiguration

**Solution**:
```python
# DON'T
allow_origins = ["*"]
allow_credentials = True

# DO
allow_origins = ["http://localhost:3000"]
allow_credentials = True
```

### Issue: "Preflight request fails"

**Cause**: OPTIONS method not handled

**Solution**:
- Verify preflight handler in `main.py`
- Check allowed methods/headers

### Issue: "Headers not accessible in frontend"

**Cause**: Headers not exposed

**Solution**:
```python
expose_headers = [
    "Content-Type",
    "X-Request-ID",
    "X-Your-Custom-Header"  # Add your header
]
```

## Environment Cheat Sheet

### Development

```env
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
DEBUG=True
```

- Wildcards allowed for methods/headers
- HTTP allowed
- Detailed logging

### Staging

```env
ENVIRONMENT=staging
CORS_ORIGINS=https://staging.politicianfinder.vercel.app
DEBUG=False
```

- HTTPS only
- Explicit methods/headers
- Security headers enabled

### Production

```env
ENVIRONMENT=production
CORS_ORIGINS=https://politicianfinder.vercel.app,https://www.politicianfinder.com
DEBUG=False
```

- HTTPS only
- No wildcards
- All security features enabled
- Minimal logging

## Security Checklist

**Before Deployment**:

- [ ] No wildcards in production
- [ ] HTTPS only in production
- [ ] Credentials properly configured
- [ ] Security headers enabled
- [ ] Test suite passes
- [ ] No sensitive data in logs

## Quick Commands

### Check CORS Configuration

```bash
# Backend
curl http://localhost:8000/health -I | grep -i access-control

# Frontend
curl http://localhost:3000/api/test -I | grep -i access-control
```

### View Logs

```bash
# Backend logs
tail -f logs/app.log | grep CORS

# Filter blocked requests
grep "Allowed: False" logs/app.log
```

### Test Different Environments

```bash
# Development
ENVIRONMENT=development uvicorn app.main:app

# Staging
ENVIRONMENT=staging uvicorn app.main:app

# Production
ENVIRONMENT=production uvicorn app.main:app
```

## Browser DevTools Debugging

1. **Open DevTools**: F12 or Ctrl+Shift+I
2. **Network Tab**: Check request headers
3. **Console Tab**: Look for CORS errors
4. **Check Request**:
   - Request Headers → Origin
   - Response Headers → Access-Control-*
5. **Check Preflight**:
   - Look for OPTIONS request
   - Verify CORS headers

## API Endpoints

### Health Check
```bash
GET /health
```

### API Routes
```bash
GET    /api/v1/politicians
POST   /api/v1/politicians
GET    /api/v1/politicians/{id}
PUT    /api/v1/politicians/{id}
DELETE /api/v1/politicians/{id}
```

### Preflight
```bash
OPTIONS /{any_path}
```

## CORS Headers Reference

### Request Headers
- `Origin`: Origin of the request
- `Access-Control-Request-Method`: Method for preflight
- `Access-Control-Request-Headers`: Headers for preflight

### Response Headers
- `Access-Control-Allow-Origin`: Allowed origin
- `Access-Control-Allow-Methods`: Allowed methods
- `Access-Control-Allow-Headers`: Allowed headers
- `Access-Control-Allow-Credentials`: Credentials allowed
- `Access-Control-Expose-Headers`: Exposed headers
- `Access-Control-Max-Age`: Preflight cache duration

## Code Snippets

### Backend: Check if Origin is Allowed

```python
from app.core.cors import CORSConfig

is_allowed = CORSConfig.is_origin_allowed(
    origin="http://localhost:3000",
    environment="development"
)
```

### Backend: Get CORS Config

```python
from app.core.config import settings

cors_config = settings.get_cors_config()
print(cors_config)
```

### Frontend: Fetch with CORS

```typescript
const response = await fetch('http://localhost:8000/api/v1/politicians', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  credentials: 'include'
});
```

### Frontend: Check Response Headers

```typescript
const response = await fetch(url);
const corsHeader = response.headers.get('access-control-allow-origin');
console.log('CORS Origin:', corsHeader);
```

## Monitoring

### Log Analysis

```bash
# Count CORS requests
grep "CORS Request" logs/app.log | wc -l

# Find blocked requests
grep "Allowed: False" logs/app.log

# Group by origin
grep "CORS Request" logs/app.log | awk '{print $6}' | sort | uniq -c
```

### Metrics to Track

- Total CORS requests
- Blocked requests
- Origins attempting access
- Preflight request rate
- Failed authentication with CORS

## Resources

- **Full Documentation**: `CORS_CONFIGURATION.md`
- **Supabase Setup**: `SUPABASE_CORS_SETUP.md`
- **Test Suite**: `test_cors.sh` or `test_cors.ps1`
- **OWASP Guide**: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html

## Support

### Debug Steps

1. Check environment variables
2. Verify origin format (no trailing slash)
3. Check logs for CORS errors
4. Run test suite
5. Test with curl
6. Check browser DevTools

### Contact

For CORS issues:
1. Review this guide
2. Check logs
3. Run tests
4. Open issue with details

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0
