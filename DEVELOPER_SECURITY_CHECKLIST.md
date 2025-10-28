# Developer Security Checklist

Quick reference guide for secure development in PoliticianFinder project.

## Before Writing Code

### Environment Setup
- [ ] Never commit `.env` files
- [ ] Use environment variables for all secrets
- [ ] Verify `.gitignore` includes sensitive files
- [ ] Install security linting tools (Bandit, ESLint security plugin)

### Knowledge Check
- [ ] Read [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md)
- [ ] Review [SECURITY.md](./SECURITY.md) policy
- [ ] Understand OWASP Top 10
- [ ] Know the authentication flow

## Writing Database Code

### Always Do ✅
- [ ] Use SQLAlchemy ORM for all database operations
- [ ] Validate inputs with Pydantic models
- [ ] Use parameterized queries (never concatenate SQL)
- [ ] Apply length limits to all string inputs
- [ ] Use whitelist validation for sort/filter fields
- [ ] Handle database errors without exposing SQL structure

### Never Do ❌
- [ ] ~~Concatenate user input into SQL queries~~
- [ ] ~~Use `db.execute()` with f-strings~~
- [ ] ~~Trust client-side validation only~~
- [ ] ~~Log SQL queries with user data in production~~
- [ ] ~~Return raw database errors to users~~
- [ ] ~~Skip input validation because "it's internal"~~

### Code Examples

```python
# ✅ CORRECT: Using ORM
user = db.query(User).filter(User.email == email).first()

# ✅ CORRECT: Parameterized query
result = db.execute(
    text("SELECT * FROM users WHERE id = :id"),
    {"id": user_id}
)

# ❌ WRONG: String concatenation
query = f"SELECT * FROM users WHERE email = '{email}'"
db.execute(query)  # NEVER DO THIS!
```

## Writing API Endpoints

### Input Validation
- [ ] All request bodies use Pydantic models
- [ ] Path parameters are type-validated
- [ ] Query parameters have sensible defaults
- [ ] Arrays have maximum size limits
- [ ] Strings have maximum length limits

### Response Handling
- [ ] Generic error messages to users
- [ ] Detailed errors logged internally
- [ ] No SQL/stack traces in responses
- [ ] Appropriate HTTP status codes
- [ ] Consistent response structure

### Example Endpoint

```python
from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=100)
    page: int = Field(1, ge=1, le=1000)
    sort: str = Field("name", pattern="^(name|date|score)$")

@router.post("/search")
async def search(
    request: SearchRequest,  # ✅ Validated input
    db: Session = Depends(get_db)
):
    try:
        # ✅ Safe ORM query
        results = db.query(Model)\
            .filter(Model.name.ilike(f"%{request.query}%"))\
            .offset((request.page - 1) * 10)\
            .limit(10)\
            .all()
        return {"data": results}
    except Exception as e:
        logger.error(f"Search error: {e}")  # ✅ Log details
        raise HTTPException(
            status_code=500,
            detail="Search failed"  # ✅ Generic message
        )
```

## Authentication & Authorization

### Implementing Auth
- [ ] Use JWT for stateless authentication
- [ ] Validate tokens on every protected endpoint
- [ ] Check user status (active, verified)
- [ ] Implement role-based access control (RBAC)
- [ ] Use `Depends()` for auth dependency injection

### Password Handling
- [ ] Hash passwords with bcrypt (12+ rounds)
- [ ] Never log passwords (even hashed)
- [ ] Enforce password complexity
- [ ] Implement password change verification
- [ ] Rate limit login attempts

```python
# ✅ CORRECT: Secure password handling
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

## Frontend Security

### Input Handling
- [ ] Sanitize search queries
- [ ] Escape special characters for SQL LIKE
- [ ] Validate on both client and server
- [ ] Use Supabase SDK (never raw SQL)
- [ ] Implement client-side rate limiting

### Example: Safe Search

```typescript
// ✅ CORRECT: Safe search implementation
import { escapeSearchQuery } from '@/lib/api/searchHelpers'

async function searchPoliticians(query: string) {
    // Client-side validation
    if (query.length < 2 || query.length > 100) {
        throw new Error('Invalid query length')
    }

    // Escape special characters
    const safeQuery = escapeSearchQuery(query)

    // Use Supabase SDK (safe)
    const { data, error } = await supabase
        .from('politicians')
        .select('*')
        .ilike('name', `%${safeQuery}%`)

    return data
}
```

## Testing

### Security Tests Required
- [ ] SQL injection attempts in all input fields
- [ ] Authentication bypass attempts
- [ ] Authorization checks for protected resources
- [ ] Rate limiting verification
- [ ] Error message inspection (no info leakage)

### Test Template

```python
def test_sql_injection_prevention():
    """Test that SQL injection is prevented"""
    malicious_inputs = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin' --",
    ]

    for payload in malicious_inputs:
        with pytest.raises(ValidationError):
            MyPydanticModel(field=payload)

def test_error_messages_safe():
    """Verify errors don't expose SQL"""
    response = client.get("/api/resource/invalid")

    # Should be 400/404, not 500
    assert response.status_code in [400, 404]

    # Should not contain SQL keywords
    error = response.json()
    assert "SELECT" not in str(error).upper()
    assert "TABLE" not in str(error).upper()
```

## Code Review Checklist

### When Reviewing PRs
- [ ] No raw SQL queries
- [ ] All inputs validated with Pydantic
- [ ] Proper error handling (no info leakage)
- [ ] No secrets in code
- [ ] Security tests included
- [ ] No console.log with sensitive data
- [ ] Authentication/authorization checked

### Security Red Flags 🚩
- String concatenation in queries
- `db.execute()` with f-strings
- Unvalidated dictionary inputs
- Secrets in code
- Detailed error messages to users
- Missing authentication on endpoints
- Direct SQL execution

## Commit Checklist

### Before Committing
- [ ] Remove all debug logging
- [ ] No commented-out security code
- [ ] No `TODO: Security` comments
- [ ] `.env` not staged
- [ ] Security tests passing
- [ ] Linter passing (no security warnings)

### Commit Message
```
feat(api): Add politician search endpoint

- Implements input validation with Pydantic
- Uses SQLAlchemy ORM for safe queries
- Adds rate limiting
- Includes SQL injection tests

Security: Input sanitization, parameterized queries
```

## Deployment Checklist

### Pre-Deployment
- [ ] All security tests passing
- [ ] Dependencies scanned (no critical CVEs)
- [ ] Environment variables set
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] HTTPS enforced
- [ ] Database user has minimal privileges

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check security logs
- [ ] Verify rate limiting working
- [ ] Test authentication flow
- [ ] Confirm security headers present

## Common Mistakes

### Mistake 1: Trusting User Input
```python
# ❌ WRONG
def search(query: str):
    return db.execute(f"SELECT * FROM users WHERE name = '{query}'")

# ✅ RIGHT
def search(query: str):
    if not 2 <= len(query) <= 100:
        raise ValueError("Invalid query length")
    return db.query(User).filter(User.name.ilike(f"%{query}%")).all()
```

### Mistake 2: Weak Validation
```python
# ❌ WRONG
class UserRequest(BaseModel):
    username: str  # No constraints!

# ✅ RIGHT
class UserRequest(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern="^[a-zA-Z0-9_-]+$"
    )
```

### Mistake 3: Exposing Errors
```python
# ❌ WRONG
except Exception as e:
    return {"error": str(e)}  # Exposes internals!

# ✅ RIGHT
except Exception as e:
    logger.error(f"Operation failed: {e}")
    raise HTTPException(
        status_code=500,
        detail="Operation failed"
    )
```

### Mistake 4: No Rate Limiting
```python
# ❌ WRONG
@router.post("/login")
async def login(credentials: LoginRequest):
    # No rate limiting - vulnerable to brute force!

# ✅ RIGHT
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(credentials: LoginRequest):
    # Protected against brute force
```

## Quick Reference

### Pydantic Validation
```python
from pydantic import BaseModel, Field, field_validator

class SafeModel(BaseModel):
    # String with length limit
    name: str = Field(..., min_length=1, max_length=100)

    # Integer with range
    age: int = Field(..., ge=0, le=150)

    # Pattern validation
    grade: str = Field(..., pattern="^[A-F]$")

    # Custom validation
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if any(char in v for char in ["'", ";", "--"]):
            raise ValueError("Invalid characters")
        return v
```

### SQLAlchemy Safe Queries
```python
# Filter
User.query.filter(User.id == user_id)

# LIKE
User.query.filter(User.name.ilike(f"%{term}%"))

# IN
User.query.filter(User.id.in_(id_list))

# Ordering (use getattr for dynamic fields)
field = getattr(User, safe_field_name)
User.query.order_by(field.desc())
```

### Supabase Safe Queries
```typescript
// Select with filter
await supabase
    .from('table')
    .select('*')
    .eq('column', value)

// ILIKE (case-insensitive like)
await supabase
    .from('table')
    .select('*')
    .ilike('name', `%${escapedQuery}%`)

// IN clause
await supabase
    .from('table')
    .select('*')
    .in('column', valueArray)
```

## Tools

### Python
```bash
# Security linting
bandit -r api/

# Dependency scanning
pip-audit

# Type checking
mypy api/

# Run security tests
pytest tests/security/ -v
```

### JavaScript/TypeScript
```bash
# Dependency scanning
npm audit

# Security linting
npm run lint:security

# Type checking
npm run type-check
```

## Emergency Contacts

- **Security Issue**: security@internal
- **Critical Bug**: Use GitHub Security Advisory
- **Questions**: Ask in #security Slack channel

## Resources

- [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md) - Detailed guide
- [SECURITY.md](./SECURITY.md) - Security policy
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Version**: 1.0
**Last Updated**: October 17, 2024
**Keep this checklist handy during development!**