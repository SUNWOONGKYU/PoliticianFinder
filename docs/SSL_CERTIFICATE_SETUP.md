# SSL Certificate Setup Guide
## PoliticianFinder - Phase 5

This guide covers SSL/TLS certificate setup and management for the PoliticianFinder application.

## Table of Contents
1. [Overview](#overview)
2. [Vercel Automatic SSL](#vercel-automatic-ssl)
3. [Custom Domain SSL](#custom-domain-ssl)
4. [Certificate Renewal](#certificate-renewal)
5. [Troubleshooting](#troubleshooting)
6. [Security Best Practices](#security-best-practices)

---

## Overview

### What is SSL/TLS?

SSL (Secure Sockets Layer) and TLS (Transport Layer Security) are cryptographic protocols that provide secure communication over the internet. They:

- Encrypt data between client and server
- Verify server identity
- Protect against man-in-the-middle attacks
- Enable HTTPS connections

### Why SSL is Required

- **Security**: Protects user data and credentials
- **Trust**: Users expect HTTPS for modern websites
- **SEO**: Google ranks HTTPS sites higher
- **Features**: Required for modern web APIs (Service Workers, WebAuthn, etc.)
- **Compliance**: Required for handling sensitive data

---

## Vercel Automatic SSL

Vercel provides automatic SSL certificates through Let's Encrypt for all deployments.

### Default SSL Features

1. **Automatic Certificate Issuance**
   - Certificates are automatically issued when you deploy
   - No configuration required
   - Works for both Vercel domains and custom domains

2. **Automatic Renewal**
   - Certificates are automatically renewed before expiration
   - No manual intervention needed
   - Zero downtime during renewal

3. **Modern TLS Configuration**
   - TLS 1.2 and 1.3 support
   - Strong cipher suites
   - HTTP/2 and HTTP/3 support

### Vercel Domain SSL

When you deploy to Vercel, your application automatically gets SSL:

```
https://your-project.vercel.app
https://your-project-git-branch.vercel.app
```

**Setup Steps:**
1. Deploy your application to Vercel
2. SSL is automatically enabled
3. Access your site via HTTPS

**Verification:**
```bash
# Check SSL certificate
curl -vI https://your-project.vercel.app

# Should show:
# * SSL connection using TLSv1.3
# * Server certificate: *.vercel.app
```

---

## Custom Domain SSL

### Prerequisites

- Custom domain registered (e.g., politicianfinder.com)
- Access to domain DNS settings
- Vercel project deployed

### Step 1: Add Custom Domain

1. **Via Vercel Dashboard:**
   ```
   Project → Settings → Domains → Add Domain
   ```

2. **Enter Your Domain:**
   ```
   politicianfinder.com
   www.politicianfinder.com
   ```

3. **Vercel Will Provide DNS Instructions**

### Step 2: Configure DNS

#### Option A: Using Vercel Nameservers (Recommended)

**Advantages:**
- Fastest SSL issuance
- Automatic configuration
- Optimal performance

**Steps:**
1. Go to your domain registrar
2. Update nameservers to Vercel's:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. Wait for DNS propagation (up to 48 hours)
4. SSL certificate automatically issued

#### Option B: Using A/CNAME Records

**Advantages:**
- Keep existing nameservers
- More control over DNS

**Steps:**

1. **For Root Domain (politicianfinder.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

2. **For WWW Subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

3. **Verify DNS Configuration:**
   ```bash
   # Check A record
   dig politicianfinder.com +short
   # Should return: 76.76.21.21

   # Check CNAME
   dig www.politicianfinder.com +short
   # Should return: cname.vercel-dns.com
   ```

### Step 3: SSL Certificate Issuance

Once DNS is configured:

1. **Automatic Issuance:**
   - Vercel detects DNS changes
   - Initiates Let's Encrypt certificate request
   - Validates domain ownership
   - Issues certificate

2. **Issuance Time:**
   - Typical: 5-15 minutes after DNS propagation
   - Can take up to 48 hours for full DNS propagation

3. **Verification:**
   ```bash
   # Check certificate
   echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 2>/dev/null | openssl x509 -noout -dates

   # Should show:
   # notBefore=<issue date>
   # notAfter=<expiration date (90 days)>
   ```

### Step 4: HTTPS Enforcement

Vercel automatically redirects HTTP to HTTPS:

```bash
# Test redirect
curl -I http://politicianfinder.com

# Should show:
# HTTP/1.1 308 Permanent Redirect
# Location: https://politicianfinder.com/
```

---

## Certificate Renewal

### Automatic Renewal

Let's Encrypt certificates are valid for 90 days and automatically renewed by Vercel:

**Renewal Schedule:**
- Renewal starts 30 days before expiration
- Multiple retry attempts if initial renewal fails
- No downtime during renewal

**Monitoring Renewal:**

1. **Check Certificate Expiration:**
   ```bash
   # Get certificate expiration date
   echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 2>/dev/null | openssl x509 -noout -enddate
   ```

2. **Vercel Dashboard:**
   ```
   Project → Settings → Domains
   View certificate status for each domain
   ```

### Manual Renewal (If Needed)

If automatic renewal fails:

1. **Via Vercel Dashboard:**
   ```
   Project → Settings → Domains
   Click on domain → Refresh Certificate
   ```

2. **Via Vercel CLI:**
   ```bash
   vercel certs issue politicianfinder.com
   ```

### Renewal Alerts

Set up monitoring to track certificate expiration:

```javascript
// Example monitoring script
const https = require('https');

function checkCertExpiration(domain) {
  const options = {
    hostname: domain,
    port: 443,
    method: 'GET'
  };

  const req = https.request(options, (res) => {
    const cert = res.socket.getPeerCertificate();
    const validTo = new Date(cert.valid_to);
    const daysUntilExpiry = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24));

    console.log(`Certificate expires in ${daysUntilExpiry} days`);

    if (daysUntilExpiry < 30) {
      console.warn(`Warning: Certificate expires soon!`);
    }
  });

  req.end();
}

checkCertExpiration('politicianfinder.com');
```

---

## Troubleshooting

### Issue 1: SSL Certificate Not Issued

**Symptoms:**
- Domain shows "Certificate error"
- Browser warning about untrusted certificate

**Causes:**
- DNS not properly configured
- DNS not propagated yet
- CAA records blocking Let's Encrypt

**Solutions:**

1. **Verify DNS Configuration:**
   ```bash
   # Check DNS propagation
   dig politicianfinder.com @8.8.8.8
   dig politicianfinder.com @1.1.1.1

   # Should return Vercel IP
   ```

2. **Check CAA Records:**
   ```bash
   # Check CAA records
   dig politicianfinder.com CAA +short

   # If CAA exists, ensure it allows Let's Encrypt:
   # 0 issue "letsencrypt.org"
   ```

3. **Force Certificate Renewal:**
   ```bash
   # Via Vercel CLI
   vercel certs issue politicianfinder.com --force
   ```

### Issue 2: Mixed Content Warnings

**Symptoms:**
- Browser shows "Not Secure" warning
- Console shows mixed content errors

**Cause:**
- Loading HTTP resources on HTTPS page

**Solution:**

1. **Update Resource URLs:**
   ```javascript
   // Before
   <img src="http://example.com/image.jpg" />

   // After
   <img src="https://example.com/image.jpg" />
   ```

2. **Use Protocol-Relative URLs:**
   ```javascript
   // Automatically uses current protocol
   <img src="//example.com/image.jpg" />
   ```

3. **Content Security Policy:**
   ```javascript
   // next.config.ts
   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           {
             key: 'Content-Security-Policy',
             value: "upgrade-insecure-requests"
           }
         ]
       }
     ];
   }
   ```

### Issue 3: Certificate Mismatch

**Symptoms:**
- "Certificate name mismatch" error
- Certificate shows wrong domain

**Causes:**
- Accessing site via different domain
- DNS misconfiguration

**Solutions:**

1. **Ensure All Domains Are Added:**
   - Add both root and www domains to Vercel
   - Add all required subdomains

2. **Use Correct Domain:**
   - Access site using exact domain in certificate
   - Set up proper redirects

### Issue 4: HSTS Issues

**Symptoms:**
- Cannot access HTTP version
- Browser forces HTTPS even after removing

**Cause:**
- HSTS header cached in browser

**Solution:**

1. **Clear HSTS Cache (Chrome):**
   ```
   chrome://net-internals/#hsts
   Search for domain
   Click "Delete domain security policies"
   ```

2. **Wait for HSTS Expiry:**
   - HSTS headers have max-age parameter
   - Wait for expiry (typically 31536000 seconds = 1 year)

---

## Security Best Practices

### 1. Use Strong TLS Configuration

Vercel automatically uses strong TLS settings:

```
✓ TLS 1.2 and 1.3 only
✓ Strong cipher suites
✓ Perfect Forward Secrecy (PFS)
✓ OCSP Stapling
✓ HTTP/2 and HTTP/3
```

### 2. Enable HSTS

Add HSTS header to force HTTPS:

```javascript
// next.config.ts
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ];
}
```

**HSTS Preload Submission:**
1. Visit https://hstspreload.org/
2. Submit your domain
3. Wait for inclusion in browser preload lists

### 3. Redirect HTTP to HTTPS

Vercel automatically redirects, but verify:

```bash
# Test redirect
curl -I http://politicianfinder.com

# Should return 308 to HTTPS
```

### 4. Update Supabase URLs

After enabling custom domain:

```
Supabase Dashboard → Authentication → URL Configuration
Site URL: https://politicianfinder.com
Redirect URLs:
  - https://politicianfinder.com/auth/callback
  - https://politicianfinder.com/**
```

### 5. Monitor Certificate Health

**Automated Monitoring:**

```yaml
# .github/workflows/ssl-monitoring.yml
name: SSL Certificate Monitoring

on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly
  workflow_dispatch:

jobs:
  check-ssl:
    runs-on: ubuntu-latest
    steps:
      - name: Check Certificate
        run: |
          DOMAIN="politicianfinder.com"
          EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
          EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
          NOW_EPOCH=$(date +%s)
          DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

          echo "Certificate expires in $DAYS_LEFT days"

          if [ $DAYS_LEFT -lt 30 ]; then
            echo "::warning::Certificate expires soon!"
            exit 1
          fi
```

**External Monitoring Services:**
- SSL Labs: https://www.ssllabs.com/ssltest/
- Certificate Transparency Logs: https://crt.sh/
- UptimeRobot: SSL certificate monitoring

### 6. Test SSL Configuration

**Online Tools:**
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)

**Target Scores:**
- SSL Labs: A+ rating
- Mozilla Observatory: A rating
- All security headers implemented

---

## Certificate Details

### Let's Encrypt Certificate Information

**Certificate Authority:** Let's Encrypt (ISRG Root X1)

**Certificate Properties:**
- **Type:** Domain Validated (DV)
- **Validity:** 90 days
- **Algorithm:** RSA 2048-bit or ECDSA P-256
- **Signature:** SHA-256 with RSA
- **Renewal:** Automatic, starting 30 days before expiration

**Certificate Chain:**
```
Root CA: ISRG Root X1
  ↓
Intermediate CA: R3 or E1
  ↓
Your Certificate: politicianfinder.com
```

### Viewing Certificate Details

**Browser:**
1. Click padlock icon in address bar
2. Click "Certificate" or "Connection is secure"
3. View certificate details

**Command Line:**
```bash
# Full certificate details
echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 2>/dev/null | openssl x509 -noout -text

# Certificate chain
echo | openssl s_client -servername politicianfinder.com -connect politicianfinder.com:443 -showcerts 2>/dev/null
```

---

## Compliance and Standards

### GDPR Compliance
- SSL/TLS encryption required for personal data
- Vercel's SSL meets GDPR requirements

### PCI DSS Compliance
- TLS 1.2+ required
- Strong cipher suites required
- Vercel's configuration meets PCI DSS 3.2.1

### HIPAA Compliance
- Encryption in transit required
- SSL/TLS meets HIPAA technical safeguards

---

## Additional Resources

### Documentation
- [Vercel SSL Documentation](https://vercel.com/docs/concepts/projects/custom-domains#ssl)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

### Tools
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [OpenSSL Toolkit](https://www.openssl.org/)
- [certbot (Let's Encrypt CLI)](https://certbot.eff.org/)

### Learning Resources
- [How HTTPS Works](https://howhttps.works/)
- [TLS 1.3 Overview](https://www.cloudflare.com/learning/ssl/what-is-tls/)
- [Certificate Transparency](https://certificate.transparency.dev/)

---

## Support

For SSL-related issues:

1. **Vercel Support:**
   - Dashboard: Help & Support
   - Email: support@vercel.com

2. **Let's Encrypt Community:**
   - Forum: https://community.letsencrypt.org/

3. **Project Issues:**
   - GitHub: [Project Repository]/issues

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
