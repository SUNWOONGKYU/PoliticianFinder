# Domain Setup Guide
## PoliticianFinder - Phase 5

This comprehensive guide covers custom domain setup, DNS configuration, and domain management for the PoliticianFinder application.

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Domain Registration](#domain-registration)
4. [Vercel Domain Configuration](#vercel-domain-configuration)
5. [DNS Configuration](#dns-configuration)
6. [Domain Verification](#domain-verification)
7. [Advanced Configuration](#advanced-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Overview

### What You'll Need

- Registered domain name (e.g., politicianfinder.com)
- Access to domain registrar account
- Vercel project deployed
- Basic understanding of DNS

### What This Guide Covers

- Adding custom domain to Vercel
- DNS record configuration
- Subdomain setup
- Email configuration
- Domain verification
- Common issues and solutions

---

## Prerequisites

### 1. Deployed Application

Ensure your application is deployed to Vercel:

```bash
cd frontend
vercel --prod
```

Verify deployment:
```bash
vercel ls --prod
```

### 2. Domain Ownership

You need a registered domain from a domain registrar:

**Popular Registrars:**
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare Registrar
- AWS Route 53
- Porkbun

### 3. DNS Access

Ensure you have access to:
- Domain registrar account
- DNS management interface
- Ability to modify nameservers or DNS records

---

## Domain Registration

### Choosing a Domain Name

**Best Practices:**
- Keep it short and memorable
- Avoid hyphens and numbers
- Use .com if possible (most recognized)
- Check trademark availability
- Verify social media username availability

**Example:**
```
Good: politicianfinder.com
Avoid: politician-finder-123.com
```

### Recommended Registrars

1. **Namecheap**
   - Competitive pricing
   - Free WHOIS privacy
   - Good customer support
   - https://www.namecheap.com

2. **Cloudflare Registrar**
   - At-cost pricing (no markup)
   - Integrated DNS management
   - Excellent performance
   - https://www.cloudflare.com/products/registrar/

3. **Google Domains**
   - Simple interface
   - Integrated with Google services
   - Good documentation
   - https://domains.google/

### Registration Steps

1. **Search for Domain:**
   ```
   Search: politicianfinder.com
   Check availability
   ```

2. **Select Registration Period:**
   ```
   Recommended: 1-2 years initially
   Enable auto-renewal
   ```

3. **Add WHOIS Privacy:**
   ```
   ✓ Enable WHOIS privacy protection
   Protects personal information
   ```

4. **Complete Purchase**

---

## Vercel Domain Configuration

### Step 1: Add Domain to Vercel

#### Via Vercel Dashboard

1. **Navigate to Project:**
   ```
   https://vercel.com/dashboard
   Select your project
   ```

2. **Open Domain Settings:**
   ```
   Project → Settings → Domains
   ```

3. **Add Domain:**
   ```
   Click "Add" button
   Enter: politicianfinder.com
   Click "Add"
   ```

4. **Vercel Will Provide DNS Instructions:**
   ```
   Vercel detects your domain registrar
   Provides specific DNS configuration steps
   ```

#### Via Vercel CLI

```bash
# Navigate to frontend directory
cd frontend

# Add domain
vercel domains add politicianfinder.com

# Add www subdomain
vercel domains add www.politicianfinder.com

# List domains
vercel domains ls
```

### Step 2: Choose Configuration Method

Vercel offers two methods:

#### Method A: Vercel Nameservers (Recommended)

**Advantages:**
- Fastest setup
- Automatic configuration
- Optimal performance
- Automatic SSL
- Automatic DNS updates

**Steps:**
1. Vercel provides nameservers:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
2. Update at your registrar
3. Wait for propagation
4. Done!

#### Method B: Custom DNS (A/CNAME Records)

**Advantages:**
- Keep existing nameservers
- Use existing DNS provider
- More control over DNS records
- Can manage email separately

**Steps:**
1. Vercel provides DNS values
2. Add records at your DNS provider
3. Verify configuration
4. Wait for SSL issuance

---

## DNS Configuration

### Method A: Using Vercel Nameservers

#### Step 1: Get Nameservers from Vercel

```
Vercel Dashboard → Project → Settings → Domains
Click on your domain
Note the nameservers:
  ns1.vercel-dns.com
  ns2.vercel-dns.com
```

#### Step 2: Update at Registrar

**Namecheap:**
```
1. Log in to Namecheap
2. Domain List → Manage
3. Advanced DNS / Nameservers
4. Select "Custom DNS"
5. Enter:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
6. Save Changes
```

**GoDaddy:**
```
1. Log in to GoDaddy
2. My Products → Domains
3. Click domain → Manage DNS
4. Change Nameservers
5. Enter custom nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
6. Save
```

**Cloudflare:**
```
1. Log in to Cloudflare
2. Add site
3. Follow Cloudflare's nameserver instructions
4. Then add Vercel DNS records in Cloudflare
```

**Google Domains:**
```
1. Log in to Google Domains
2. My Domains → Manage
3. DNS → Custom name servers
4. Enter:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com
5. Save
```

#### Step 3: Verify Propagation

```bash
# Check nameservers
dig NS politicianfinder.com +short

# Should return:
# ns1.vercel-dns.com.
# ns2.vercel-dns.com.

# Check A record (after propagation)
dig politicianfinder.com +short

# Should return Vercel IP
```

**Propagation Time:**
- Typically: 15 minutes to 2 hours
- Maximum: 48 hours (rare)
- Check status: https://www.whatsmydns.net/

---

### Method B: Using A/CNAME Records

#### Step 1: Get DNS Values from Vercel

```
Vercel Dashboard → Project → Settings → Domains
Click on your domain
Note the provided values:
  A Record: 76.76.21.21
  CNAME: cname.vercel-dns.com
```

#### Step 2: Add DNS Records

**For Root Domain (politicianfinder.com):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |

**For WWW Subdomain (www.politicianfinder.com):**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 3600 |

#### Step 3: Configure at DNS Provider

**Namecheap:**
```
1. Domain List → Manage → Advanced DNS
2. Add New Record:
   Type: A Record
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
3. Add New Record:
   Type: CNAME Record
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
4. Save All Changes
```

**Cloudflare:**
```
1. Dashboard → DNS
2. Add record:
   Type: A
   Name: @
   IPv4 address: 76.76.21.21
   Proxy status: Proxied (orange cloud)
3. Add record:
   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com
   Proxy status: Proxied
4. Save
```

**AWS Route 53:**
```
1. Route 53 Console → Hosted Zones
2. Select your domain
3. Create Record:
   Name: (blank for root)
   Type: A
   Value: 76.76.21.21
   TTL: 300
4. Create Record:
   Name: www
   Type: CNAME
   Value: cname.vercel-dns.com
   TTL: 300
5. Save
```

#### Step 4: Verify Configuration

```bash
# Check A record
dig politicianfinder.com +short
# Expected: 76.76.21.21

# Check CNAME
dig www.politicianfinder.com +short
# Expected: cname.vercel-dns.com (or resolved IP)

# Check from multiple locations
dig @8.8.8.8 politicianfinder.com +short
dig @1.1.1.1 politicianfinder.com +short
```

---

## Domain Verification

### Automatic Verification

Vercel automatically verifies domains:

1. **DNS Detection:**
   - Vercel checks DNS records every few minutes
   - Detects when records are correctly configured

2. **Verification Status:**
   ```
   Vercel Dashboard → Domains
   Status indicators:
   - 🟡 Pending: Waiting for DNS
   - 🟢 Active: Domain verified and working
   - 🔴 Error: Configuration issue
   ```

3. **SSL Certificate:**
   - Automatically issued after verification
   - Usually within 5-15 minutes
   - Can take up to 48 hours in rare cases

### Manual Verification

```bash
# Check domain status via CLI
vercel domains inspect politicianfinder.com

# Force verification check
vercel domains verify politicianfinder.com
```

### Verification Checklist

- [ ] DNS records configured correctly
- [ ] DNS propagated (check with dig or online tools)
- [ ] Vercel shows domain as "Active"
- [ ] SSL certificate issued
- [ ] HTTPS works: https://politicianfinder.com
- [ ] HTTP redirects to HTTPS
- [ ] www subdomain works (if configured)

---

## Advanced Configuration

### Subdomain Configuration

#### API Subdomain

```
Add: api.politicianfinder.com
Type: CNAME
Value: cname.vercel-dns.com
```

#### Staging Subdomain

```
Add: staging.politicianfinder.com
Type: CNAME
Value: cname.vercel-dns.com

Link to different Vercel project
```

### Apex Domain and WWW

**Option 1: Primary on Root (Recommended)**
```
politicianfinder.com → Main site
www.politicianfinder.com → Redirects to root
```

**Option 2: Primary on WWW**
```
www.politicianfinder.com → Main site
politicianfinder.com → Redirects to www
```

**Vercel Configuration:**
```
Vercel Dashboard → Domains
Click on domain → Redirect
Configure redirect direction
```

### Email Configuration

If you want email with your domain:

**Option 1: Google Workspace**
```
MX Records:
Priority 1: smtp.google.com
Priority 5: smtp2.google.com (optional)

SPF Record:
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

**Option 2: Microsoft 365**
```
MX Records:
Priority 0: your-domain.mail.protection.outlook.com

SPF Record:
Type: TXT
Name: @
Value: v=spf1 include:spf.protection.outlook.com -all
```

**Option 3: Email Forwarding (Cloudflare)**
```
Cloudflare → Email → Email Routing
Set up forwarding rules
No MX record configuration needed
```

**Important:** Ensure email MX records don't conflict with Vercel configuration.

### CDN Configuration

**Cloudflare as CDN:**
```
1. Add site to Cloudflare
2. Update nameservers to Cloudflare's
3. Add DNS records pointing to Vercel:
   Type: A, Name: @, Value: 76.76.21.21, Proxied
   Type: CNAME, Name: www, Value: cname.vercel-dns.com, Proxied
4. Configure Cloudflare settings:
   - SSL/TLS: Full (strict)
   - Always Use HTTPS: On
   - Automatic HTTPS Rewrites: On
```

### WWW Redirect Configuration

**Redirect www to root:**
```javascript
// vercel.json
{
  "redirects": [
    {
      "source": "https://www.politicianfinder.com/:path*",
      "destination": "https://politicianfinder.com/:path*",
      "permanent": true
    }
  ]
}
```

**Redirect root to www:**
```javascript
// vercel.json
{
  "redirects": [
    {
      "source": "https://politicianfinder.com/:path*",
      "destination": "https://www.politicianfinder.com/:path*",
      "permanent": true
    }
  ]
}
```

---

## Troubleshooting

### Issue 1: Domain Not Verifying

**Symptoms:**
- Domain stuck in "Pending" state
- "DNS configuration error" message

**Diagnosis:**
```bash
# Check DNS propagation
dig politicianfinder.com +short
dig www.politicianfinder.com +short

# Check globally
nslookup politicianfinder.com 8.8.8.8
nslookup politicianfinder.com 1.1.1.1
```

**Solutions:**

1. **Wait for DNS Propagation:**
   - Can take up to 48 hours
   - Check: https://www.whatsmydns.net/

2. **Verify DNS Records:**
   ```bash
   # Should return Vercel IP or CNAME
   dig politicianfinder.com +short
   ```

3. **Clear DNS Cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

4. **Check for Conflicting Records:**
   - Remove old A records
   - Remove old CNAME records
   - Keep only Vercel configuration

### Issue 2: SSL Certificate Not Issued

**Symptoms:**
- Browser shows certificate error
- "NET::ERR_CERT_COMMON_NAME_INVALID"

**Solutions:**

1. **Wait for Issuance:**
   - Can take 5-15 minutes after DNS verification
   - Check Vercel dashboard for status

2. **Check CAA Records:**
   ```bash
   dig politicianfinder.com CAA +short
   ```

   If CAA exists, add Let's Encrypt:
   ```
   Type: CAA
   Name: @
   Value: 0 issue "letsencrypt.org"
   ```

3. **Force Certificate Refresh:**
   ```bash
   vercel certs issue politicianfinder.com --force
   ```

### Issue 3: Domain Shows Old Content

**Symptoms:**
- Domain loads but shows wrong content
- 404 errors on domain

**Solutions:**

1. **Verify Domain Mapping:**
   ```
   Vercel Dashboard → Project → Settings → Domains
   Ensure domain is linked to correct project
   ```

2. **Check Project Deployment:**
   ```bash
   vercel ls --prod
   # Verify latest deployment
   ```

3. **Clear CDN Cache:**
   ```bash
   # If using Cloudflare
   Cloudflare Dashboard → Caching → Purge Everything
   ```

### Issue 4: WWW Not Working

**Symptoms:**
- Root domain works (politicianfinder.com)
- WWW doesn't work (www.politicianfinder.com)

**Solutions:**

1. **Add WWW Domain:**
   ```
   Vercel Dashboard → Domains → Add
   Enter: www.politicianfinder.com
   ```

2. **Configure WWW CNAME:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Verify CNAME:**
   ```bash
   dig www.politicianfinder.com CNAME +short
   ```

### Issue 5: Email Stops Working

**Symptoms:**
- Email not receiving after domain change
- MX record issues

**Solutions:**

1. **Verify MX Records:**
   ```bash
   dig politicianfinder.com MX +short
   ```

2. **Separate Email Configuration:**
   - MX records for email
   - A/CNAME records for web
   - Don't conflict

3. **Example Configuration:**
   ```
   Web:
   Type: A, Name: @, Value: 76.76.21.21
   Type: CNAME, Name: www, Value: cname.vercel-dns.com

   Email:
   Type: MX, Name: @, Priority: 1, Value: mail.example.com
   ```

---

## Best Practices

### 1. Use Both Root and WWW

Configure both domains:
```
politicianfinder.com → Primary
www.politicianfinder.com → Redirect to primary (or vice versa)
```

### 2. Enable DNSSEC

Protects against DNS spoofing:
```
Check registrar support
Enable DNSSEC at registrar
Verify: dig politicianfinder.com +dnssec
```

### 3. Set Appropriate TTL Values

```
Initial setup: Low TTL (300-600 seconds)
After stable: Higher TTL (3600-86400 seconds)
Benefits: Better performance, less DNS queries
```

### 4. Monitor DNS Health

**Tools:**
- DNSPerf: https://www.dnsperf.com/
- DNS Checker: https://dnschecker.org/
- IntoDNS: https://intodns.com/

**Monitoring Script:**
```bash
#!/bin/bash
# dns-monitor.sh

DOMAIN="politicianfinder.com"

check_dns() {
  echo "Checking DNS for $DOMAIN..."

  # Check A record
  A_RECORD=$(dig +short $DOMAIN @8.8.8.8)
  echo "A Record: $A_RECORD"

  # Check CNAME
  WWW_RECORD=$(dig +short www.$DOMAIN @8.8.8.8)
  echo "WWW CNAME: $WWW_RECORD"

  # Check MX
  MX_RECORD=$(dig +short MX $DOMAIN @8.8.8.8)
  echo "MX Record: $MX_RECORD"

  # Check response time
  RESPONSE_TIME=$(dig $DOMAIN @8.8.8.8 | grep "Query time" | awk '{print $4}')
  echo "DNS Response Time: ${RESPONSE_TIME}ms"
}

check_dns
```

### 5. Document Configuration

Keep a record of your DNS settings:

```markdown
# DNS Configuration - politicianfinder.com

## Nameservers
- ns1.vercel-dns.com
- ns2.vercel-dns.com

## DNS Records
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

## Updated
Last modified: 2025-10-17
Modified by: DevOps Team
```

### 6. Set Up Domain Monitoring

**External Monitoring:**
```yaml
# .github/workflows/domain-monitoring.yml
name: Domain Monitoring

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  check-domain:
    runs-on: ubuntu-latest
    steps:
      - name: Check Domain Resolution
        run: |
          DOMAIN="politicianfinder.com"
          IP=$(dig +short $DOMAIN @8.8.8.8 | head -1)

          if [ -z "$IP" ]; then
            echo "::error::Domain resolution failed!"
            exit 1
          fi

          echo "Domain resolves to: $IP"

      - name: Check HTTPS
        run: |
          RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://politicianfinder.com)

          if [ "$RESPONSE" != "200" ]; then
            echo "::error::HTTPS check failed with status $RESPONSE"
            exit 1
          fi

          echo "HTTPS check passed"
```

### 7. Update Application URLs

After domain setup, update:

**Supabase:**
```
Authentication → URL Configuration
Site URL: https://politicianfinder.com
Redirect URLs:
  - https://politicianfinder.com/auth/callback
  - https://politicianfinder.com/**
  - https://www.politicianfinder.com/** (if using www)
```

**Google OAuth:**
```
Google Cloud Console → Credentials
Authorized JavaScript origins:
  - https://politicianfinder.com
  - https://www.politicianfinder.com

Authorized redirect URIs:
  - https://politicianfinder.com/auth/callback
  - https://www.politicianfinder.com/auth/callback
```

**Environment Variables:**
```bash
# Update if using NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_URL=https://politicianfinder.com
```

---

## DNS Record Types Reference

### A Record
- Maps domain to IPv4 address
- Example: politicianfinder.com → 76.76.21.21

### AAAA Record
- Maps domain to IPv6 address
- Example: politicianfinder.com → 2606:4700::1

### CNAME Record
- Alias to another domain
- Example: www.politicianfinder.com → cname.vercel-dns.com

### MX Record
- Mail server configuration
- Has priority value
- Example: @ → mail.example.com (Priority 10)

### TXT Record
- Text information
- Used for SPF, DKIM, DMARC, verification
- Example: @ → v=spf1 include:_spf.google.com ~all

### NS Record
- Nameserver delegation
- Example: @ → ns1.vercel-dns.com

### CAA Record
- Certificate Authority Authorization
- Controls which CAs can issue certificates
- Example: @ → 0 issue "letsencrypt.org"

---

## Migration from Another Hosting

### Pre-Migration Checklist

- [ ] Document current DNS records
- [ ] Lower TTL values 24-48 hours before migration
- [ ] Create full DNS backup
- [ ] Test application on Vercel preview URL
- [ ] Prepare rollback plan

### Migration Steps

1. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

2. **Test Preview URL:**
   ```
   https://your-project-xxx.vercel.app
   Verify all functionality
   ```

3. **Add Domain (Don't Change DNS Yet):**
   ```
   Vercel Dashboard → Add Domain
   Note DNS instructions
   ```

4. **Update DNS Records:**
   ```
   Change A record to Vercel IP
   Update CNAME records
   Wait for propagation
   ```

5. **Monitor Traffic:**
   ```
   Check both old and new servers
   Verify traffic shifting to Vercel
   ```

6. **Verify Everything Works:**
   ```
   Test all pages and features
   Check SSL certificate
   Verify authentication flows
   ```

### Rollback Plan

If issues occur:

1. **Revert DNS:**
   ```
   Change records back to old hosting
   Wait for propagation (use old TTL)
   ```

2. **Check Status:**
   ```bash
   dig politicianfinder.com +short
   # Should return old IP
   ```

3. **Verify Old Site:**
   ```
   Confirm old site is accessible
   Check all functionality
   ```

---

## Additional Resources

### Tools
- [DNS Propagation Checker](https://www.whatsmydns.net/)
- [DNS Lookup](https://mxtoolbox.com/DNSLookup.aspx)
- [IntoDNS](https://intodns.com/)
- [DNS Speed Test](https://www.dnsperf.com/)

### Documentation
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Vercel DNS](https://vercel.com/docs/concepts/projects/domains/working-with-domains)
- [DNS Basics](https://www.cloudflare.com/learning/dns/what-is-dns/)

### Registrar Documentation
- [Namecheap DNS Setup](https://www.namecheap.com/support/knowledgebase/article.aspx/767/10/how-to-change-dns-for-a-domain/)
- [GoDaddy DNS Setup](https://www.godaddy.com/help/change-nameservers-for-my-domains-664)
- [Cloudflare DNS](https://developers.cloudflare.com/dns/)
- [Google Domains Help](https://support.google.com/domains/)

---

## Support

For domain-related issues:

1. **Vercel Support:**
   - Documentation: https://vercel.com/docs
   - Support: support@vercel.com

2. **DNS Provider Support:**
   - Contact your DNS provider's support
   - Most have live chat or ticket systems

3. **Community Help:**
   - Vercel Discord: https://vercel.com/discord
   - Stack Overflow: `vercel` tag

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
