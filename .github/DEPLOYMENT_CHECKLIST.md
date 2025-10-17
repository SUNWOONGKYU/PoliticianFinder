# CI/CD Pipeline Deployment Checklist

Complete this checklist to deploy the CI/CD pipeline to your PoliticianFinder project.

---

## Pre-deployment Checklist

### 1. Environment Setup

- [ ] Node.js 20.x installed
- [ ] npm or yarn installed
- [ ] Git configured
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] GitHub CLI installed (optional, recommended)

### 2. Repository Setup

- [ ] GitHub repository created
- [ ] Local repository linked to GitHub
- [ ] `.github/workflows` directory exists
- [ ] All workflow files in place

### 3. Vercel Setup

- [ ] Vercel account created
- [ ] Project created on Vercel
- [ ] `vercel login` completed
- [ ] `vercel link` completed in frontend directory
- [ ] `.vercel/project.json` file exists

### 4. Supabase Setup

- [ ] Supabase project created
- [ ] Database configured
- [ ] API keys accessible
- [ ] URL and keys documented

---

## Configuration Checklist

### 1. Vercel Configuration

#### Get Vercel Credentials:

```bash
cd frontend
cat .vercel/project.json
```

- [ ] `orgId` copied (VERCEL_ORG_ID)
- [ ] `projectId` copied (VERCEL_PROJECT_ID)

#### Create Vercel Token:

1. Go to https://vercel.com/account/tokens
2. Create new token: "GitHub Actions CI/CD"
3. Copy token immediately

- [ ] Vercel token created
- [ ] Token saved securely (VERCEL_TOKEN)

### 2. Supabase Configuration

1. Go to Supabase Dashboard > Settings > API

- [ ] Project URL copied (NEXT_PUBLIC_SUPABASE_URL)
- [ ] Anon public key copied (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 3. GitHub Secrets Configuration

#### Add Secrets via Web Interface:

Go to: `Repository Settings > Secrets and variables > Actions`

- [ ] `VERCEL_TOKEN` added
- [ ] `VERCEL_ORG_ID` added
- [ ] `VERCEL_PROJECT_ID` added
- [ ] `NEXT_PUBLIC_SUPABASE_URL` added
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` added

#### OR Add via GitHub CLI:

```bash
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID
gh secret set NEXT_PUBLIC_SUPABASE_URL
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] All 5 secrets configured

#### Verify Secrets:

```bash
gh secret list
```

Expected output:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] All secrets visible in list

---

## File Verification Checklist

### Workflow Files

- [ ] `.github/workflows/ci.yml` exists (265 lines)
- [ ] `.github/workflows/cd.yml` exists (279 lines)
- [ ] `.github/workflows/pr.yml` exists (491 lines)
- [ ] `.github/workflows/e2e-tests.yml` exists (193 lines)

### Documentation Files

- [ ] `.github/workflows/README.md` exists (~400 lines)
- [ ] `.github/SECRETS_SETUP.md` exists (~500 lines)
- [ ] `.github/CICD_QUICK_REFERENCE.md` exists (~200 lines)
- [ ] `.github/DEPLOYMENT_CHECKLIST.md` exists (this file)
- [ ] `P2V2_CICD_IMPLEMENTATION_REPORT.md` exists (root)

### Total Files Created: 9

---

## Testing Checklist

### Phase 1: Local Validation

#### Verify Workflow Syntax:

- [ ] CI workflow syntax valid
- [ ] CD workflow syntax valid
- [ ] PR workflow syntax valid
- [ ] No YAML syntax errors

#### Test Local Build:

```bash
cd frontend
npm ci
npm run lint
npm run build
```

- [ ] Dependencies install successfully
- [ ] Lint passes
- [ ] Build succeeds
- [ ] No errors in output

### Phase 2: CI Workflow Test

#### Create Test Branch:

```bash
git checkout -b test/ci-pipeline-setup
echo "# CI Pipeline Test" >> README.md
git add .
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline-setup
```

- [ ] Branch created and pushed
- [ ] CI workflow triggered
- [ ] Go to Actions tab on GitHub

#### Verify CI Jobs:

- [ ] ✅ Lint Check job passes
- [ ] ✅ TypeScript Type Check job passes
- [ ] ✅ Build Application job passes
- [ ] ✅ Security Scan job passes
- [ ] ✅ CI Summary job passes

**Time taken:** ___________ (Target: < 5 minutes)

**Issues encountered:** _________________________________

### Phase 3: PR Workflow Test

#### Create Pull Request:

1. Go to GitHub repository
2. Click "Pull requests" > "New pull request"
3. Select `test/ci-pipeline-setup` → `main`
4. Title: `test: verify CI/CD pipeline setup`
5. Create pull request

- [ ] PR created successfully
- [ ] PR workflow triggered

#### Verify PR Jobs:

- [ ] ✅ PR Metadata Check passes
- [ ] ✅ PR auto-labeled correctly
- [ ] ✅ PR size labeled
- [ ] ✅ Code Quality Analysis passes
- [ ] ✅ Build and Test passes
- [ ] ✅ Preview Deployment succeeds
- [ ] ✅ Preview URL commented on PR
- [ ] ✅ E2E Tests on Preview passes
- [ ] ✅ Security Scan passes
- [ ] ✅ PR Summary posted

**Time taken:** ___________ (Target: < 8 minutes)

**Preview URL:** _________________________________________

**Issues encountered:** _________________________________

#### Test Preview Deployment:

1. Click preview URL in PR comment
2. Test application functionality

- [ ] Preview site loads
- [ ] Homepage accessible
- [ ] Navigation works
- [ ] No console errors

### Phase 4: CD Workflow Test (Production)

⚠️ **Only proceed when ready to deploy to production**

#### Merge to Main:

- [ ] All PR checks passed
- [ ] PR approved (if required)
- [ ] Merge PR to main branch

#### Verify CD Jobs:

- [ ] ✅ Pre-deployment Checks pass
- [ ] ✅ Production Build succeeds
- [ ] ✅ Deploy to Vercel succeeds
- [ ] ✅ Post-deployment Verification passes
- [ ] ✅ Deployment Notification sent

**Time taken:** ___________ (Target: < 6 minutes)

**Production URL:** ______________________________________

**Issues encountered:** _________________________________

#### Verify Production Deployment:

1. Visit production URL
2. Test critical paths

- [ ] Production site loads
- [ ] All pages accessible
- [ ] API calls working
- [ ] Authentication working (if applicable)
- [ ] No console errors
- [ ] No visual regressions

---

## Post-Deployment Checklist

### 1. Branch Protection Rules

Go to: `Repository Settings > Branches > Add rule`

Branch name pattern: `main`

- [ ] Require a pull request before merging
- [ ] Require status checks to pass before merging
- [ ] Require branches to be up to date
- [ ] Status checks required:
  - [ ] PR Metadata Check
  - [ ] Code Quality Analysis
  - [ ] Build and Test
  - [ ] Preview Deployment
  - [ ] E2E Tests on Preview
  - [ ] Security Scan
- [ ] Do not allow bypassing the above settings

### 2. Notification Setup (Optional)

#### Slack Integration:

- [ ] Slack workspace webhook created
- [ ] `SLACK_WEBHOOK` secret added
- [ ] Notification code added to workflows
- [ ] Test notification sent

#### Discord Integration:

- [ ] Discord webhook created
- [ ] `DISCORD_WEBHOOK` secret added
- [ ] Notification code added to workflows
- [ ] Test notification sent

### 3. Documentation

- [ ] Team briefed on CI/CD pipeline
- [ ] Workflow documentation reviewed
- [ ] Secrets setup guide accessible
- [ ] Quick reference card shared
- [ ] Troubleshooting guide available

### 4. Monitoring Setup

- [ ] Workflow run history reviewed
- [ ] Cache performance monitored
- [ ] Deployment success rate tracked
- [ ] Security scan results reviewed

---

## Rollback Testing (Optional but Recommended)

### Test Rollback Capability:

1. Make a breaking change
2. Deploy to production
3. Verify rollback procedure

- [ ] Breaking change deployed
- [ ] Rollback triggered
- [ ] Previous version restored
- [ ] Rollback notification sent
- [ ] Site functional after rollback

---

## Performance Validation

### Workflow Execution Times:

| Workflow | Target | Actual | Pass/Fail |
|----------|--------|--------|-----------|
| CI (Lint only) | < 2 min | _____ | ⬜ |
| CI (Full) | < 5 min | _____ | ⬜ |
| PR (Full) | < 8 min | _____ | ⬜ |
| CD (Deploy) | < 6 min | _____ | ⬜ |

### Cache Performance:

- [ ] Node modules cached
- [ ] Next.js build cached
- [ ] Playwright browsers cached
- [ ] Cache hit rate > 80%

### Build Size Analysis:

```bash
cd frontend
npm run build
```

- [ ] Build output reviewed
- [ ] Bundle sizes acceptable
- [ ] No unexpected large files
- [ ] Optimizations applied

---

## Security Validation

### Secret Security:

- [ ] No secrets in git history
- [ ] No secrets in logs
- [ ] Secrets not exposed in errors
- [ ] `.env.local` in `.gitignore`
- [ ] `.vercel` in `.gitignore`

### Dependency Security:

```bash
cd frontend
npm audit
```

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities
- [ ] Moderate vulnerabilities reviewed
- [ ] Dependency review configured

### Access Control:

- [ ] Only required people have secret access
- [ ] Vercel token has minimal permissions
- [ ] GitHub Actions has appropriate permissions
- [ ] Branch protection rules enforced

---

## Final Validation

### Developer Experience:

- [ ] Clear error messages
- [ ] Fast feedback loops
- [ ] Automatic PR comments
- [ ] Preview deployments working
- [ ] Documentation accessible

### Automation Quality:

- [ ] Auto-labeling working
- [ ] Conventional commits enforced
- [ ] Status checks comprehensive
- [ ] Deployment notifications working
- [ ] Rollback capability verified

### Overall System Health:

- [ ] All workflows passing
- [ ] No recurring failures
- [ ] Cache performance optimal
- [ ] Security scans clean
- [ ] Documentation complete

---

## Sign-off

### Deployment Information:

**Deployment Date:** _____________________

**Deployed By:** _____________________

**Git Commit Hash:** _____________________

**Production URL:** _____________________

### Verification Signatures:

**Developer:** _____________________ Date: _______

**DevOps:** _____________________ Date: _______

**QA:** _____________________ (optional) Date: _______

---

## Post-Deployment Actions

### Immediate (Within 24 hours):

- [ ] Monitor first production deployment
- [ ] Watch for any errors
- [ ] Check user feedback
- [ ] Verify analytics

### Short-term (Within 1 week):

- [ ] Review workflow metrics
- [ ] Optimize slow jobs
- [ ] Address any issues
- [ ] Update documentation

### Long-term (Within 1 month):

- [ ] Analyze cache hit rates
- [ ] Review security scans
- [ ] Plan enhancements
- [ ] Conduct team retrospective

---

## Troubleshooting Reference

### If CI fails:
1. Check workflow logs
2. Verify secrets configured
3. Test build locally
4. Review error messages

### If CD fails:
1. Verify Vercel credentials
2. Check deployment logs
3. Ensure build succeeds locally
4. Review environment variables

### If PR workflow fails:
1. Check PR title format
2. Verify preview deployment
3. Review E2E test results
4. Check security scan output

### Emergency Contacts:

**DevOps Team:** _____________________

**Vercel Support:** https://vercel.com/support

**GitHub Support:** https://support.github.com

---

## Success Criteria - Final Check

All items below must be checked for successful deployment:

- [ ] All 5 GitHub secrets configured
- [ ] All 4 workflows validated
- [ ] CI workflow passing
- [ ] PR workflow passing
- [ ] CD workflow passing
- [ ] Production deployment successful
- [ ] Preview deployments working
- [ ] E2E tests passing
- [ ] Security scans clean
- [ ] Documentation complete
- [ ] Team trained
- [ ] Branch protection enabled
- [ ] Monitoring in place

---

## Completion

🎉 **Congratulations!** Your CI/CD pipeline is now fully operational.

**Status:** ⬜ In Progress | ⬜ Testing | ⬜ Production Ready

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________

---

**Checklist Version:** 1.0.0
**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
