# Security Policy

## Overview

This document outlines the security policies, practices, and guidelines for the PoliticianFinder application. All contributors must follow these guidelines to maintain the security integrity of the application.

## Table of Contents

1. [Reporting Security Vulnerabilities](#reporting-security-vulnerabilities)
2. [Security Architecture](#security-architecture)
3. [SQL Injection Prevention](#sql-injection-prevention)
4. [Authentication & Authorization](#authentication--authorization)
5. [Data Protection](#data-protection)
6. [API Security](#api-security)
7. [Infrastructure Security](#infrastructure-security)
8. [Security Testing](#security-testing)
9. [Incident Response](#incident-response)
10. [Compliance](#compliance)

## Reporting Security Vulnerabilities

### Responsible Disclosure

We take security vulnerabilities seriously. If you discover a security issue, please follow these guidelines:

1. **DO NOT** open a public GitHub issue
2. **DO NOT** disclose the vulnerability publicly until it has been addressed
3. **DO** email security details to: [security@politicianfinder.internal]

### What to Include

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fix (if available)
- Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Triage**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 1 month

## Security Architecture

### Defense in Depth

We employ multiple layers of security:

```
┌─────────────────────────────────────┐
│   Web Application Firewall (WAF)   │
├─────────────────────────────────────┤
│   Rate Limiting Middleware          │
├─────────────────────────────────────┤
│   SQL Injection Detection           │
├─────────────────────────────────────┤
│   Input Validation (Pydantic)       │
├─────────────────────────────────────┤
│   ORM (SQLAlchemy)                  │
├─────────────────────────────────────┤
│   Database (PostgreSQL + RLS)       │
└─────────────────────────────────────┘
```

### Technology Stack Security

| Component | Technology | Security Feature |
|-----------|-----------|------------------|
| Backend | FastAPI | Automatic input validation |
| ORM | SQLAlchemy | Parameterized queries |
| Database | PostgreSQL | Row-Level Security (RLS) |
| Frontend | Next.js | Server-side rendering |
| API Client | Supabase SDK | Built-in security |
| Auth | JWT | Token-based authentication |

## SQL Injection Prevention

### Primary Defenses

1. **ORM Usage** - All database operations use SQLAlchemy ORM
2. **Parameterized Queries** - Never concatenate SQL strings
3. **Input Validation** - Pydantic models validate all inputs
4. **Whitelist Validation** - Dynamic query components use whitelists

### Implementation Guidelines

```python
# ✅ SAFE - Using ORM
user = db.query(User).filter(User.email == email).first()

# ✅ SAFE - Parameterized query
result = db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)

# ❌ NEVER DO THIS
query = f"SELECT * FROM users WHERE email = '{email}'"
db.execute(query)
```

### Validation Rules

- **String Fields**: Max length, character whitelist
- **Numeric Fields**: Range validation
- **Sort Fields**: Whitelist only
- **JSON Fields**: Schema validation

See [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md) for detailed guidelines.

## Authentication & Authorization

### Authentication Flow

```
Client Request
    ↓
Bearer Token Validation
    ↓
JWT Signature Verification
    ↓
Token Expiry Check
    ↓
User Status Check (active, verified)
    ↓
Request Processing
```

### JWT Configuration

- **Algorithm**: HS256
- **Expiry**: 60 minutes (access token)
- **Refresh**: 7 days (refresh token)
- **Secret Key**: Stored in environment variables (min 32 bytes)

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Hashed with bcrypt (12 rounds)

### Authorization Levels

| Role | Permissions |
|------|------------|
| Anonymous | Read public data |
| User | Create ratings, bookmarks |
| Premium | Unlimited evaluations |
| Admin | User management, moderation |
| Superuser | All permissions |

## Data Protection

### Sensitive Data

- **Passwords**: Hashed with bcrypt
- **API Keys**: Environment variables only
- **JWT Secrets**: Never committed to git
- **User Emails**: Encrypted at rest (optional)

### Data Classification

| Level | Examples | Protection |
|-------|----------|-----------|
| Public | Politician profiles | Basic |
| Internal | User preferences | Authentication required |
| Confidential | User emails | Encryption + access control |
| Restricted | Payment info | External service (encrypted) |

### PII Protection

Personal Identifiable Information (PII) must be:

- Collected with explicit consent
- Stored encrypted (where applicable)
- Accessible only with authorization
- Deleted upon user request (GDPR compliance)

## API Security

### Rate Limiting

```python
# Default limits
API_RATE_LIMITS = {
    "anonymous": "100/hour",
    "authenticated": "1000/hour",
    "premium": "10000/hour",
}
```

### Request Validation

- **Content-Type**: Must be application/json for POST/PUT
- **Max Body Size**: 10MB
- **Timeout**: 30 seconds
- **Parameter Validation**: All inputs validated

### CORS Configuration

```python
CORS_SETTINGS = {
    "allow_origins": [
        "https://politicianfinder.com",
        "https://www.politicianfinder.com"
    ],
    "allow_credentials": True,
    "allow_methods": ["GET", "POST", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"],
}
```

### Security Headers

```python
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
}
```

## Infrastructure Security

### Environment Variables

Never commit these to git:

```bash
# .env (NEVER COMMIT)
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
ANTHROPIC_API_KEY=...
SUPABASE_KEY=...
```

### Database Security

- **User Privileges**: Least privilege principle
- **Connection**: SSL/TLS required
- **Backups**: Encrypted, daily
- **Row-Level Security**: Enabled for user data

```sql
-- Example RLS policy
CREATE POLICY user_ratings_policy ON ratings
    FOR ALL
    USING (user_id = current_user_id());
```

### Server Hardening

- Keep dependencies updated
- Disable unnecessary services
- Use firewall rules
- Regular security patches
- Monitoring and logging

## Security Testing

### Automated Testing

```bash
# Run security tests
pytest tests/security/

# SQL injection tests
pytest tests/security/test_sql_injection.py -v

# Authentication tests
pytest tests/security/test_auth.py -v
```

### Manual Testing

Conduct regular penetration testing:

- SQL injection attempts
- Authentication bypass
- XSS vulnerabilities
- CSRF attacks
- API abuse

### Security Scanning

```bash
# Python dependency scan
pip-audit

# Python security linting
bandit -r api/

# JavaScript dependency scan
npm audit

# Container scanning (if using Docker)
docker scan politicianfinder:latest
```

### CI/CD Security

```yaml
# GitHub Actions security check
- name: Security Scan
  run: |
    bandit -r api/ -f json -o bandit-report.json
    npm audit --production
```

## Incident Response

### Severity Levels

| Level | Response Time | Description |
|-------|--------------|-------------|
| Critical | Immediate | Data breach, system compromise |
| High | 4 hours | Privilege escalation, injection |
| Medium | 24 hours | DoS, information disclosure |
| Low | 1 week | Minor security issues |

### Incident Response Plan

1. **Detection**: Monitoring alerts, user reports
2. **Containment**: Isolate affected systems
3. **Investigation**: Analyze logs, determine scope
4. **Eradication**: Remove vulnerability, patch systems
5. **Recovery**: Restore services, verify integrity
6. **Lessons Learned**: Post-mortem analysis

### Emergency Contacts

- **Security Team**: security@internal
- **DevOps Team**: devops@internal
- **On-Call Engineer**: See PagerDuty

## Compliance

### OWASP Top 10 (2021)

| Risk | Status | Mitigation |
|------|--------|-----------|
| A01 Broken Access Control | ✅ | JWT, RBAC implemented |
| A02 Cryptographic Failures | ✅ | Bcrypt, SSL/TLS |
| A03 Injection | ✅ | ORM, input validation |
| A04 Insecure Design | ✅ | Security by design |
| A05 Security Misconfiguration | ⚠️ | Regular audits needed |
| A06 Vulnerable Components | ⚠️ | Dependency scanning |
| A07 Auth Failures | ✅ | Strong password policy |
| A08 Data Integrity Failures | ✅ | Signed JWTs |
| A09 Logging Failures | ⚠️ | Enhanced logging planned |
| A10 SSRF | ✅ | Input validation |

### GDPR Compliance

- ✅ Data minimization
- ✅ Right to access (user profile API)
- ✅ Right to deletion (account deletion)
- ✅ Data portability (export API)
- ⚠️ Consent management (needs improvement)
- ⚠️ Privacy policy (needs update)

### PCI DSS

Not applicable - No card data stored directly. Payment processing delegated to certified third-party (Stripe/PayPal).

## Security Best Practices

### For Developers

- [ ] Review [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md)
- [ ] Use ORM, never raw SQL
- [ ] Validate all inputs with Pydantic
- [ ] Use environment variables for secrets
- [ ] Write security tests for new features
- [ ] Follow principle of least privilege
- [ ] Never log sensitive data
- [ ] Keep dependencies updated

### For DevOps

- [ ] Regular security patching
- [ ] Monitor security logs
- [ ] Rotate secrets quarterly
- [ ] Backup encryption keys
- [ ] Test disaster recovery
- [ ] Review access logs
- [ ] Update firewall rules

### For Code Reviewers

- [ ] Check for SQL injection risks
- [ ] Verify input validation
- [ ] Review authentication/authorization
- [ ] Check for sensitive data exposure
- [ ] Verify error handling (no info leakage)
- [ ] Review logging (no sensitive data)

## Security Checklist

### Pre-Deployment

- [ ] All tests passing (including security tests)
- [ ] Dependencies scanned (no critical vulnerabilities)
- [ ] Environment variables configured
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Logging and monitoring active
- [ ] Backup procedures tested
- [ ] Incident response plan reviewed

### Post-Deployment

- [ ] Monitor error rates
- [ ] Check security logs
- [ ] Verify rate limiting
- [ ] Test authentication flow
- [ ] Confirm backup success
- [ ] Review access patterns

## Resources

### Internal Documentation

- [SQL_INJECTION_PREVENTION.md](./SQL_INJECTION_PREVENTION.md)
- [SECURITY_AUDIT_REPORT.md](./SECURITY_AUDIT_REPORT.md)
- [API Documentation](./api/README.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [SQLAlchemy Security](https://docs.sqlalchemy.org/en/14/faq/security.html)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-10-17 | Initial security policy |

## Contact

For security-related questions or concerns:

- **Security Team**: security@politicianfinder.internal
- **Bug Bounty**: Contact via responsible disclosure process

---

**Last Updated**: October 17, 2024
**Next Review**: January 17, 2025