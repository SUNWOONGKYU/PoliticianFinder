# Environment Variables Documentation
## PoliticianFinder - Phase 5

Complete guide to environment variables for the PoliticianFinder application across all environments.

## Table of Contents
1. [Overview](#overview)
2. [Frontend Variables](#frontend-variables)
3. [Backend Variables](#backend-variables)
4. [Environment-Specific Configuration](#environment-specific-configuration)
5. [Security Best Practices](#security-best-practices)
6. [Vercel Configuration](#vercel-configuration)
7. [Local Development](#local-development)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### Variable Types

**Public Variables (NEXT_PUBLIC_*):**
- Exposed to browser/client
- Included in JavaScript bundle
- Safe for frontend use
- Use for API endpoints, public keys

**Private Variables:**
- Server-side only
- Never exposed to client
- Use for secrets, private keys
- Available in API routes and server components

### Environment Types

1. **Development:** Local development environment
2. **Preview:** Pull request and branch deployments
3. **Production:** Live production environment

---

## Frontend Variables

### Required Variables

#### Supabase Configuration

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Description:
# - Your Supabase project URL
# - Found in: Supabase Dashboard → Settings → API
# - Required for all Supabase operations
# - Public: Safe to expose to client

# Supabase Anonymous Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Description:
# - Public anonymous key for client-side operations
# - Found in: Supabase Dashboard → Settings → API → anon/public
# - Required for authentication and database access
# - Public: Safe to expose (protected by RLS policies)
# - Never use the service_role key here!
```

**How to Get These Values:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings → API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Optional Variables

#### Rate Limiting (Upstash Redis)

```bash
# Upstash Redis REST URL
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io

# Description:
# - Upstash Redis REST API URL
# - Used for rate limiting
# - Found in: Upstash Console → Database → REST API
# - Optional: Rate limiting won't work without this

# Upstash Redis REST Token
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxx

# Description:
# - Authentication token for Upstash Redis
# - Found in: Upstash Console → Database → REST API
# - Private: Keep secret, server-side only
# - Optional: Required if using rate limiting
```

**Setup Instructions:**

1. Create account at https://upstash.com
2. Create Redis database
3. Go to database details
4. Copy REST URL and Token
5. Add to Vercel environment variables

#### API Configuration

```bash
# Custom API URL (if using separate backend)
NEXT_PUBLIC_API_URL=https://api.politicianfinder.com

# Description:
# - URL for separate backend API
# - Optional: Only needed if backend is separate from Next.js
# - Public: Safe to expose
# - Default: Uses Next.js API routes if not set
```

#### Site Configuration

```bash
# Site URL
NEXT_PUBLIC_SITE_URL=https://politicianfinder.com

# Description:
# - Your production site URL
# - Used for canonical URLs, OG tags, redirects
# - Public: Safe to expose
# - Optional: Defaults to Vercel URL if not set
```

#### Analytics and Monitoring

```bash
# Google Analytics ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Description:
# - Google Analytics measurement ID
# - Optional: For tracking analytics
# - Public: Safe to expose

# Sentry DSN
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Description:
# - Sentry Data Source Name for error tracking
# - Optional: For error monitoring
# - Public: Safe to expose (client-side errors)
```

---

## Backend Variables

### Database (Supabase)

```bash
# Supabase Service Role Key (DANGEROUS - SERVER ONLY)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Description:
# - Service role key with full database access
# - Bypasses Row Level Security (RLS)
# - NEVER expose to client
# - NEVER commit to git
# - Use only in API routes and server components
# - Found in: Supabase Dashboard → Settings → API → service_role
# - WARNING: This key has admin privileges!
```

### Authentication

```bash
# JWT Secret (for custom JWT handling)
JWT_SECRET=your-super-secret-jwt-key-here

# Description:
# - Secret key for signing JWTs
# - Generate: `openssl rand -base64 32`
# - Keep secret, server-side only
# - Optional: Supabase handles JWT by default
```

### Email Service (if using)

```bash
# SendGrid API Key
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# Description:
# - SendGrid API key for sending emails
# - Optional: If using email notifications
# - Private: Keep secret

# From Email Address
EMAIL_FROM=noreply@politicianfinder.com

# Description:
# - Email address for sending notifications
# - Must be verified in SendGrid
```

### External APIs

```bash
# Third-party API Keys (examples)
EXTERNAL_API_KEY=xxxxxxxxxxxxx
EXTERNAL_API_SECRET=xxxxxxxxxxxxx

# Description:
# - Keys for external services
# - Keep private, server-side only
# - Replace with actual service names
```

---

## Environment-Specific Configuration

### Development (.env.local)

```bash
# .env.local - Local development only
# This file is gitignored and never committed

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Use local Supabase instance
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# Development Settings
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Debug Settings (optional)
DEBUG=true
LOG_LEVEL=debug
```

**File: `.env.local`**

Create this file in the `frontend` directory:

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with your values
```

### Preview (Vercel Branch Deployments)

```bash
# Preview environment uses the same variables as production
# But you can override specific values for testing

# Example: Use staging database for preview
NEXT_PUBLIC_SUPABASE_URL=https://staging-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key-here

# Use preview site URL
NEXT_PUBLIC_SITE_URL=https://preview.politicianfinder.com
```

### Production (Vercel Production)

```bash
# Production environment variables
# Set these in Vercel Dashboard

# Supabase - Production Project
NEXT_PUBLIC_SUPABASE_URL=https://production-xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=production-key-here

# Production URLs
NEXT_PUBLIC_SITE_URL=https://politicianfinder.com
NEXT_PUBLIC_API_URL=https://api.politicianfinder.com

# Production Rate Limiting
UPSTASH_REDIS_REST_URL=https://production-xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=production-token-here

# Production Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://production-sentry-dsn
NEXT_PUBLIC_GA_ID=G-PRODUCTION-ID
```

---

## Security Best Practices

### 1. Never Commit Secrets

**Always in `.gitignore`:**
```
.env
.env.local
.env.development
.env.test
.env.production
.env.*.local
```

**Verify:**
```bash
# Check if .env files are ignored
git check-ignore .env.local
# Should output: .env.local

# Check for accidentally committed secrets
git log --all --full-history -- "*/.env*"
```

### 2. Use Environment-Specific Values

Don't use production credentials in development:

```bash
# ❌ BAD - Using production DB in development
NEXT_PUBLIC_SUPABASE_URL=https://production.supabase.co

# ✅ GOOD - Use separate development DB
NEXT_PUBLIC_SUPABASE_URL=https://development.supabase.co
```

### 3. Rotate Keys Regularly

**Rotation Schedule:**
- Service role keys: Every 90 days
- API keys: Every 180 days
- JWT secrets: Every 365 days

**Rotation Process:**
1. Generate new key
2. Update in Vercel
3. Deploy
4. Revoke old key after verification

### 4. Use Vercel Environment Variables

Never hardcode in code:

```javascript
// ❌ BAD
const apiKey = "sk_live_xxxxxxxxxxxxx";

// ✅ GOOD
const apiKey = process.env.API_KEY;
```

### 5. Validate Environment Variables

Add runtime validation:

```typescript
// lib/env.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function validateEnv() {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

// Call in app initialization
validateEnv();
```

### 6. Use Secrets for Sensitive Data

For highly sensitive data:

```bash
# Use Vercel's secret management
vercel secret add database-url postgresql://...
vercel secret add api-key sk_live_xxx

# Reference in vercel.json
{
  "env": {
    "DATABASE_URL": "@database-url",
    "API_KEY": "@api-key"
  }
}
```

---

## Vercel Configuration

### Setting Variables via Dashboard

1. **Navigate to Project:**
   ```
   https://vercel.com/dashboard
   Select your project
   ```

2. **Open Environment Variables:**
   ```
   Settings → Environment Variables
   ```

3. **Add Variable:**
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://xxxxx.supabase.co

   Select environments:
   ☑ Production
   ☑ Preview
   ☐ Development
   ```

4. **Save and Redeploy:**
   ```
   Click "Save"
   Trigger new deployment for changes to take effect
   ```

### Setting Variables via CLI

```bash
# Add production variable
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste value when prompted

# Add preview variable
vercel env add NEXT_PUBLIC_SUPABASE_URL preview

# Add to all environments
vercel env add NEXT_PUBLIC_SITE_URL

# List all variables
vercel env ls

# Pull variables to local .env
vercel env pull .env.local
```

### Bulk Import

Create file `env-vars.txt`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_SITE_URL=https://politicianfinder.com
```

Import:
```bash
# Note: Vercel CLI doesn't have bulk import
# Use dashboard or script each variable:
while IFS='=' read -r key value; do
  echo "$value" | vercel env add "$key" production
done < env-vars.txt
```

### Environment Variable Precedence

1. Vercel Environment Variables (highest priority)
2. `.env.production.local`
3. `.env.local`
4. `.env.production`
5. `.env`

---

## Local Development

### Setup for New Developers

**Step 1: Clone Repository**
```bash
git clone https://github.com/your-repo/PoliticianFinder.git
cd PoliticianFinder/frontend
```

**Step 2: Copy Environment Template**
```bash
cp .env.example .env.local
```

**Step 3: Get Credentials**

1. **Supabase:**
   - Ask team lead for development project credentials
   - Or create your own Supabase project
   - Update `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Optional Services:**
   - Upstash Redis (for rate limiting testing)
   - Sentry (for error tracking)

**Step 4: Verify Configuration**
```bash
# Check if variables are loaded
npm run dev
# Visit http://localhost:3000
# Check browser console for errors
```

### Local Supabase Instance

For complete local development:

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
cd ..
supabase start

# Update .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>

# Run migrations
supabase db push
```

---

## Troubleshooting

### Issue 1: "supabaseUrl is required"

**Cause:** Environment variables not loaded

**Solution:**
```bash
# Check if .env.local exists
ls -la frontend/.env.local

# Verify content
cat frontend/.env.local

# Restart dev server
npm run dev
```

### Issue 2: Variables Undefined in Browser

**Cause:** Missing `NEXT_PUBLIC_` prefix

**Solution:**
```bash
# ❌ Wrong - not accessible in browser
API_URL=https://api.example.com

# ✅ Correct - accessible in browser
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Issue 3: Old Variables Still Used

**Cause:** Next.js caches environment variables

**Solution:**
```bash
# Delete .next cache
rm -rf frontend/.next

# Restart dev server
npm run dev
```

### Issue 4: Vercel Deployment Shows Old Values

**Cause:** Deployment uses cached environment variables

**Solution:**
```bash
# Update variables in Vercel dashboard
# Then trigger new deployment
vercel --prod

# Or redeploy via dashboard
Project → Deployments → Redeploy
```

### Issue 5: Environment Variables Not Working in Production

**Checklist:**
```bash
# 1. Verify variables are set in Vercel
vercel env ls

# 2. Check correct environment (Production/Preview/Development)

# 3. Verify NEXT_PUBLIC_ prefix for client-side variables

# 4. Redeploy after changing variables
vercel --prod

# 5. Check build logs for errors
vercel logs
```

---

## Variable Checklist

### Minimum Required for Development

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Recommended for Production

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (production project)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production key)
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `UPSTASH_REDIS_REST_URL` (if using rate limiting)
- [ ] `UPSTASH_REDIS_REST_TOKEN` (if using rate limiting)

### Optional Enhancements

- [ ] `NEXT_PUBLIC_GA_ID` (Google Analytics)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` (Error tracking)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Admin operations)
- [ ] `EMAIL_*` variables (Email notifications)

---

## Template Files

### .env.example

```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (Optional)
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Site Configuration (Optional)
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Rate Limiting (Optional)
# UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
# UPSTASH_REDIS_REST_TOKEN=your-token-here

# Analytics (Optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Monitoring (Optional)
# NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### .env.local (Do not commit)

```bash
# Copy from .env.example and fill with actual values
# This file is gitignored

NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Development overrides
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Additional Resources

### Documentation
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Client Configuration](https://supabase.com/docs/reference/javascript/initializing)

### Tools
- [Doppler](https://doppler.com/) - Secret management
- [dotenv-vault](https://www.dotenv.org/docs/security/vault) - Encrypted .env files
- [1Password Secrets Automation](https://1password.com/products/secrets/) - Team secret sharing

### Security
- [OWASP Secret Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App Config](https://12factor.net/config)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
