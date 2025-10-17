# SSL Certificate Setup Guide

## Overview
This guide covers SSL/TLS certificate configuration for the PoliticianFinder application on Vercel.

## Vercel Automatic SSL

### Default Configuration
Vercel automatically provisions and manages SSL certificates for all deployments:
- **Provider:** Let's Encrypt
- **Type:** Domain Validated (DV) certificates
- **Renewal:** Automatic every 60 days
- **Coverage:** All custom domains and Vercel domains

### Features
- Free SSL certificates
- Automatic renewal
- HTTP to HTTPS redirect
- HTTPS enforced by default
- TLS 1.2 and 1.3 support

## SSL Configuration Steps

### Step 1: Domain Verification
1. Add your domain in Vercel dashboard
2. Configure DNS records as instructed
3. Wait for DNS propagation (up to 48 hours)
4. Vercel automatically provisions SSL certificate

### Step 2: Verify SSL Certificate
```bash
# Check certificate details
openssl s_client -connect politicianfinder.com:443 -servername politicianfinder.com

# Expected output:
# - Protocol: TLSv1.3
# - Cipher: TLS_AES_256_GCM_SHA384
# - Issuer: Let's Encrypt
```

### Step 3: Test HTTPS Connection
```bash
# Test HTTPS endpoint
curl -I https://politicianfinder.com

# Expected headers:
# HTTP/2 200
# strict-transport-security: max-age=31536000; includeSubDomains; preload
```

## HSTS Configuration

### Already Configured in vercel.json
```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains; preload"
}
```

### HSTS Preload Submission
1. Visit: https://hstspreload.org/
2. Enter your domain: politicianfinder.com
3. Check requirements:
   - [ ] HTTPS served on all pages
   - [ ] Redirect from HTTP to HTTPS
   - [ ] All subdomains serve HTTPS
   - [ ] HSTS header on base domain
   - [ ] max-age at least 31536000 seconds
   - [ ] includeSubDomains directive
   - [ ] preload directive
4. Submit for inclusion in browser preload lists

## Security Headers

### SSL-Related Headers (Configured)
```json
{
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

## SSL Certificate Monitoring

### Automated Monitoring
Vercel handles:
- Certificate expiration monitoring
- Automatic renewal 30 days before expiry
- Email notifications for any issues

### Manual Verification Tools
```bash
# Check certificate expiration
echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 2>/dev/null | openssl x509 -noout -dates

# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=politicianfinder.com
```

### Expected SSL Labs Score
- **Overall Rating:** A+
- **Certificate:** 100%
- **Protocol Support:** 100%
- **Key Exchange:** 90%
- **Cipher Strength:** 90%

## Troubleshooting

### Certificate Not Provisioning
**Issue:** SSL certificate not issued after domain addition

**Solutions:**
1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check domain ownership verification
4. Remove and re-add domain in Vercel
5. Contact Vercel support if persistent

```bash
# Check DNS propagation
dig politicianfinder.com
nslookup politicianfinder.com
```

### Mixed Content Warnings
**Issue:** Browser shows "Not Secure" despite HTTPS

**Solutions:**
1. Ensure all resources load via HTTPS
2. Update hardcoded HTTP URLs to HTTPS
3. Use protocol-relative URLs or HTTPS only
4. Check Content Security Policy headers

```javascript
// Bad
<img src="http://example.com/image.jpg" />

// Good
<img src="https://example.com/image.jpg" />

// Better
<img src="//example.com/image.jpg" />
```

### Certificate Mismatch
**Issue:** Certificate doesn't match domain

**Solutions:**
1. Verify domain configuration in Vercel
2. Check for typos in domain name
3. Ensure www and non-www variants covered
4. Wait for certificate reissue

## Custom SSL Certificates

### Enterprise Only
For custom certificates (not Let's Encrypt):
1. Requires Vercel Enterprise plan
2. Upload private key and certificate
3. Configure in domain settings

### Not Recommended
Vercel's automatic SSL is sufficient for most cases:
- Free
- Automatic renewal
- Industry-standard security
- No maintenance required

## Security Best Practices

### Enforce HTTPS
```javascript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Vercel automatically handles this, but as backup:
  if (request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }
}
```

### Certificate Pinning (Optional)
For mobile apps connecting to API:
```typescript
// Not needed for web, but useful for mobile apps
const CERTIFICATE_PINS = [
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB='
];
```

## Compliance Requirements

### GDPR
- SSL/TLS encryption for data in transit
- Proper data protection measures
- Secure API endpoints

### PCI DSS (if handling payments)
- TLS 1.2 or higher required
- Strong cipher suites
- Regular security assessments

### HIPAA (if handling health data)
- Encryption in transit and at rest
- Access controls
- Audit logging

## Monitoring and Alerts

### Setup SSL Monitoring
```yaml
# monitoring/ssl-check.yml
name: SSL Certificate Monitor
on:
  schedule:
    - cron: '0 0 * * *'  # Daily
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - name: Check SSL Certificate
        run: |
          EXPIRY=$(echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
          echo "Certificate expires: $EXPIRY"
```

### Third-Party Monitoring Services
- **UptimeRobot:** Free SSL monitoring
- **Pingdom:** Comprehensive monitoring
- **StatusCake:** SSL expiration alerts
- **SSL Labs:** Weekly scans

## Performance Optimization

### HTTP/2 Support
Vercel automatically enables:
- HTTP/2 protocol
- Server push (if configured)
- Multiplexing
- Header compression

### TLS Session Resumption
Enabled by default for faster connections:
- Session IDs
- Session tickets
- Reduced handshake overhead

## Documentation

### Certificate Information
- **Issuer:** Let's Encrypt Authority X3
- **Key Size:** 2048-bit RSA
- **Signature Algorithm:** SHA-256 with RSA
- **Validity Period:** 90 days
- **Renewal:** Automatic at 60 days

### Supported TLS Versions
- ✅ TLS 1.3 (Preferred)
- ✅ TLS 1.2
- ❌ TLS 1.1 (Deprecated)
- ❌ TLS 1.0 (Deprecated)
- ❌ SSL 3.0 (Insecure)
- ❌ SSL 2.0 (Insecure)

### Cipher Suites (Priority Order)
1. TLS_AES_128_GCM_SHA256
2. TLS_AES_256_GCM_SHA384
3. TLS_CHACHA20_POLY1305_SHA256
4. ECDHE-RSA-AES128-GCM-SHA256
5. ECDHE-RSA-AES256-GCM-SHA384

## Checklist

### SSL Setup Verification
- [ ] Domain added to Vercel
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] HTTPS accessible
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header present
- [ ] SSL Labs rating A or higher
- [ ] No mixed content warnings
- [ ] Certificate auto-renewal enabled
- [ ] Monitoring configured

### Security Headers
- [ ] Strict-Transport-Security
- [ ] X-Content-Type-Options
- [ ] X-Frame-Options
- [ ] X-XSS-Protection
- [ ] Referrer-Policy
- [ ] Content-Security-Policy

### Testing
- [ ] Test HTTPS connection
- [ ] Verify certificate details
- [ ] Check TLS version
- [ ] Test HTTP to HTTPS redirect
- [ ] Verify all resources load via HTTPS
- [ ] Test on multiple browsers
- [ ] Test on mobile devices

## Support and Resources

### Vercel Documentation
- SSL/TLS Certificates: https://vercel.com/docs/concepts/projects/custom-domains#ssl
- Security Headers: https://vercel.com/docs/edge-network/headers

### SSL Testing Tools
- SSL Labs: https://www.ssllabs.com/ssltest/
- Security Headers: https://securityheaders.com/
- SSL Checker: https://www.sslshopper.com/ssl-checker.html

### Certificate Authorities
- Let's Encrypt: https://letsencrypt.org/
- SSL.com: https://www.ssl.com/
- DigiCert: https://www.digicert.com/

---

**Last Updated:** 2025-10-18
**Version:** 1.0
**Status:** Production Ready
