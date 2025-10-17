# GitHub Secrets Configuration Guide

This guide explains how to configure all required secrets for the CI/CD pipeline.

## Required Secrets Overview

| Secret Name | Description | Where to Find | Required For |
|-------------|-------------|---------------|--------------|
| `VERCEL_TOKEN` | Vercel authentication token | Vercel Account Settings | CD, PR Preview |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` | CD, PR Preview |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` | CD, PR Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard | All Workflows |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard | All Workflows |

## Step-by-Step Setup

### 1. Vercel Configuration

#### A. Install and Login to Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to your Vercel account
vercel login
```

#### B. Link Your Project

```bash
# Navigate to your frontend directory
cd frontend

# Link the project to Vercel
vercel link

# Follow the prompts:
# - Set up and deploy? No
# - Which scope? Select your team/account
# - Link to existing project? Yes (if exists) or No (if new)
# - What's your project's name? politician-frontend
# - In which directory is your code located? ./
```

This will create a `.vercel` directory with configuration files.

#### C. Get Organization ID and Project ID

```bash
# Display the project configuration
cat .vercel/project.json
```

You'll see output like:
```json
{
  "orgId": "team_xxxxxxxxxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxxxxxxxxx"
}
```

- Copy `orgId` → This is your `VERCEL_ORG_ID`
- Copy `projectId` → This is your `VERCEL_PROJECT_ID`

#### D. Create Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: `GitHub Actions CI/CD`
4. Scope: Select your team (or leave as personal)
5. Expiration: Recommend "No Expiration" for CI/CD
6. Click "Create Token"
7. **Copy the token immediately** (you won't see it again)
   - This is your `VERCEL_TOKEN`

### 2. Supabase Configuration

#### A. Get Supabase URL

1. Go to https://app.supabase.com
2. Select your project: `ooddlafwdpzgxfefgsrx`
3. Navigate to: `Settings > API`
4. Under "Project URL", copy the URL
   - Example: `https://ooddlafwdpzgxfefgsrx.supabase.co`
   - This is your `NEXT_PUBLIC_SUPABASE_URL`

#### B. Get Supabase Anonymous Key

1. In the same API settings page
2. Under "Project API keys", find `anon` `public`
3. Copy the key value
   - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **Note**: Use the `anon public` key, NOT the `service_role` key for frontend applications.

### 3. Add Secrets to GitHub

#### Method 1: GitHub Web Interface

1. Go to your repository on GitHub
2. Click `Settings` tab
3. In the left sidebar, click `Secrets and variables > Actions`
4. Click `New repository secret`
5. Add each secret:

   **Secret 1:**
   - Name: `VERCEL_TOKEN`
   - Value: `[paste your Vercel token]`
   - Click "Add secret"

   **Secret 2:**
   - Name: `VERCEL_ORG_ID`
   - Value: `[paste your org ID from .vercel/project.json]`
   - Click "Add secret"

   **Secret 3:**
   - Name: `VERCEL_PROJECT_ID`
   - Value: `[paste your project ID from .vercel/project.json]`
   - Click "Add secret"

   **Secret 4:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `[paste your Supabase URL]`
   - Click "Add secret"

   **Secret 5:**
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `[paste your Supabase anon key]`
   - Click "Add secret"

#### Method 2: GitHub CLI

If you have GitHub CLI installed:

```bash
# Install GitHub CLI if not installed
# Visit: https://cli.github.com/

# Login to GitHub
gh auth login

# Add secrets
gh secret set VERCEL_TOKEN
# Paste your token when prompted

gh secret set VERCEL_ORG_ID
# Paste your org ID when prompted

gh secret set VERCEL_PROJECT_ID
# Paste your project ID when prompted

gh secret set NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase key when prompted
```

### 4. Verify Secrets Configuration

After adding all secrets:

1. Go to `Settings > Secrets and variables > Actions`
2. Verify you see all 5 secrets listed:
   - ✅ VERCEL_TOKEN
   - ✅ VERCEL_ORG_ID
   - ✅ VERCEL_PROJECT_ID
   - ✅ NEXT_PUBLIC_SUPABASE_URL
   - ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY

### 5. Test the Configuration

#### A. Test CI Workflow

1. Make a small change in your code
2. Create a branch and commit:
   ```bash
   git checkout -b test/ci-setup
   git add .
   git commit -m "test: verify CI pipeline setup"
   git push origin test/ci-setup
   ```
3. Go to `Actions` tab on GitHub
4. Watch the CI workflow run
5. Verify all jobs pass

#### B. Test PR Workflow

1. Create a Pull Request from your test branch
2. Go to `Actions` tab
3. Watch the PR workflow run
4. Check for:
   - ✅ Preview deployment created
   - ✅ Preview URL commented on PR
   - ✅ All checks pass

#### C. Test CD Workflow (Production)

⚠️ **Only do this when ready to deploy**

1. Merge your PR to `main`
2. Go to `Actions` tab
3. Watch the CD workflow run
4. Verify:
   - ✅ Production build succeeds
   - ✅ Deployment to Vercel succeeds
   - ✅ Health checks pass

## Security Best Practices

### ✅ Do's

- ✅ Use environment-specific secrets
- ✅ Rotate tokens periodically (every 6-12 months)
- ✅ Use minimum required permissions for tokens
- ✅ Monitor secret usage in workflow runs
- ✅ Document all secrets and their purpose

### ❌ Don'ts

- ❌ Never commit secrets to git
- ❌ Don't share secrets via Slack/Email
- ❌ Don't use service_role key in frontend
- ❌ Don't print secrets in workflow logs
- ❌ Don't use same token across projects

## Troubleshooting

### Issue: "VERCEL_TOKEN is not set"

**Solution:**
1. Verify the secret name is exactly `VERCEL_TOKEN` (case-sensitive)
2. Check the secret value was copied completely
3. Regenerate token if needed

### Issue: "Vercel deployment failed - Invalid credentials"

**Solution:**
1. Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` match `.vercel/project.json`
2. Check token has not expired
3. Verify token has access to the organization

### Issue: "Build failed - Missing environment variables"

**Solution:**
1. Check Supabase secrets are configured
2. Verify secret names match exactly
3. Ensure values don't have extra spaces

### Issue: "Preview deployment works but production fails"

**Solution:**
1. Check if environment-specific variables are needed
2. Verify Vercel project settings
3. Check production environment variables in Vercel dashboard

## Rotating Secrets

### When to Rotate:

- Immediately if secret is compromised
- Every 6-12 months as best practice
- When team member with access leaves
- After security audit

### How to Rotate:

1. Generate new token/key from source
2. Update GitHub secret with new value
3. Test with a workflow run
4. Revoke old token/key
5. Document the rotation

## Additional Configuration

### Vercel Environment Variables

Add these in Vercel dashboard (`Settings > Environment Variables`):

1. `NEXT_PUBLIC_SUPABASE_URL`
   - Environment: Production, Preview, Development
   - Value: Your Supabase URL

2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Environment: Production, Preview, Development
   - Value: Your Supabase anon key

### Vercel Project Settings

Recommended settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm ci`
- **Node Version**: 20.x

## Verification Checklist

Before running workflows, verify:

- [ ] All 5 secrets are configured in GitHub
- [ ] Vercel project is linked and configured
- [ ] Supabase project is accessible
- [ ] `.vercel` directory is in `.gitignore`
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets in git history
- [ ] Workflow files have correct secret references

## Support

If you encounter issues:

1. Check this guide thoroughly
2. Review workflow run logs
3. Verify each secret individually
4. Test locally with `.env.local` first
5. Check Vercel deployment logs

## Quick Reference

```bash
# Get Vercel credentials
cat frontend/.vercel/project.json

# List GitHub secrets (shows names only, not values)
gh secret list

# Remove a secret
gh secret remove SECRET_NAME

# Test Vercel deployment locally
cd frontend
vercel --prod

# Check GitHub Actions status
gh run list

# View specific workflow run
gh run view [run-id]
```

---

**Last Updated:** 2025-10-17
**Security Level:** Confidential
**Owner:** DevOps Team
