# Vercel Deployment Guide

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub repository connected to Vercel
- Production environment variables ready
- Domain name (optional but recommended)

## Step 1: Initial Setup

### 1.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 1.2 Login to Vercel
```bash
vercel login
```

### 1.3 Link Project
```bash
cd frontend
vercel link
```

## Step 2: Configure Environment Variables

### 2.1 Via Vercel Dashboard
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

**Required Variables:**
- `NEXT_PUBLIC_SITE_URL` - Your production URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis token
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Same as NEXT_PUBLIC_SITE_URL

**Optional Variables:**
- `NEXT_PUBLIC_GA_ID` - Google Analytics ID
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `EMAIL_SERVICE_API_KEY` - Email service API key

### 2.2 Via CLI
```bash
# Set production environment variables
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... add all other variables
```

## Step 3: Deploy to Production

### 3.1 Deploy Command
```bash
# Deploy to production
vercel --prod

# Or with specific configuration
vercel --prod --build-env NEXT_PUBLIC_APP_ENV=production
```

### 3.2 GitHub Integration
When using GitHub integration, deployments are automatic:

**Production Deployment:**
- Triggered by merging to `main` or `master` branch
- Automatically uses production environment variables

**Preview Deployments:**
- Created for every pull request
- Use preview environment variables

### 3.3 Manual Deployment
```bash
# Build locally first
npm run build

# Test production build
npm start

# Deploy if tests pass
vercel --prod
```

## Step 4: Verify Deployment

### 4.1 Check Deployment Status
```bash
vercel list
vercel inspect <deployment-url>
```

### 4.2 Test Production Site
- [ ] Homepage loads correctly
- [ ] Authentication works
- [ ] API routes respond
- [ ] Database connections work
- [ ] Static assets load
- [ ] Environment variables set correctly

### 4.3 Check Logs
```bash
vercel logs <deployment-url>
```

## Step 5: Configure Domains

### 5.1 Add Custom Domain
1. Go to project settings
2. Click "Domains"
3. Add your domain (e.g., politicianfinder.com)
4. Follow DNS configuration instructions

### 5.2 DNS Configuration
Add the following DNS records:

**For Root Domain:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For WWW Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5.3 SSL Certificate
- Vercel automatically provisions SSL certificates
- Certificates auto-renew
- HTTPS enforced by default

## Step 6: Performance Optimization

### 6.1 Enable Analytics
```bash
# In Vercel dashboard
Settings > Analytics > Enable
```

### 6.2 Configure Caching
Headers are already configured in `vercel.json`:
- Static assets: 1 year cache
- API routes: no cache
- Pages: optimized caching

### 6.3 Edge Network
- Vercel Edge Network enabled by default
- CDN distribution worldwide
- Region: icn1 (Seoul) for primary

## Step 7: Monitoring & Alerts

### 7.1 Enable Vercel Monitoring
1. Navigate to Monitoring tab
2. Enable Real-Time Logs
3. Set up error alerts
4. Configure performance budgets

### 7.2 Error Tracking
```typescript
// Already configured in layout.tsx
// Errors are tracked via Vercel Analytics
```

### 7.3 Uptime Monitoring
Consider using:
- Vercel Monitoring (built-in)
- UptimeRobot
- Pingdom
- StatusCake

## Step 8: Rollback Strategy

### 8.1 View Deployments
```bash
vercel list
```

### 8.2 Rollback to Previous Deployment
```bash
# Via CLI
vercel alias set <previous-deployment-url> politicianfinder.com

# Via Dashboard
# Go to Deployments > Select deployment > Promote to Production
```

### 8.3 Instant Rollback
```bash
vercel rollback
```

## Step 9: CI/CD Integration

### 9.1 GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 9.2 Pre-deployment Checks
```json
// package.json
{
  "scripts": {
    "predeploy": "npm run test && npm run lint",
    "deploy": "vercel --prod"
  }
}
```

## Step 10: Post-Deployment

### 10.1 Smoke Tests
```bash
# Run post-deployment tests
npm run test:e2e -- --grep="@smoke"
```

### 10.2 Update Documentation
- [ ] Update README with production URL
- [ ] Document any deployment-specific configurations
- [ ] Update team on deployment status

### 10.3 Monitor First 24 Hours
- Check error rates
- Monitor performance metrics
- Review user feedback
- Check analytics data

## Troubleshooting

### Build Failures
```bash
# Check build logs
vercel logs <deployment-url> --follow

# Common issues:
# 1. Missing environment variables
# 2. TypeScript errors
# 3. Dependency issues
```

### Runtime Errors
```bash
# Check function logs
vercel logs <deployment-url> --follow

# Common issues:
# 1. Database connection errors
# 2. API timeout issues
# 3. Missing permissions
```

### Performance Issues
- Check Vercel Analytics
- Review Core Web Vitals
- Optimize images and assets
- Enable caching headers

## Security Checklist

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Environment variables secured
- [ ] API rate limiting active
- [ ] CORS properly configured
- [ ] Authentication working
- [ ] SQL injection protection
- [ ] XSS protection enabled

## Maintenance

### Regular Tasks
- Monitor error logs daily
- Review performance weekly
- Update dependencies monthly
- Security audit quarterly
- Backup database regularly

### Scaling Considerations
- Monitor bandwidth usage
- Track function execution time
- Review database performance
- Consider edge functions for global performance

## Cost Optimization

### Vercel Pricing Tiers
- **Hobby:** Free (good for testing)
- **Pro:** $20/month (recommended for production)
- **Enterprise:** Custom pricing

### Cost Reduction Tips
- Optimize images (use Next.js Image)
- Minimize function execution time
- Use ISR for static content
- Enable caching effectively
- Monitor bandwidth usage

## Support Resources

- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: Track deployment issues

---

**Deployment Checklist**
- [ ] Environment variables configured
- [ ] Build successful locally
- [ ] Tests passing
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Rollback plan ready
- [ ] Team notified
