# Deployment Quick Start Guide
## PoliticianFinder - Fast Production Deployment

Get your application deployed to production in under 30 minutes.

---

## Prerequisites Checklist

Before you start, ensure you have:

- [ ] GitHub repository with code
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Supabase production project
- [ ] Node.js 18+ installed
- [ ] Vercel CLI installed: `npm install -g vercel`

---

## 5-Minute Deployment

### Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd frontend
vercel --prod
```

Follow the prompts:
- Link to existing project? **N** (first time)
- Project name? **politician-finder**
- Directory? **./**
- Override settings? **N**

### Step 4: Set Environment Variables

```bash
# Add Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://your-project.supabase.co

# Add Supabase Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste: your-anon-key
```

### Step 5: Redeploy

```bash
vercel --prod
```

**Done!** Your site is live at: `https://your-project.vercel.app`

---

## Using Deployment Script (Recommended)

### Linux/macOS

```bash
# From project root
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### Windows

```powershell
# From project root
.\scripts\deploy-production.ps1
```

The script will:
- ✅ Check prerequisites
- ✅ Run tests
- ✅ Create backup
- ✅ Deploy to Vercel
- ✅ Verify deployment

---

## Custom Domain Setup (Optional)

### Quick Domain Setup

1. **Add domain in Vercel:**
   ```bash
   vercel domains add yourdomain.com
   ```

2. **Update DNS at registrar:**
   ```
   Nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com

   OR

   A Record: @ → 76.76.21.21
   CNAME: www → cname.vercel-dns.com
   ```

3. **Wait for DNS propagation** (5-60 minutes)

4. **SSL auto-issued** (5-15 minutes after DNS)

5. **Verify:**
   ```bash
   curl -I https://yourdomain.com
   # Should return: HTTP/2 200
   ```

---

## Verify Deployment

### Quick Verification

```bash
# Linux/macOS
./scripts/verify-deployment.sh yourdomain.com

# Windows
.\scripts\verify-deployment.ps1 -Domain yourdomain.com
```

### Manual Verification

```bash
# Test HTTPS
curl -I https://your-site.com

# Should show:
# HTTP/2 200
# strict-transport-security: max-age=...
# x-content-type-options: nosniff
```

**Browser Test:**
1. Visit https://your-site.com
2. Click padlock icon
3. Verify certificate is valid
4. Test login with Google OAuth
5. Test core features

---

## Environment Variables

### Required Variables

Get from Supabase Dashboard → Settings → API:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Set in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable
5. Select "Production"
6. Click "Save"
7. Redeploy: Deployments → Redeploy

---

## Update Supabase Auth URLs

After deployment, update Supabase:

1. **Supabase Dashboard → Authentication → URL Configuration**

2. **Site URL:**
   ```
   https://yourdomain.com
   (or https://your-project.vercel.app)
   ```

3. **Redirect URLs (add all):**
   ```
   https://yourdomain.com/**
   https://your-project.vercel.app/**
   ```

4. **Save changes**

---

## Troubleshooting

### Build Failed

```bash
# Test build locally
cd frontend
npm install
npm run build

# Fix errors, then redeploy
vercel --prod
```

### Environment Variables Not Working

```bash
# List variables
vercel env ls

# Add missing variables
vercel env add VARIABLE_NAME production

# Redeploy
vercel --prod
```

### Domain Not Working

```bash
# Check DNS
dig yourdomain.com +short

# Should return Vercel IP: 76.76.21.21
# Or Vercel CNAME

# Wait for DNS propagation: up to 48 hours (usually < 1 hour)
# Check globally: https://www.whatsmydns.net/
```

### SSL Certificate Error

```bash
# Wait 5-15 minutes after DNS is configured
# SSL certificate is automatically issued

# Force refresh
vercel certs issue yourdomain.com --force

# Check status
curl -I https://yourdomain.com
```

### Authentication Not Working

**Update Google OAuth:**
1. Google Cloud Console → Credentials
2. Select OAuth 2.0 Client
3. Add to Authorized JavaScript origins:
   - `https://yourdomain.com`
4. Add to Authorized redirect URIs:
   - `https://yourdomain.com/auth/callback`

**Update Supabase:**
1. Supabase → Authentication → URL Configuration
2. Add domain to Redirect URLs

---

## Common Commands

```bash
# Deploy to production
vercel --prod

# List deployments
vercel ls

# Check project
vercel inspect

# Add environment variable
vercel env add VARIABLE_NAME production

# List environment variables
vercel env ls

# Pull env vars locally
vercel env pull .env.local

# Add domain
vercel domains add yourdomain.com

# List domains
vercel domains ls

# View logs
vercel logs
```

---

## Next Steps

After successful deployment:

1. **Monitor Application:**
   - Vercel Dashboard → Analytics
   - Check error rates
   - Monitor performance

2. **Set Up Monitoring:**
   - Enable Vercel Analytics
   - Configure uptime monitoring
   - Set up error tracking (Sentry)

3. **Optimize:**
   - Run Lighthouse audit
   - Optimize images
   - Review performance metrics

4. **Documentation:**
   - Update README with production URL
   - Document any custom configuration
   - Share with team

---

## Full Documentation

For detailed information, see:

- **Complete Guide:** [PHASE5_DEPLOYMENT_GUIDE.md](./PHASE5_DEPLOYMENT_GUIDE.md)
- **SSL Setup:** [docs/SSL_CERTIFICATE_SETUP.md](./docs/SSL_CERTIFICATE_SETUP.md)
- **Domain Setup:** [docs/DOMAIN_SETUP.md](./docs/DOMAIN_SETUP.md)
- **Environment Variables:** [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md)
- **Original Deployment Guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Support

**Issues:**
- Check troubleshooting sections above
- Run verification script
- Review Vercel deployment logs
- Check Supabase logs

**Help:**
- Vercel Support: support@vercel.com
- Vercel Discord: https://vercel.com/discord
- Documentation: https://vercel.com/docs

---

## Deployment Checklist

- [ ] Code tested locally
- [ ] Environment variables set in Vercel
- [ ] Production build successful
- [ ] Deployed to Vercel
- [ ] Custom domain added (optional)
- [ ] DNS configured
- [ ] SSL certificate issued
- [ ] Supabase auth URLs updated
- [ ] Google OAuth URLs updated
- [ ] Deployment verified
- [ ] Monitoring configured
- [ ] Team notified

---

**Estimated Time:**
- Basic deployment: 5 minutes
- With custom domain: 30 minutes (including DNS propagation)
- Full setup with monitoring: 60 minutes

**Success Criteria:**
- ✅ Site accessible via HTTPS
- ✅ SSL certificate valid
- ✅ Authentication working
- ✅ All features functional
- ✅ No console errors

---

**Quick Start Version:** 1.0
**Last Updated:** 2025-10-17

Happy deploying! 🚀
