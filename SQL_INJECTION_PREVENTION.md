# SQL Injection Prevention Guide

## Table of Contents
1. [Overview](#overview)
2. [Current Implementation](#current-implementation)
3. [Security Patterns](#security-patterns)
4. [Code Examples](#code-examples)
5. [Testing Guide](#testing-guide)
6. [Developer Checklist](#developer-checklist)

## Overview

This guide provides comprehensive SQL injection prevention strategies implemented in the PoliticianFinder application. All developers must follow these guidelines when working with database operations.

### Key Principles
1. **Never trust user input** - Always validate and sanitize
2. **Use parameterized queries** - Never concatenate SQL strings
3. **Employ least privilege** - Database users should have minimal permissions
4. **Defense in depth** - Multiple layers of protection
5. **Fail securely** - Errors should not expose system information

## Current Implementation

### Backend (Python/FastAPI)

#### 1. SQLAlchemy ORM Protection
```python
# SAFE: Using ORM with automatic parameterization
evaluation = db.query(PoliticianEvaluation)\
    .filter(PoliticianEvaluation.politician_name == politician_name)\
    .first()

# NEVER DO THIS:
# query = f"SELECT * FROM evaluations WHERE name = '{politician_name}'"
# db.execute(query)  # VULNERABLE!
```

#### 2. Pydantic Input Validation
```python
from pydantic import BaseModel, Field, field_validator

class EvaluationCreate(BaseModel):
    politician_name: str = Field(..., min_length=1, max_length=100)
    grade: str = Field(..., pattern="^[SABCD]$")  # Whitelist validation
    final_score: float = Field(..., ge=0, le=100)  # Range validation

    @field_validator('politician_name')
    @classmethod
    def validate_name(cls, v):
        # Remove dangerous characters
        if any(char in v for char in [';', '--', '/*', '*/', 'DROP', 'DELETE']):
            raise ValueError("Invalid characters in name")
        return v
```

### Frontend (Next.js/TypeScript)

#### 1. Supabase Query Builder
```typescript
// SAFE: Using Supabase query builder
const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .ilike('name', `%${escapeSearchQuery(searchTerm)}%`)
    .in('party', validatedParties)

// NEVER DO THIS:
// const query = `SELECT * FROM politicians WHERE name LIKE '%${searchTerm}%'`
```

#### 2. Input Sanitization Functions
```typescript
// Escape special characters for PostgreSQL ILIKE
export function escapeSearchQuery(query: string): string {
    return query
        .replace(/\\/g, '\\\\')  // Backslash
        .replace(/%/g, '\\%')    // Percent
        .replace(/_/g, '\\_')    // Underscore
        .replace(/'/g, "''")     // Single quote
}

// Validate and sanitize search input
export function sanitizeSearchQuery(query: string): string {
    let sanitized = query.trim()

    // Remove SQL keywords (case-insensitive)
    const sqlKeywords = /\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|UNION|SELECT)\b/gi
    sanitized = sanitized.replace(sqlKeywords, '')

    // Limit length
    return sanitized.substring(0, 100)
}
```

## Security Patterns

### Pattern 1: Parameterized Queries

**Always use parameterized queries or prepared statements:**

```python
# Python - SQLAlchemy (SAFE)
user = db.query(User).filter(User.email == email).first()

# Python - Raw SQL with parameters (SAFE)
result = db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)

# TypeScript - Supabase (SAFE)
const { data } = await supabase
    .from('users')
    .select()
    .eq('email', email)
```

### Pattern 2: Whitelist Validation

**Use whitelists for dynamic query components:**

```python
# Python - Sorting with whitelist
ALLOWED_SORT_FIELDS = ['name', 'created_at', 'score']

def get_sorted_results(sort_field: str):
    if sort_field not in ALLOWED_SORT_FIELDS:
        sort_field = 'name'  # Default safe value

    return db.query(Model).order_by(getattr(Model, sort_field))
```

```typescript
// TypeScript - Sort validation
const ALLOWED_SORT_FIELDS = ['name', 'party', 'region'] as const

function validateSortField(field: string): string {
    return ALLOWED_SORT_FIELDS.includes(field as any) ? field : 'name'
}
```

### Pattern 3: Input Type Validation

**Enforce strict type checking:**

```python
# Python - Type validation with Pydantic
from pydantic import BaseModel, conint

class PaginationParams(BaseModel):
    page: conint(ge=1, le=1000) = 1  # Integer between 1-1000
    limit: conint(ge=1, le=100) = 10  # Integer between 1-100
```

```typescript
// TypeScript - Type guards
function isValidId(id: unknown): id is string {
    return typeof id === 'string' &&
           /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
}

if (!isValidId(userId)) {
    throw new Error('Invalid user ID format')
}
```

### Pattern 4: Stored Procedures (Optional)

**For critical operations, use stored procedures:**

```sql
-- PostgreSQL stored procedure
CREATE OR REPLACE FUNCTION get_politician_rating(p_id UUID)
RETURNS TABLE (
    politician_id UUID,
    average_rating DECIMAL,
    total_votes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        politician_id,
        AVG(rating) as average_rating,
        COUNT(*) as total_votes
    FROM ratings
    WHERE politician_id = p_id
    GROUP BY politician_id;
END;
$$ LANGUAGE plpgsql;
```

```python
# Call stored procedure safely
result = db.execute(
    text("SELECT * FROM get_politician_rating(:politician_id)"),
    {"politician_id": politician_id}
)
```

## Code Examples

### Safe Database Operations

#### 1. Search Implementation
```python
# services/search_service.py
from sqlalchemy import or_, and_
from typing import List, Optional

class SearchService:
    def search_politicians(
        self,
        search_term: Optional[str] = None,
        parties: Optional[List[str]] = None,
        regions: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 10
    ):
        # Base query
        query = self.db.query(Politician)

        # Search term (SAFE - using ORM)
        if search_term:
            # Clean the search term
            clean_term = search_term.strip()[:100]
            query = query.filter(
                Politician.name.ilike(f"%{clean_term}%")
            )

        # Party filter (SAFE - using IN operator)
        if parties:
            # Validate against known parties
            valid_parties = [p for p in parties if p in KNOWN_PARTIES]
            if valid_parties:
                query = query.filter(Politician.party.in_(valid_parties))

        # Pagination (SAFE - validated integers)
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        return query.all()
```

#### 2. Dynamic Filtering
```typescript
// lib/api/filters.ts
interface FilterOptions {
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'like'
    value: any
}

class SafeQueryBuilder {
    private query: any
    private allowedFields = new Set(['name', 'party', 'region', 'position'])

    addFilter(filter: FilterOptions) {
        // Validate field name against whitelist
        if (!this.allowedFields.has(filter.field)) {
            throw new Error(`Invalid field: ${filter.field}`)
        }

        // Apply filter based on operator
        switch (filter.operator) {
            case 'eq':
                this.query = this.query.eq(filter.field, filter.value)
                break
            case 'like':
                // Escape special characters for LIKE
                const escaped = this.escapeForLike(filter.value)
                this.query = this.query.ilike(filter.field, `%${escaped}%`)
                break
            case 'in':
                if (!Array.isArray(filter.value)) {
                    throw new Error('IN operator requires array value')
                }
                this.query = this.query.in(filter.field, filter.value)
                break
            // ... other operators
        }

        return this
    }

    private escapeForLike(value: string): string {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/%/g, '\\%')
            .replace(/_/g, '\\_')
    }
}
```

### Error Handling

```python
# Safe error messages that don't expose SQL structure
try:
    result = db.query(Model).filter(Model.id == user_id).first()
except SQLAlchemyError as e:
    # Log detailed error internally
    logger.error(f"Database error for user {user_id}: {str(e)}")

    # Return generic error to user
    raise HTTPException(
        status_code=500,
        detail="An error occurred while processing your request"
    )
```

## Testing Guide

### 1. Unit Tests for Input Validation

```python
# tests/test_sql_injection.py
import pytest
from app.services.search_service import SearchService

class TestSQLInjectionPrevention:

    @pytest.mark.parametrize("malicious_input", [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "admin' --",
        "' UNION SELECT * FROM users WHERE 't' = 't",
        "1; DELETE FROM politicians WHERE 1=1",
        "Robert'); DROP TABLE politicians;--"
    ])
    def test_search_handles_sql_injection(self, malicious_input):
        service = SearchService()

        # Should not raise exception and should not execute injection
        results = service.search_politicians(search_term=malicious_input)

        # Verify no damage was done
        assert service.db.query(Politician).count() > 0

    def test_validates_sort_field(self):
        service = SearchService()

        # Attempt to inject via sort field
        with pytest.raises(ValueError):
            service.get_sorted("users; DROP TABLE politicians; --")

    def test_pagination_validates_integers(self):
        service = SearchService()

        # Should handle non-integer input safely
        results = service.search_politicians(
            page="1 OR 1=1",  # Will be converted to 1
            limit="'; DROP TABLE--"  # Will be converted to 10
        )
        assert len(results) <= 10
```

### 2. Integration Tests

```typescript
// tests/api/search.test.ts
import { describe, it, expect } from '@jest/globals'

describe('Search API SQL Injection Tests', () => {
    const injectionPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE politicians; --",
        "admin'--",
        "' UNION SELECT password FROM users--"
    ]

    injectionPayloads.forEach(payload => {
        it(`should handle injection attempt: ${payload}`, async () => {
            const response = await fetch('/api/politicians/search', {
                method: 'POST',
                body: JSON.stringify({ query: payload })
            })

            expect(response.status).toBe(200)

            const data = await response.json()
            // Should return empty or filtered results, not error
            expect(Array.isArray(data.results)).toBe(true)
        })
    })
})
```

### 3. Automated Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  sql-injection-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Bandit (Python)
        run: |
          pip install bandit
          bandit -r api/ -f json -o bandit-report.json

      - name: Run SQLMap Tests
        run: |
          # Run SQLMap against test endpoints
          sqlmap -u "http://localhost:3000/api/search?q=test" \
                 --batch --level=5 --risk=3 --random-agent

      - name: Check for SQL keywords in code
        run: |
          # Ensure no raw SQL in application code
          ! grep -r "EXECUTE\|execute(" --include="*.py" --include="*.ts" \
                --exclude-dir=migrations --exclude-dir=tests api/ frontend/
```

## Developer Checklist

### Before Writing Database Code

- [ ] Am I using an ORM or query builder?
- [ ] Have I validated all user inputs?
- [ ] Are my queries parameterized?
- [ ] Have I limited the length of input strings?
- [ ] Am I using a whitelist for dynamic query components?

### Code Review Checklist

- [ ] No string concatenation in SQL queries
- [ ] All user input is validated with Pydantic/TypeScript
- [ ] Error messages don't expose database structure
- [ ] Logging doesn't contain sensitive data
- [ ] Database user has minimal required permissions

### Testing Checklist

- [ ] Unit tests include SQL injection attempts
- [ ] Integration tests verify safe handling of malicious input
- [ ] Automated security scanning is configured
- [ ] Performance tests check for ReDoS vulnerabilities
- [ ] Error handling is tested with invalid inputs

### Deployment Checklist

- [ ] Database user has least privilege
- [ ] Connection strings are in environment variables
- [ ] SQL query logging is disabled in production
- [ ] Rate limiting is configured
- [ ] WAF rules include SQL injection patterns

## Common Mistakes to Avoid

### 1. String Concatenation
```python
# NEVER DO THIS
query = f"SELECT * FROM users WHERE name = '{user_input}'"

# DO THIS INSTEAD
query = db.query(User).filter(User.name == user_input)
```

### 2. Trusting Client-Side Validation
```typescript
// WRONG: Only client-side validation
if (isValidInput(userInput)) {
    await db.raw(`SELECT * FROM table WHERE col = '${userInput}'`)
}

// RIGHT: Server-side validation + parameterization
const validated = serverValidate(userInput)
await db.select().from('table').where('col', validated)
```

### 3. Inadequate Error Handling
```python
# WRONG: Exposing database errors
try:
    result = db.execute(query)
except Exception as e:
    return {"error": str(e)}  # Exposes DB structure!

# RIGHT: Generic error messages
try:
    result = db.execute(query)
except Exception as e:
    logger.error(f"DB Error: {e}")
    return {"error": "Request failed"}
```

### 4. Forgetting About Second-Order Injection
```python
# WRONG: Storing unvalidated data
user.bio = request.bio  # Could contain SQL!
db.commit()

# Later...
query = f"SELECT * FROM posts WHERE author_bio = '{user.bio}'"  # Injection!

# RIGHT: Validate on storage AND retrieval
user.bio = sanitize(validate(request.bio))
db.commit()

# Always use parameterization even with stored data
query = db.query(Post).filter(Post.author_bio == user.bio)
```

## Resources and References

1. **OWASP SQL Injection Prevention Cheat Sheet**
   - https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

2. **SQLAlchemy Security Best Practices**
   - https://docs.sqlalchemy.org/en/14/faq/security.html

3. **Supabase Security Documentation**
   - https://supabase.com/docs/guides/auth/row-level-security

4. **PostgreSQL Security**
   - https://www.postgresql.org/docs/current/sql-prepare.html

5. **Testing Tools**
   - SQLMap: http://sqlmap.org/
   - Burp Suite: https://portswigger.net/burp
   - OWASP ZAP: https://www.zaproxy.org/

## Support

For security-related questions or to report vulnerabilities:
- Internal: security@politicianfinder.internal
- Bug Bounty: security.bounty@company.com

---

**Last Updated:** October 2024
**Version:** 1.0
**Status:** Active