# Phase 5 Deployment Guide
## PoliticianFinder - Production Deployment Complete Guide

Comprehensive guide for deploying PoliticianFinder to production with Vercel, including SSL setup, domain configuration, and best practices.

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Quick Start Deployment](#quick-start-deployment)
4. [Detailed Deployment Steps](#detailed-deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Additional Resources](#additional-resources)

---

## Overview

### What This Guide Covers

- ✅ Production deployment to Vercel
- ✅ Environment variable configuration
- ✅ Custom domain setup
- ✅ SSL/TLS certificate configuration (Let's Encrypt)
- ✅ DNS configuration
- ✅ Automated deployment scripts
- ✅ Monitoring setup
- ✅ Rollback procedures

### Prerequisites

Before starting, ensure you have:

- [ ] GitHub repository with PoliticianFinder code
- [ ] Vercel account (https://vercel.com)
- [ ] Supabase project (production ready)
- [ ] Custom domain (optional, but recommended)
- [ ] Node.js 18+ installed locally
- [ ] Git installed
- [ ] Vercel CLI installed (`npm install -g vercel`)

### Architecture Overview

```
[Users]
   ↓
[DNS Provider] → [Custom Domain]
   ↓
[Vercel Edge Network] → [SSL/TLS (Let's Encrypt)]
   ↓
[Next.js Application]
   ↓
[Supabase] → [Database + Auth]
```

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
  ```bash
  cd frontend
  npm run test:ci
  npm run test:e2e
  ```

- [ ] Build successful
  ```bash
  npm run build
  ```

- [ ] No TypeScript errors
  ```bash
  npx tsc --noEmit
  ```

- [ ] Linting passed
  ```bash
  npm run lint
  ```

### Database

- [ ] Supabase production project created
- [ ] Database migrations applied
- [ ] Row Level Security (RLS) policies configured
- [ ] Test data populated (if needed)
- [ ] Database backup created

### Authentication

- [ ] Google OAuth configured in Supabase
- [ ] Redirect URLs configured for production domain
- [ ] Test authentication flow

### Environment Variables

- [ ] All required variables documented
- [ ] Production values prepared
- [ ] No secrets in code or git
- [ ] `.env.example` up to date

### Security

- [ ] Security headers configured
- [ ] CORS settings verified
- [ ] Rate limiting configured
- [ ] Input validation implemented
- [ ] SQL injection prevention verified

---

## Quick Start Deployment

For experienced users, here's the quickest path to production:

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd frontend

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 2. Set Environment Variables

```bash
# Add Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Add Supabase Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Redeploy
vercel --prod
```

### 3. Add Custom Domain (Optional)

```bash
# Add domain
vercel domains add yourdomain.com

# Follow DNS configuration instructions
# SSL certificate will be automatically issued
```

### 4. Verify

```bash
# Test production URL
curl -I https://your-project.vercel.app

# Should return 200 OK with SSL
```

---

## Detailed Deployment Steps

### Step 1: Prepare Repository

#### 1.1 Verify Code Quality

```bash
# Clone repository (if needed)
git clone https://github.com/your-username/PoliticianFinder.git
cd PoliticianFinder/frontend

# Install dependencies
npm install

# Run full test suite
npm run test:all

# Build for production
npm run build

# Test production build locally
npm run start
```

Visit `http://localhost:3000` and verify everything works.

#### 1.2 Create Git Tag

```bash
# Get current version
VERSION=$(node -p "require('./package.json').version")

# Create tag
git tag -a "v$VERSION" -m "Production release v$VERSION"

# Push tag
git push origin "v$VERSION"
```

#### 1.3 Create Deployment Branch (Optional)

```bash
# Create production branch
git checkout -b production
git push -u origin production

# This allows separate production deployments
```

---

### Step 2: Vercel Project Setup

#### 2.1 Create Vercel Account

1. Visit https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

#### 2.2 Import Project

**Via Vercel Dashboard:**

1. Click "New Project"
2. Select "Import Git Repository"
3. Choose your GitHub repository
4. Configure:
   ```
   Framework Preset: Next.js
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```
5. Click "Deploy"

**Via Vercel CLI:**

```bash
cd frontend

# Initialize Vercel project
vercel

# Follow prompts:
# Set up and deploy? [Y/n] Y
# Which scope? Select your account
# Link to existing project? [y/N] N
# What's your project's name? politician-finder
# In which directory is your code located? ./
# Want to override the settings? [y/N] N
```

#### 2.3 Configure Project Settings

```bash
# Or via dashboard:
Project → Settings → General

Framework Preset: Next.js
Node.js Version: 18.x
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

---

### Step 3: Environment Variables Configuration

#### 3.1 Required Variables

Set these in Vercel Dashboard or CLI:

```bash
# Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://xxxxxxxxxxxxx.supabase.co

# Supabase Anonymous Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Via Dashboard:**

1. Project → Settings → Environment Variables
2. Add each variable:
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://xxxxxxxxxxxxx.supabase.co
   Environment: Production
   ```
3. Click "Save"

#### 3.2 Optional Variables

```bash
# Site URL (for canonical URLs)
vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://yourdomain.com

# Rate Limiting (if using Upstash)
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Analytics (if using)
vercel env add NEXT_PUBLIC_GA_ID production
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

#### 3.3 Verify Variables

```bash
# List all environment variables
vercel env ls

# Pull variables to local (for verification)
vercel env pull .env.production
cat .env.production
```

#### 3.4 Redeploy After Setting Variables

```bash
# Trigger new deployment
vercel --prod

# Or via dashboard: Deployments → Redeploy
```

---

### Step 4: Custom Domain Setup

#### 4.1 Purchase Domain (If Not Already Owned)

Recommended registrars:
- Namecheap (https://www.namecheap.com)
- Cloudflare (https://www.cloudflare.com/products/registrar/)
- Google Domains (https://domains.google/)

#### 4.2 Add Domain to Vercel

**Via Dashboard:**

1. Project → Settings → Domains
2. Click "Add"
3. Enter: `yourdomain.com`
4. Click "Add"
5. Note DNS instructions provided

**Via CLI:**

```bash
# Add root domain
vercel domains add yourdomain.com

# Add www subdomain
vercel domains add www.yourdomain.com
```

#### 4.3 Configure DNS

**Option A: Vercel Nameservers (Recommended)**

1. Get nameservers from Vercel:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```

2. Update at your registrar:
   - Namecheap: Domain List → Manage → Nameservers → Custom DNS
   - GoDaddy: My Products → Domain → Manage DNS → Nameservers
   - Cloudflare: Add site → Update nameservers

3. Wait for DNS propagation (up to 48 hours, usually < 1 hour)

**Option B: A/CNAME Records**

Add these records at your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |

#### 4.4 Verify DNS Configuration

```bash
# Check nameservers
dig NS yourdomain.com +short

# Check A record
dig yourdomain.com +short

# Check CNAME
dig www.yourdomain.com +short

# Check globally
https://www.whatsmydns.net/
```

---

### Step 5: SSL/TLS Certificate Setup

Vercel automatically provides SSL certificates via Let's Encrypt.

#### 5.1 Automatic Certificate Issuance

Once DNS is configured:

1. Vercel detects DNS changes
2. Requests certificate from Let's Encrypt
3. Validates domain ownership
4. Issues certificate (usually within 5-15 minutes)

#### 5.2 Verify SSL Certificate

```bash
# Check certificate
echo | openssl s_client -servername yourdomain.com -connect yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Check SSL configuration
curl -vI https://yourdomain.com

# Online test
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com
```

Target: A+ rating on SSL Labs

#### 5.3 Certificate Auto-Renewal

- Certificates valid for 90 days
- Automatically renewed 30 days before expiration
- No manual intervention needed
- Zero downtime during renewal

#### 5.4 HTTPS Enforcement

Vercel automatically redirects HTTP → HTTPS:

```bash
# Test redirect
curl -I http://yourdomain.com

# Should return:
# HTTP/1.1 308 Permanent Redirect
# Location: https://yourdomain.com/
```

---

### Step 6: Configure Redirects and Rewrites

#### 6.1 Update vercel.json

Already configured in `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["icn1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

#### 6.2 Add WWW Redirect (Optional)

To redirect www to root domain (or vice versa):

```json
{
  "redirects": [
    {
      "source": "https://www.yourdomain.com/:path*",
      "destination": "https://yourdomain.com/:path*",
      "permanent": true
    }
  ]
}
```

---

### Step 7: Update External Services

#### 7.1 Supabase Authentication

Update redirect URLs in Supabase:

1. Supabase Dashboard → Authentication → URL Configuration
2. Site URL:
   ```
   https://yourdomain.com
   ```
3. Redirect URLs (add all):
   ```
   https://yourdomain.com/auth/callback
   https://yourdomain.com/**
   https://www.yourdomain.com/** (if using www)
   https://your-project.vercel.app/** (keep Vercel URL)
   ```

#### 7.2 Google OAuth

Update in Google Cloud Console:

1. APIs & Services → Credentials
2. Select your OAuth 2.0 Client
3. Authorized JavaScript origins:
   ```
   https://yourdomain.com
   https://www.yourdomain.com
   ```
4. Authorized redirect URIs:
   ```
   https://yourdomain.com/auth/callback
   https://www.yourdomain.com/auth/callback
   ```

---

### Step 8: Automated Deployment

#### 8.1 Using Deployment Script

Use the provided deployment script:

```bash
# Make script executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh

# Or on Windows
powershell -ExecutionPolicy Bypass -File scripts/deploy-production.ps1
```

The script will:
- ✅ Check prerequisites
- ✅ Run tests
- ✅ Build project
- ✅ Create backup
- ✅ Create Git tag
- ✅ Deploy to Vercel
- ✅ Verify deployment

#### 8.2 GitHub Actions (Automatic)

Already configured in `.github/workflows/cd.yml`:

```yaml
# Automatic deployment on push to main
on:
  push:
    branches: [main]

# Or manual deployment
workflow_dispatch:
```

To deploy:
```bash
# Push to main branch
git push origin main

# Or trigger manually via GitHub Actions UI
```

---

## Post-Deployment Verification

### Automated Verification

Run the verification script:

```bash
# From project root
./scripts/verify-deployment.sh yourdomain.com

# Or manually verify each component
```

### Manual Verification Checklist

#### 1. Basic Functionality

- [ ] Site loads: https://yourdomain.com
- [ ] HTTPS works (padlock icon)
- [ ] HTTP redirects to HTTPS
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] No console errors

#### 2. Authentication

```bash
# Test flow
1. Go to /login
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify redirect to homepage
5. Verify user logged in
6. Test logout
```

- [ ] Google OAuth login works
- [ ] User session persists
- [ ] Logout works
- [ ] Protected routes require auth

#### 3. Core Features

- [ ] Politician list loads
- [ ] Search functionality works
- [ ] Pagination works
- [ ] Sorting works
- [ ] Politician details page loads
- [ ] Comments work (if authenticated)
- [ ] Bookmarks work (if authenticated)

#### 4. Performance

```bash
# Test with Lighthouse
npm install -g @lhci/cli
lhci autorun --collect.url=https://yourdomain.com

# Target scores:
# Performance: > 90
# Accessibility: > 90
# Best Practices: > 90
# SEO: > 90
```

- [ ] Lighthouse Performance > 90
- [ ] Page load < 3 seconds
- [ ] Core Web Vitals good
- [ ] Images optimized

#### 5. Security

```bash
# Test security headers
curl -I https://yourdomain.com

# Check SSL
https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

# Check security headers
https://securityheaders.com/?q=yourdomain.com
```

- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] No mixed content warnings
- [ ] HSTS enabled
- [ ] SSL Labs rating A+

#### 6. Mobile Responsiveness

- [ ] Works on mobile devices
- [ ] Touch interactions work
- [ ] Layout responsive
- [ ] No horizontal scroll

---

## Monitoring and Maintenance

### Set Up Monitoring

#### 1. Vercel Analytics

Enable in Vercel Dashboard:
```
Project → Analytics → Enable
```

Monitors:
- Page views
- Unique visitors
- Core Web Vitals
- Real user metrics

#### 2. Error Tracking (Sentry)

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Add DSN to environment variables
vercel env add NEXT_PUBLIC_SENTRY_DSN production
```

#### 3. Uptime Monitoring

**UptimeRobot (Free):**

1. Visit https://uptimerobot.com
2. Add monitor:
   ```
   Monitor Type: HTTPS
   URL: https://yourdomain.com
   Interval: 5 minutes
   ```
3. Set up email alerts

**Healthcheck Script:**

```bash
# scripts/healthcheck.sh
#!/bin/bash

URL="https://yourdomain.com"
EXPECTED_STATUS=200

STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ "$STATUS" -eq "$EXPECTED_STATUS" ]; then
  echo "✓ Site is up (HTTP $STATUS)"
  exit 0
else
  echo "✗ Site is down (HTTP $STATUS)"
  exit 1
fi
```

#### 4. Performance Monitoring

Set up GitHub Action (`.github/workflows/performance-tests.yml`):

```yaml
name: Performance Monitoring

on:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://yourdomain.com
          uploadArtifacts: true
```

### Maintenance Tasks

#### Daily
- [ ] Check error rates in Sentry
- [ ] Monitor uptime alerts
- [ ] Review Vercel analytics

#### Weekly
- [ ] Review performance metrics
- [ ] Check SSL certificate expiration
- [ ] Update dependencies (`npm outdated`)
- [ ] Review and respond to user feedback

#### Monthly
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup verification
- [ ] Documentation updates

#### Quarterly
- [ ] Rotate API keys
- [ ] Review and update dependencies
- [ ] Capacity planning
- [ ] Security updates

---

## Troubleshooting

### Common Issues

#### Issue 1: Build Fails on Vercel

**Error:** `Build failed with exit code 1`

**Solutions:**

```bash
# Test build locally
cd frontend
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check Node.js version
# Vercel Settings → General → Node.js Version → 18.x

# Clear cache and rebuild
vercel --prod --force
```

#### Issue 2: Environment Variables Not Working

**Error:** `supabaseUrl is required`

**Solutions:**

```bash
# Verify variables are set
vercel env ls

# Pull and check
vercel env pull
cat .env

# Ensure NEXT_PUBLIC_ prefix for client-side
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Redeploy
vercel --prod
```

#### Issue 3: Domain Not Resolving

**Error:** `DNS_PROBE_FINISHED_NXDOMAIN`

**Solutions:**

```bash
# Check DNS configuration
dig yourdomain.com +short

# Wait for propagation (up to 48 hours)
https://www.whatsmydns.net/

# Verify nameservers
dig NS yourdomain.com +short

# Clear local DNS cache
# macOS: sudo dscacheutil -flushcache
# Windows: ipconfig /flushdns
# Linux: sudo systemd-resolve --flush-caches
```

#### Issue 4: SSL Certificate Error

**Error:** `NET::ERR_CERT_AUTHORITY_INVALID`

**Solutions:**

```bash
# Wait for certificate issuance (5-15 minutes)

# Check CAA records
dig yourdomain.com CAA +short

# If CAA exists, add Let's Encrypt
# Type: CAA, Name: @, Value: 0 issue "letsencrypt.org"

# Force certificate refresh
vercel certs issue yourdomain.com --force
```

#### Issue 5: Authentication Redirect Loop

**Error:** Infinite redirect on login

**Solutions:**

```bash
# Verify Supabase redirect URLs
Supabase Dashboard → Authentication → URL Configuration
Add: https://yourdomain.com/auth/callback

# Check Google OAuth redirect URIs
Google Cloud Console → Credentials
Add: https://yourdomain.com/auth/callback

# Verify NEXT_PUBLIC_SITE_URL
vercel env ls
```

### Getting Help

1. **Vercel Support:**
   - Dashboard → Help & Support
   - Email: support@vercel.com
   - Discord: https://vercel.com/discord

2. **Supabase Support:**
   - Dashboard → Support
   - Discord: https://supabase.com/discord
   - GitHub Discussions

3. **Community:**
   - Stack Overflow (tags: vercel, next.js, supabase)
   - GitHub Issues

---

## Rollback Procedures

### Immediate Rollback

If deployment causes issues:

#### Via Vercel Dashboard

1. Project → Deployments
2. Find previous stable deployment
3. Click menu (⋯) → "Promote to Production"
4. Confirm promotion

#### Via Vercel CLI

```bash
# List deployments
vercel ls

# Roll back to specific deployment
vercel promote <deployment-url>
```

### Git-Based Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push origin main --force

# Vercel will auto-deploy the reverted version
```

### Emergency Procedures

If site is completely down:

1. **Enable Maintenance Mode:**
   ```bash
   # Create maintenance.html in public/
   # Vercel will serve static page
   ```

2. **Notify Users:**
   - Update status page
   - Social media announcement
   - Email notification (if applicable)

3. **Roll Back:**
   - Follow rollback procedures above
   - Verify rollback successful

4. **Post-Mortem:**
   - Document what went wrong
   - Create action items
   - Update procedures

---

## Additional Resources

### Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Original deployment guide
- [SSL Setup](./docs/SSL_CERTIFICATE_SETUP.md) - SSL/TLS configuration
- [Domain Setup](./docs/DOMAIN_SETUP.md) - Custom domain configuration
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md) - Environment configuration
- [Production Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Comprehensive checklist

### Scripts

- `scripts/deploy-production.sh` - Automated deployment (Linux/Mac)
- `scripts/deploy-production.ps1` - Automated deployment (Windows)
- `scripts/backup-db.sh` - Database backup
- `scripts/run-all-tests.sh` - Full test suite

### External Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Success Criteria

Deployment is successful when:

- ✅ Application accessible via HTTPS
- ✅ SSL certificate valid (A+ rating)
- ✅ Custom domain working
- ✅ Authentication functioning
- ✅ All features working as expected
- ✅ Performance targets met (Lighthouse > 90)
- ✅ No console errors
- ✅ Monitoring configured
- ✅ Backups configured
- ✅ Documentation updated

---

## Support and Maintenance

### On-Call Rotation

**Production Issues:**
- Primary: [Your Name]
- Secondary: [Backup Name]
- Escalation: [Manager Name]

### Incident Response

1. Acknowledge issue
2. Assess severity
3. Communicate status
4. Implement fix or rollback
5. Verify resolution
6. Post-mortem analysis

### Contact Information

**Emergency Contact:** [Phone/Email]
**Team Slack:** #devops-alerts
**Status Page:** https://status.yourdomain.com

---

**Deployment Date:** 2025-10-17
**Version:** 1.0
**Deployed By:** DevOps Team
**Status:** ✅ Production Ready

---

**Congratulations on your production deployment!** 🎉

Your application is now live and serving users. Remember to monitor performance, respond to issues promptly, and keep documentation updated.
