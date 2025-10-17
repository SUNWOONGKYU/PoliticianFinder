# GitHub Actions CI/CD Pipeline

This directory contains GitHub Actions workflows for the PoliticianFinder project.

## Workflows Overview

### 1. CI - Continuous Integration (`ci.yml`)
**Triggers:** Push to `main`, `develop`, `feature/**` branches or Pull Requests

**Jobs:**
- **Lint Check**: Runs ESLint on the codebase
- **TypeScript Type Check**: Validates TypeScript types
- **Build Application**: Tests production build
- **Security Scan**: Runs npm audit for dependency vulnerabilities
- **Dependency Review**: Reviews dependencies for security issues (PR only)
- **CI Summary**: Aggregates results and comments on PRs

**Caching Strategy:**
- Node modules caching
- Next.js build cache

### 2. CD - Continuous Deployment (`cd.yml`)
**Triggers:** Push to `main` branch or manual dispatch

**Jobs:**
- **Pre-deployment Checks**: Verifies configuration and detects changes
- **Production Build**: Builds optimized production bundle
- **Deploy to Vercel**: Deploys to Vercel production
- **Post-deployment Verification**: Health checks and smoke tests
- **Deployment Notification**: Sends deployment status notifications
- **Rollback Capability**: Manual rollback support (workflow_dispatch only)

**Caching Strategy:**
- Node modules caching
- Next.js production build cache
- Vercel deployment artifacts

### 3. PR - Pull Request Checks (`pr.yml`)
**Triggers:** Pull Request events (opened, synchronize, reopened, ready_for_review)

**Jobs:**
- **PR Metadata Check**: Validates PR title format (conventional commits)
- **Auto-labeling**: Automatically labels PRs based on changed files
- **PR Size Check**: Labels PR by size (xs, s, m, l, xl)
- **Code Quality Analysis**: Runs linting and type checking
- **Build and Test**: Tests production build
- **Preview Deployment**: Deploys to Vercel preview environment
- **E2E Tests on Preview**: Runs Playwright tests on preview deployment
- **Security Scan**: Dependency vulnerability and review
- **PR Summary**: Aggregates all check results

**Features:**
- Conventional commits validation
- Automatic labeling system
- PR size analysis
- Preview deployments with URL comments
- E2E testing on preview environment

### 4. E2E Tests (`e2e-tests.yml`)
**Triggers:** Push to `main`, `develop` or Pull Requests

**Jobs:**
- **E2E Tests**: Runs Playwright tests across multiple browsers
  - Chromium Desktop
  - Firefox Desktop
  - Mobile Chrome
- **Test Coverage**: Calculates and reports test coverage
- **Playwright Report**: Publishes HTML test reports

**Features:**
- Multi-browser testing
- Test result artifacts
- Screenshot/video capture on failure
- HTML report publishing
- PR comments with results

## Required GitHub Secrets

Configure the following secrets in your GitHub repository settings:

### Vercel Deployment
```
VERCEL_TOKEN           - Vercel authentication token
VERCEL_ORG_ID         - Your Vercel organization ID
VERCEL_PROJECT_ID     - Your Vercel project ID
```

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL      - Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
```

## Setup Instructions

### 1. Configure Vercel Secrets

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   cd frontend
   vercel link
   ```

4. Get your Vercel credentials:
   ```bash
   # Get Organization ID
   vercel teams ls

   # Get Project ID
   cat .vercel/project.json
   ```

5. Create a Vercel token:
   - Go to https://vercel.com/account/tokens
   - Create a new token
   - Copy the token value

6. Add secrets to GitHub:
   - Go to: `Settings > Secrets and variables > Actions`
   - Click "New repository secret"
   - Add each secret with its value

### 2. Configure Supabase Secrets

1. Go to your Supabase project dashboard
2. Navigate to `Settings > API`
3. Copy the following values:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Add these to GitHub Secrets

### 3. Enable GitHub Actions

1. Go to your repository's `Actions` tab
2. Enable GitHub Actions if not already enabled
3. Workflows will run automatically based on their triggers

## Workflow Features

### Caching Strategy

All workflows implement aggressive caching to improve performance:

- **Node Modules**: Cached by `package-lock.json` hash
- **Next.js Build**: Cached by dependencies and source files
- **Playwright Browsers**: Cached for E2E tests

### Security Features

- Dependency vulnerability scanning (npm audit)
- Dependency review on PRs
- Secret validation before deployment
- Automated security updates

### Quality Gates

PRs must pass the following checks before merging:

1. ✅ Conventional commits format
2. ✅ ESLint validation
3. ✅ TypeScript type checking
4. ✅ Successful build
5. ✅ E2E tests passing
6. ✅ Security scan (moderate level)

### Deployment Strategy

**Main Branch (Production):**
- Automatic deployment to Vercel production
- Health checks and verification
- Deployment notifications
- Rollback capability

**Pull Requests (Preview):**
- Automatic preview deployments
- Unique URL per PR
- E2E tests on preview
- URL posted as PR comment

## PR Title Format

PRs must follow conventional commits format:

```
type(scope): description

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation changes
- style:    Code style changes (formatting)
- refactor: Code refactoring
- perf:     Performance improvements
- test:     Adding or updating tests
- chore:    Maintenance tasks
- ci:       CI/CD changes
- build:    Build system changes
- revert:   Revert previous changes

Examples:
- feat(auth): add Google OAuth login
- fix(ui): resolve button alignment issue
- docs: update API documentation
- test(e2e): add politician detail page tests
```

## Auto-labeling System

PRs are automatically labeled based on:

**File Changes:**
- `frontend` - Changes in frontend directory
- `ui` - Changes in components
- `testing` - Changes in e2e tests
- `ci/cd` - Changes in workflows
- `typescript` - TypeScript file changes
- `documentation` - Markdown file changes

**PR Size:**
- `size/xs` - < 100 changes
- `size/s` - 100-299 changes
- `size/m` - 300-599 changes
- `size/l` - 600-1199 changes
- `size/xl` - 1200+ changes

## Monitoring and Notifications

### Deployment Notifications

Currently configured to log deployment status. You can extend with:

- **Slack**: Add Slack webhook URL as secret
- **Discord**: Add Discord webhook URL as secret
- **Email**: Configure email notifications

### Example Slack Integration:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Troubleshooting

### Common Issues

1. **Build fails with missing secrets**
   - Verify all secrets are configured in GitHub
   - Check secret names match exactly

2. **Vercel deployment fails**
   - Verify Vercel token is valid
   - Check organization and project IDs are correct
   - Ensure Vercel project is linked

3. **E2E tests fail**
   - Check Playwright configuration
   - Verify base URL is accessible
   - Review test artifacts for details

4. **Cache issues**
   - Clear GitHub Actions cache manually
   - Update cache keys if needed

### Manual Workflow Triggers

You can manually trigger workflows:

1. Go to `Actions` tab
2. Select the workflow
3. Click "Run workflow"
4. Select branch and parameters

## Best Practices

1. **Always use conventional commits** for PR titles
2. **Keep PRs small** (aim for size/s or smaller)
3. **Review E2E test results** before merging
4. **Monitor deployment status** after merging to main
5. **Use preview deployments** to test changes
6. **Fix security vulnerabilities** promptly

## Performance Optimization

Current optimizations:

- Parallel job execution
- Aggressive caching
- Conditional job execution
- Incremental builds
- Browser-specific Playwright installations

## Future Enhancements

Planned improvements:

- [ ] Visual regression testing
- [ ] Performance budgets
- [ ] Lighthouse CI integration
- [ ] Advanced bundle analysis
- [ ] Automated changelog generation
- [ ] Semantic versioning automation

## Support

For issues or questions:

1. Check workflow run logs in Actions tab
2. Review this documentation
3. Check individual workflow YAML files
4. Contact DevOps team

---

**Last Updated:** 2025-10-17
**Maintained By:** DevOps Team
