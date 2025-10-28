# Domain Connection Guide

## Overview
This guide explains how to connect a custom domain to the PoliticianFinder application hosted on Vercel.

## Prerequisites
- Domain name purchased (e.g., politicianfinder.com)
- Access to domain registrar DNS settings
- Vercel project deployed
- Vercel account with appropriate permissions

## Step 1: Choose Your Domain Configuration

### Option A: Root Domain (Recommended)
- Primary: `politicianfinder.com`
- Redirect: `www.politicianfinder.com` → `politicianfinder.com`

### Option B: WWW Subdomain
- Primary: `www.politicianfinder.com`
- Redirect: `politicianfinder.com` → `www.politicianfinder.com`

### Option C: Both (Best for SEO)
- Both accessible
- Canonical URL set via meta tags

## Step 2: Add Domain in Vercel

### Via Vercel Dashboard
1. Navigate to your project
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter your domain: `politicianfinder.com`
5. Click **Add**

### Via Vercel CLI
```bash
# Add domain
vercel domains add politicianfinder.com

# List domains
vercel domains list

# Remove domain (if needed)
vercel domains remove politicianfinder.com
```

## Step 3: Configure DNS Records

### For Root Domain (politicianfinder.com)

#### Method 1: A Record (Most Compatible)
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600 (or automatic)
```

#### Method 2: ANAME/ALIAS Record (If Supported)
```
Type: ANAME (or ALIAS)
Name: @
Value: cname.vercel-dns.com
TTL: 3600
```

### For WWW Subdomain (www.politicianfinder.com)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### For Additional Subdomains
```
# API subdomain
Type: CNAME
Name: api
Value: cname.vercel-dns.com

# Blog subdomain
Type: CNAME
Name: blog
Value: cname.vercel-dns.com
```

## Step 4: Domain Registrar Configuration

### Popular Registrars

#### GoDaddy
1. Login to GoDaddy account
2. Go to **My Products** → **DNS**
3. Click **Add** under Records
4. Select record type (A or CNAME)
5. Fill in Name and Value
6. Save changes

#### Namecheap
1. Login to Namecheap account
2. Go to **Domain List** → **Manage**
3. Click **Advanced DNS**
4. Click **Add New Record**
5. Select record type and fill details
6. Save changes

#### Cloudflare
1. Login to Cloudflare dashboard
2. Select your domain
3. Go to **DNS** tab
4. Click **Add record**
5. Configure A or CNAME record
6. **Important:** Set Proxy status to **DNS only** (grey cloud)
7. Save record

#### Google Domains
1. Login to Google Domains
2. Select your domain
3. Click **DNS** in sidebar
4. Scroll to **Custom resource records**
5. Add A or CNAME record
6. Save changes

#### Route 53 (AWS)
1. Open Route 53 console
2. Select hosted zone
3. Click **Create record**
4. Enter record details
5. Click **Create records**

## Step 5: Verify DNS Configuration

### Check DNS Propagation
```bash
# Check A record
dig politicianfinder.com

# Check CNAME record
dig www.politicianfinder.com

# Check with specific DNS server
dig @8.8.8.8 politicianfinder.com
```

### Online Tools
- DNS Checker: https://dnschecker.org/
- What's My DNS: https://www.whatsmydns.net/
- DNS Propagation Checker: https://www.dnswatch.info/

### Expected Results
```bash
# For A record
politicianfinder.com.    IN    A    76.76.21.21

# For CNAME record
www.politicianfinder.com.    IN    CNAME    cname.vercel-dns.com.
```

## Step 6: Verify Domain in Vercel

### Check Domain Status
1. Go to **Settings** → **Domains** in Vercel
2. Check domain status:
   - ✅ **Valid:** Domain is working
   - ⏳ **Pending:** Waiting for DNS propagation
   - ❌ **Invalid:** Configuration error

### Automatic SSL Certificate
- Vercel automatically provisions SSL certificate
- Usually takes 1-5 minutes after DNS validation
- Can take up to 24 hours in some cases

## Step 7: Configure Domain Redirects

### Redirect WWW to Non-WWW
Already configured in `vercel.json`:
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "www.politicianfinder.com" }],
      "destination": "https://politicianfinder.com/:path*",
      "permanent": true
    }
  ]
}
```

### Redirect Non-WWW to WWW (Alternative)
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [{ "type": "host", "value": "politicianfinder.com" }],
      "destination": "https://www.politicianfinder.com/:path*",
      "permanent": true
    }
  ]
}
```

## Step 8: Update Application Configuration

### Update Environment Variables
```bash
# In Vercel dashboard or via CLI
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://politicianfinder.com

vercel env add NEXTAUTH_URL production
# Enter: https://politicianfinder.com
```

### Update Supabase Redirect URLs
1. Go to Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add to **Redirect URLs:**
   - `https://politicianfinder.com/auth/callback`
   - `https://www.politicianfinder.com/auth/callback`
4. Update **Site URL:** `https://politicianfinder.com`

### Update OAuth Providers
For each OAuth provider (Google, Kakao, Naver, etc.):
1. Add authorized redirect URIs:
   - `https://politicianfinder.com/auth/callback`
   - `https://www.politicianfinder.com/auth/callback`
2. Update authorized domains
3. Save changes

## Step 9: Test Domain Connection

### Manual Testing
```bash
# Test HTTP redirect to HTTPS
curl -I http://politicianfinder.com

# Expected: 301 redirect to https://

# Test HTTPS connection
curl -I https://politicianfinder.com

# Expected: 200 OK with security headers

# Test WWW redirect
curl -I https://www.politicianfinder.com

# Expected: 301 redirect to https://politicianfinder.com (if configured)
```

### Browser Testing
- [ ] Visit http://politicianfinder.com → redirects to HTTPS
- [ ] Visit https://politicianfinder.com → loads correctly
- [ ] Visit www.politicianfinder.com → redirects as configured
- [ ] SSL certificate shows valid
- [ ] No browser warnings
- [ ] All assets load from HTTPS

## Step 10: Configure Email

### Email Forwarding
Setup email forwarding for your domain:
```
admin@politicianfinder.com → your-email@gmail.com
support@politicianfinder.com → your-email@gmail.com
noreply@politicianfinder.com → your-email@gmail.com
```

### SPF Record (For Sending Email)
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

### DKIM Record (If Using Email Service)
Provided by your email service provider

### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@politicianfinder.com
```

## Troubleshooting

### Domain Not Working After 24 Hours

**Check DNS Configuration:**
```bash
dig politicianfinder.com
nslookup politicianfinder.com
```

**Common Issues:**
1. DNS records not saved
2. Wrong IP address in A record
3. CNAME pointing to wrong target
4. Cloudflare proxy enabled (should be DNS only)
5. TTL too high causing cache issues

**Solutions:**
1. Verify DNS records in registrar
2. Use correct Vercel IP: 76.76.21.21
3. CNAME should point to: cname.vercel-dns.com
4. Disable Cloudflare proxy temporarily
5. Lower TTL to 300 seconds temporarily

### SSL Certificate Not Issued

**Causes:**
- DNS not propagated
- Domain verification failed
- CAA records blocking Let's Encrypt

**Solutions:**
```bash
# Check CAA records
dig CAA politicianfinder.com

# If restrictive, add Let's Encrypt
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
```

### Redirect Loop

**Cause:** Cloudflare SSL mode set to "Flexible"

**Solution:**
1. Go to Cloudflare SSL/TLS settings
2. Set SSL mode to "Full" or "Full (Strict)"

## Advanced Configuration

### Custom Nameservers (Optional)
Transfer DNS management to Vercel:
1. Go to **Settings** → **Domains**
2. Click on your domain
3. Choose **Transfer to Vercel DNS**
4. Update nameservers at registrar:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

### Multiple Domains (Aliases)
```bash
# Add multiple domains pointing to same project
vercel domains add politicianfinder.com
vercel domains add politicianfinder.co.kr
vercel domains add politicianfinder.net
```

### Branch Domains
```bash
# Development subdomain
dev.politicianfinder.com → dev branch
staging.politicianfinder.com → staging branch
```

## SEO Considerations

### Canonical URL
```html
<!-- In layout.tsx -->
<link rel="canonical" href="https://politicianfinder.com" />
```

### Sitemap Update
```typescript
// app/sitemap.ts
export default function sitemap() {
  return [
    {
      url: 'https://politicianfinder.com',
      lastModified: new Date(),
    },
    {
      url: 'https://politicianfinder.com/politicians',
      lastModified: new Date(),
    },
  ];
}
```

### Robots.txt
```txt
# public/robots.txt
User-agent: *
Allow: /
Sitemap: https://politicianfinder.com/sitemap.xml
```

## Monitoring

### Setup Domain Monitoring
- **UptimeRobot:** Free monitoring (50 monitors)
- **Pingdom:** Comprehensive monitoring
- **StatusCake:** Free tier available

### DNS Monitoring
- **DNSCheck:** Automated DNS monitoring
- **NS1:** Advanced DNS analytics

## Checklist

### Pre-Connection
- [ ] Domain purchased
- [ ] Access to DNS settings
- [ ] Vercel project deployed
- [ ] Environment variables ready

### Configuration
- [ ] Domain added in Vercel
- [ ] DNS A/CNAME records configured
- [ ] DNS propagation complete
- [ ] SSL certificate issued
- [ ] Domain redirects working
- [ ] Environment variables updated
- [ ] OAuth providers updated
- [ ] Email forwarding configured

### Testing
- [ ] HTTP redirects to HTTPS
- [ ] Domain resolves correctly
- [ ] SSL certificate valid
- [ ] No mixed content warnings
- [ ] Authentication working
- [ ] API endpoints accessible
- [ ] All pages load correctly

### Post-Connection
- [ ] Update marketing materials
- [ ] Update social media links
- [ ] Submit to Google Search Console
- [ ] Update analytics tracking
- [ ] Monitor uptime
- [ ] Check SEO rankings

## Maintenance

### Regular Checks
- Weekly: Check domain expiration
- Monthly: Verify DNS records
- Quarterly: Review redirects
- Annually: Renew domain

### Domain Renewal
- Enable auto-renewal at registrar
- Set calendar reminder 60 days before expiration
- Keep payment method updated

---

**Last Updated:** 2025-10-18
**Version:** 1.0
**Status:** Production Ready
