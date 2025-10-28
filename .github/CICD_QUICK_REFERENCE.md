# CI/CD Quick Reference Card

Fast reference for common CI/CD tasks and workflows.

---

## Workflow Triggers

| Workflow | Trigger Events |
|----------|----------------|
| **CI** | Push to main/develop/feature/*, PR to main/develop |
| **CD** | Push to main, Manual dispatch |
| **PR** | PR opened/synchronize/reopened/ready_for_review |
| **E2E** | Push to main/develop, PR to main/develop, Manual |

---

## Required Secrets

```bash
VERCEL_TOKEN                    # Vercel API token
VERCEL_ORG_ID                  # Vercel organization ID
VERCEL_PROJECT_ID              # Vercel project ID
NEXT_PUBLIC_SUPABASE_URL       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anon key
```

---

## Common Commands

### Local Development
```bash
# Run dev server
npm run dev

# Build production
npm run build

# Run linter
npm run lint

# Run E2E tests
npm run test:e2e
```

### Vercel CLI
```bash
# Link project
vercel link

# Get project info
cat .vercel/project.json

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### GitHub CLI
```bash
# List secrets
gh secret list

# Set secret
gh secret set SECRET_NAME

# Remove secret
gh secret remove SECRET_NAME

# View workflow runs
gh run list

# View specific run
gh run view [run-id]

# Watch workflow
gh run watch
```

---

## PR Title Format

```
type(scope): description

Examples:
feat(auth): add Google OAuth
fix(ui): button alignment
docs: update README
test: add E2E tests
chore: update dependencies
```

**Types:**
`feat` `fix` `docs` `style` `refactor` `perf` `test` `chore` `ci` `build` `revert`

---

## Workflow Jobs

### CI Workflow
```
lint → typecheck → build
                      ↓
                  security
                      ↓
                  ci-summary
```

### CD Workflow
```
pre-deployment → build → deploy → verify → notify
                                    ↓
                                 rollback (on failure)
```

### PR Workflow
```
pr-metadata → code-quality → build-test
                                  ↓
                          preview-deploy
                                  ↓
                            e2e-preview
                                  ↓
                              security
                                  ↓
                            pr-summary
```

---

## Auto-Labels

| File Pattern | Labels |
|--------------|--------|
| `frontend/src/components` | `frontend`, `ui` |
| `frontend/e2e` | `testing` |
| `.github/workflows` | `ci/cd` |
| `*.ts`, `*.tsx` | `typescript` |
| `*.md` | `documentation` |

## Size Labels

| Changes | Label |
|---------|-------|
| < 100 | `size/xs` |
| 100-299 | `size/s` |
| 300-599 | `size/m` |
| 600-1199 | `size/l` |
| 1200+ | `size/xl` |

---

## Cache Keys

```yaml
# Node modules
${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

# Next.js build
${{ runner.os }}-nextjs-${{ context }}-${{ hashFiles('files') }}

# Playwright browsers
playwright-${{ hashFiles('package-lock.json') }}
```

---

## Troubleshooting

### Workflow Fails

**Check workflow logs:**
```bash
gh run view [run-id] --log
```

**Re-run failed jobs:**
```bash
gh run rerun [run-id]
```

### Secrets Not Working

**Verify secret exists:**
```bash
gh secret list
```

**Re-set secret:**
```bash
gh secret set SECRET_NAME
```

### Cache Issues

**Clear cache manually:**
1. Go to Actions tab
2. Click "Caches"
3. Delete problematic caches

### Deployment Fails

**Check Vercel credentials:**
```bash
cat frontend/.vercel/project.json
vercel whoami
```

**Test local deployment:**
```bash
cd frontend
vercel --prod
```

---

## Status Indicators

| Icon | Meaning |
|------|---------|
| ✅ | Success |
| ❌ | Failed |
| ⚠️ | Warning |
| 🔄 | In Progress |
| ⏸️ | Pending |

---

## Workflow URLs

```bash
# CI Workflow
.github/workflows/ci.yml

# CD Workflow
.github/workflows/cd.yml

# PR Workflow
.github/workflows/pr.yml

# E2E Workflow
.github/workflows/e2e-tests.yml
```

---

## Environment URLs

```bash
# Production
https://[project].vercel.app

# Preview (PR)
https://[project]-[hash]-[team].vercel.app
```

---

## Quick Fixes

### Fix Lint Errors
```bash
npm run lint
# Fix auto-fixable issues
npx eslint --fix .
```

### Fix Type Errors
```bash
npx tsc --noEmit
# Review and fix type issues
```

### Update Dependencies
```bash
npm update
npm audit fix
```

### Clear Next.js Cache
```bash
rm -rf .next
npm run build
```

---

## Deployment Checklist

### Before Merging to Main:
- [ ] All CI checks pass
- [ ] PR approved
- [ ] Preview deployment tested
- [ ] E2E tests pass
- [ ] No security vulnerabilities
- [ ] Changelog updated (if applicable)

### After Deployment:
- [ ] Monitor CD workflow
- [ ] Verify production URL
- [ ] Check for errors in logs
- [ ] Test critical paths
- [ ] Monitor user reports

---

## Emergency Procedures

### Rollback Production

**Method 1: Vercel Dashboard**
1. Go to Vercel dashboard
2. Find previous deployment
3. Click "Promote to Production"

**Method 2: Vercel CLI**
```bash
vercel rollback [deployment-url] --token=$VERCEL_TOKEN
```

**Method 3: GitHub**
1. Revert the commit
2. Push to main
3. CD workflow will redeploy

### Stop Running Workflow
```bash
gh run cancel [run-id]
```

### Disable Workflow
1. Go to Actions tab
2. Select workflow
3. Click "Disable workflow"

---

## Performance Targets

| Metric | Target |
|--------|--------|
| CI Runtime | < 5 min |
| CD Runtime | < 6 min |
| PR Runtime | < 8 min |
| Cache Hit Rate | > 80% |
| Deployment Success | > 95% |

---

## Contact & Support

- **Documentation:** `.github/workflows/README.md`
- **Setup Guide:** `.github/SECRETS_SETUP.md`
- **Implementation Report:** `P2V2_CICD_IMPLEMENTATION_REPORT.md`
- **Issues:** GitHub Issues tab
- **DevOps Team:** [contact info]

---

## Useful Links

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Vercel Docs](https://vercel.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Playwright Docs](https://playwright.dev)
- [Conventional Commits](https://www.conventionalcommits.org)

---

**Quick Access:**
- `Actions Tab`: View all workflow runs
- `Settings > Secrets`: Manage secrets
- `Settings > Branches`: Configure protection rules
- `Pull Requests`: View PRs and checks

---

**Last Updated:** 2025-10-17
**Version:** 1.0.0
