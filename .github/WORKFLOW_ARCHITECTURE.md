# CI/CD Workflow Architecture

Visual guide to the PoliticianFinder CI/CD pipeline architecture.

---

## Complete Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GitHub Actions CI/CD Pipeline                     │
│                         PoliticianFinder                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          TRIGGER EVENTS                              │
└─────────────────────────────────────────────────────────────────────┘

    Push to Branch            Pull Request            Manual Dispatch
         │                         │                         │
         ├── main ────────────────┼─────────────────────────┤
         ├── develop ─────────────┼─────────────────────────┤
         └── feature/* ───────────┘                         │
                                                             │
                    ┌────────────────┬──────────────────────┘
                    │                │
                    ▼                ▼
         ┌──────────────────┐  ┌──────────────────┐
         │   CI WORKFLOW    │  │   CD WORKFLOW    │
         └──────────────────┘  └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   PR WORKFLOW    │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  E2E WORKFLOW    │
         └──────────────────┘
```

---

## CI Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CI - Continuous Integration                      │
│                           (ci.yml)                                   │
└─────────────────────────────────────────────────────────────────────┘

Trigger: Push to main/develop/feature/* OR Pull Request
Duration: ~2-5 minutes (with cache)

┌─────────────────────────────────────────────────────────────────────┐
│  START: Code Push or PR                                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────┐
    │   Lint Check     │          │  TypeScript      │
    │                  │          │  Type Check      │
    │ • ESLint         │          │                  │
    │ • Code style     │          │ • tsc --noEmit   │
    │ • Auto-fixable   │          │ • Type safety    │
    └──────────────────┘          └──────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Build Test      │
                    │                  │
                    │ • npm build      │
                    │ • Production env │
                    │ • Artifact save  │
                    └──────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────┐
    │ Security Scan    │          │ Dependency       │
    │                  │          │ Review           │
    │ • npm audit      │          │                  │
    │ • Vulnerabilities│          │ • PR only        │
    │ • Report gen     │          │ • GitHub action  │
    └──────────────────┘          └──────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   CI Summary     │
                    │                  │
                    │ • Aggregate      │
                    │ • Comment PR     │
                    │ • Status report  │
                    └──────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  RESULT: ✅ Pass / ❌ Fail │
                └─────────────────────────┘
```

---

## CD Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CD - Continuous Deployment                        │
│                           (cd.yml)                                   │
└─────────────────────────────────────────────────────────────────────┘

Trigger: Push to main OR Manual dispatch
Duration: ~4-6 minutes (with cache)

┌─────────────────────────────────────────────────────────────────────┐
│  START: Push to main branch                                         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │  Pre-deployment Checks   │
                │                          │
                │ • Change detection       │
                │ • Secret validation      │
                │ • Git diff frontend/     │
                │                          │
                │ Output: should-deploy    │
                └──────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              Changed: Yes         Changed: No
                    │                   │
                    │                   └──> SKIP (No deployment needed)
                    │
                    ▼
        ┌──────────────────────┐
        │  Production Build    │
        │                      │
        │ • npm ci             │
        │ • npm build (prod)   │
        │ • Optimized bundle   │
        │ • Cache artifacts    │
        └──────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  Deploy to Vercel    │
        │                      │
        │ • Vercel CLI         │
        │ • Production env     │
        │ • Capture URL        │
        │ • Environment track  │
        └──────────────────────┘
                    │
                    ▼
        ┌──────────────────────┐
        │  Verification        │
        │                      │
        │ • Wait for ready     │
        │ • Health check       │
        │ • Smoke tests        │
        │ • URL accessibility  │
        └──────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
   Success ✅                Failure ❌
        │                        │
        ▼                        ▼
┌────────────────┐    ┌──────────────────┐
│ Notify Success │    │  Rollback        │
│                │    │                  │
│ • Summary      │    │ • Previous ver   │
│ • Metadata     │    │ • Notification   │
│ • Extensible   │    │ • Manual trigger │
└────────────────┘    └──────────────────┘
        │                        │
        └────────────┬───────────┘
                     │
                     ▼
        ┌─────────────────────────┐
        │ RESULT: Deployed / Rolled│
        └─────────────────────────┘
```

---

## PR Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                   PR - Pull Request Automation                       │
│                           (pr.yml)                                   │
└─────────────────────────────────────────────────────────────────────┘

Trigger: PR opened/synchronized/reopened/ready_for_review
Duration: ~5-8 minutes (with cache)

┌─────────────────────────────────────────────────────────────────────┐
│  START: Pull Request Event                                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   PR Metadata Check      │
                │                          │
                │ • Title validation       │
                │ • Conventional commits   │
                │ • Auto-labeling          │
                │ • Size classification    │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Code Quality           │
                │                          │
                │ • ESLint                 │
                │ • TypeScript check       │
                │ • Format check           │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Build & Test           │
                │                          │
                │ • Production build       │
                │ • Bundle analysis        │
                │ • Artifact save          │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Preview Deploy         │
                │                          │
                │ • Vercel preview         │
                │ • Unique URL per PR      │
                │ • Comment on PR          │
                │ • Environment track      │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   E2E Tests (Preview)    │
                │                          │
                │ • Playwright             │
                │ • Chromium desktop       │
                │ • Screenshot/video       │
                │ • Test report            │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Security Scan          │
                │                          │
                │ • npm audit              │
                │ • Dependency review      │
                │ • Vulnerability report   │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   PR Summary             │
                │                          │
                │ • Aggregate results      │
                │ • Status table           │
                │ • Merge readiness        │
                │ • Update comment         │
                └──────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │ RESULT: ✅ Ready / ❌ Block│
                └─────────────────────────┘
```

---

## E2E Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     E2E - End-to-End Testing                         │
│                        (e2e-tests.yml)                               │
└─────────────────────────────────────────────────────────────────────┘

Trigger: Push to main/develop OR Pull Request
Duration: ~10-15 minutes

┌─────────────────────────────────────────────────────────────────────┐
│  START: Code change in frontend                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
          ┌───────────────────────────────────────┐
          │      E2E Tests (Matrix Strategy)      │
          └───────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌──────────┐        ┌──────────┐       ┌──────────┐
    │ Chromium │        │ Firefox  │       │  Mobile  │
    │ Desktop  │        │ Desktop  │       │  Chrome  │
    └──────────┘        └──────────┘       └──────────┘
          │                   │                   │
          │  • Build app      │                   │
          │  • Start server   │                   │
          │  • Run tests      │                   │
          │  • Capture fails  │                   │
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Upload Artifacts       │
                │                          │
                │ • Test results           │
                │ • Screenshots            │
                │ • Videos                 │
                │ • HTML report            │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Test Coverage          │
                │                          │
                │ • Aggregate results      │
                │ • Coverage report        │
                │ • Statistics             │
                └──────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────┐
                │   Playwright Report      │
                │                          │
                │ • HTML report publish    │
                │ • Comment on PR          │
                │ • Link to artifacts      │
                └──────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  RESULT: Test Results    │
                └─────────────────────────┘
```

---

## Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Multi-Level Caching                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Level 1: Node Modules Cache                                        │
└─────────────────────────────────────────────────────────────────────┘

    Cache Key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
    Restore Keys: ${{ runner.os }}-node-

    Paths:
    • frontend/node_modules
    • ~/.npm

    Invalidation: When package-lock.json changes
    Hit Rate: ~95% (changes rarely)
    Time Saved: 2-3 minutes per run

┌─────────────────────────────────────────────────────────────────────┐
│  Level 2: Next.js Build Cache                                       │
└─────────────────────────────────────────────────────────────────────┘

    Cache Key: ${{ runner.os }}-nextjs-${{ context }}-${{ hashFiles(...) }}
    Context: prod, pr-[number]

    Paths:
    • frontend/.next/cache

    Invalidation: When source files or dependencies change
    Hit Rate: ~70% (changes frequently)
    Time Saved: 1-2 minutes per run

┌─────────────────────────────────────────────────────────────────────┐
│  Level 3: Playwright Browsers Cache                                 │
└─────────────────────────────────────────────────────────────────────┘

    Cache Key: playwright-${{ hashFiles('package-lock.json') }}

    Paths:
    • ~/.cache/ms-playwright

    Invalidation: When Playwright version changes
    Hit Rate: ~90% (version locked)
    Time Saved: 2-3 minutes per run (E2E only)

┌─────────────────────────────────────────────────────────────────────┐
│  Total Cache Impact                                                  │
└─────────────────────────────────────────────────────────────────────┘

    Without Cache          With Cache             Improvement
    ─────────────         ──────────             ───────────
    6-8 min (CI)     →    2-3 min (CI)           60-70%
    10-12 min (CD)   →    4-6 min (CD)           55-60%
    15-20 min (PR)   →    5-8 min (PR)           60-70%
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Security Architecture                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Secrets Management                                                  │
└─────────────────────────────────────────────────────────────────────┘

    GitHub Secrets (Encrypted Storage)
              │
              ├─> VERCEL_TOKEN ──────────┐
              ├─> VERCEL_ORG_ID ─────────┤
              ├─> VERCEL_PROJECT_ID ─────┤──> Workflow Access
              ├─> NEXT_PUBLIC_SUPABASE_URL ─┤
              └─> NEXT_PUBLIC_SUPABASE_ANON_KEY ─┘

    • Never exposed in logs
    • Pre-deployment validation
    • Minimal permission scope
    • Rotation procedures

┌─────────────────────────────────────────────────────────────────────┐
│  Vulnerability Scanning                                              │
└─────────────────────────────────────────────────────────────────────┘

    npm audit (Every workflow run)
              │
              ├─> Check dependencies
              ├─> Severity: moderate+
              ├─> Generate report
              └─> 30-day retention

    Dependency Review (PR only)
              │
              ├─> GitHub Security
              ├─> Severity: high+
              ├─> Block on high vuln
              └─> Automatic alerts

┌─────────────────────────────────────────────────────────────────────┐
│  Access Control                                                      │
└─────────────────────────────────────────────────────────────────────┘

    Branch Protection
              │
              ├─> Require PR reviews
              ├─> Require status checks
              ├─> Require up-to-date branches
              ├─> Restrict direct push
              └─> No force push

    Environment Protection
              │
              ├─> Production environment
              ├─> Preview environment per PR
              ├─> Environment secrets
              └─> Deployment tracking
```

---

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Complete Deployment Flow                          │
└─────────────────────────────────────────────────────────────────────┘

Developer Workflow:
─────────────────

    ┌─────────────┐
    │  Developer  │
    │   Writes    │
    │    Code     │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Create    │
    │   Branch    │
    │  feature/*  │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │   Commit    │
    │  Changes    │
    │ (conv.com.) │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    Push     │
    │  to GitHub  │
    └──────┬──────┘
           │
           ├──> CI Workflow (Lint, TypeCheck, Build, Security)
           │
           ▼
    ┌─────────────┐
    │   Create    │
    │  Pull Req   │
    └──────┬──────┘
           │
           ├──> PR Workflow (All checks + Preview deploy + E2E)
           │
           ▼
    ┌─────────────┐
    │   Review    │
    │   & Approve │
    └──────┬──────┘
           │
           ▼
    ┌─────────────┐
    │    Merge    │
    │  to main    │
    └──────┬──────┘
           │
           ├──> CD Workflow (Build + Deploy + Verify)
           │
           ▼
    ┌─────────────┐
    │ Production  │
    │  Deployed   │
    └─────────────┘

Quality Gates:
──────────────

    PR Creation
         │
         ▼
    ┌──────────────────────┐
    │ • Title format       │──> MUST PASS
    │ • Auto-labels        │
    │ • Size check         │
    └──────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ • Lint               │──> MUST PASS
    │ • TypeScript         │──> MUST PASS
    │ • Build              │──> MUST PASS
    └──────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ • Preview deploy     │──> MUST PASS
    │ • E2E tests          │──> MUST PASS
    │ • Security scan      │──> WARN ONLY
    └──────────────────────┘
         │
         ▼
    ┌──────────────────────┐
    │ MERGE ALLOWED        │
    └──────────────────────┘
```

---

## Error Handling & Recovery

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Error Handling Flow                               │
└─────────────────────────────────────────────────────────────────────┘

    Workflow Execution
           │
           ├─> Job Fails
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Upload Artifacts │
           │   │ • Logs           │
           │   │ • Screenshots    │
           │   │ • Reports        │
           │   └──────────────────┘
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Comment on PR    │
           │   │ • Error details  │
           │   │ • Logs link      │
           │   │ • Suggestions    │
           │   └──────────────────┘
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Developer Fix    │
           │   │ • Review logs    │
           │   │ • Fix code       │
           │   │ • Push again     │
           │   └──────────────────┘
           │        │
           │        └─> Re-run Workflow
           │
           ├─> Deployment Fails
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Rollback Trigger │
           │   │ • Manual         │
           │   │ • Automatic      │
           │   └──────────────────┘
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Restore Previous │
           │   │ • Vercel         │
           │   │ • Git revert     │
           │   └──────────────────┘
           │        │
           │        ▼
           │   ┌──────────────────┐
           │   │ Notify Team      │
           │   │ • Status         │
           │   │ • Action needed  │
           │   └──────────────────┘
           │
           └─> Success
                   │
                   ▼
              ┌──────────────────┐
              │ Continue         │
              └──────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                       System Integrations                            │
└─────────────────────────────────────────────────────────────────────┘

    GitHub
      │
      ├─> Actions (CI/CD execution)
      ├─> Secrets (Secure storage)
      ├─> Environments (Deployment tracking)
      ├─> Status Checks (Branch protection)
      ├─> Comments (PR automation)
      └─> Security Alerts

    Vercel
      │
      ├─> CLI (Deployment)
      ├─> API (Project management)
      ├─> Environments (Production, Preview)
      ├─> Domains (URL management)
      └─> Analytics

    Supabase
      │
      ├─> API (Backend services)
      ├─> Auth (Authentication)
      ├─> Database (Data storage)
      └─> Edge Functions

    Next.js
      │
      ├─> Build System (Optimization)
      ├─> App Router (Routing)
      ├─> SSR/SSG (Rendering)
      └─> Image Optimization

    Playwright
      │
      ├─> Test Runner (E2E execution)
      ├─> Browsers (Multi-browser)
      ├─> Reporter (HTML reports)
      └─> Screenshots/Videos
```

---

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Performance Optimizations                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Parallel Execution                                                  │
└─────────────────────────────────────────────────────────────────────┘

    CI Workflow:
    ┌──────────┐  ┌──────────┐
    │   Lint   │  │TypeCheck │  (Parallel)
    └──────────┘  └──────────┘
           │            │
           └─────┬──────┘
                 ▼
          ┌──────────┐
          │  Build   │  (Sequential)
          └──────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
    ┌──────────┐  ┌──────────┐
    │ Security │  │Dep Review│  (Parallel)
    └──────────┘  └──────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Cache Strategy                                                      │
└─────────────────────────────────────────────────────────────────────┘

    First Run (Cold Cache):
    ├─> Install dependencies: 3 min
    ├─> Build application: 2 min
    └─> Total: 5 min

    Subsequent Runs (Warm Cache):
    ├─> Restore cache: 10 sec
    ├─> Install new deps: 30 sec
    ├─> Incremental build: 1 min
    └─> Total: 2 min

    Improvement: 60% faster

┌─────────────────────────────────────────────────────────────────────┐
│  Conditional Execution                                               │
└─────────────────────────────────────────────────────────────────────┘

    • Skip deployment if no frontend changes
    • Run E2E only on PR/main
    • Run dependency review only on PR
    • Skip jobs if previous jobs fail (fail-fast)
```

---

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Monitoring Dashboard                              │
└─────────────────────────────────────────────────────────────────────┘

    GitHub Actions Tab
          │
          ├─> Workflow Runs
          │   • Status (Success/Failure)
          │   • Duration
          │   • Triggered by
          │   • Branch/PR
          │
          ├─> Cache Usage
          │   • Hit rate
          │   • Storage used
          │   • Cache keys
          │
          ├─> Artifacts
          │   • Test results
          │   • Build artifacts
          │   • Reports
          │
          └─> Security Alerts
              • Vulnerabilities
              • Dependencies
              • Code scanning

    Vercel Dashboard
          │
          ├─> Deployments
          │   • Status
          │   • URL
          │   • Duration
          │   • Logs
          │
          ├─> Analytics
          │   • Traffic
          │   • Performance
          │   • Errors
          │
          └─> Edge Functions
              • Invocations
              • Duration
              • Errors

Key Metrics:
───────────

    ├─> Workflow Success Rate: Target > 95%
    ├─> Average Build Time: Target < 5 min
    ├─> Cache Hit Rate: Target > 80%
    ├─> Deployment Success: Target > 95%
    ├─> E2E Test Pass Rate: Target > 90%
    └─> Security Issues: Target = 0 high
```

---

## Extensibility Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Easy Extension Points                             │
└─────────────────────────────────────────────────────────────────────┘

Add Notifications:
─────────────────

    • Slack integration
    • Discord integration
    • Email notifications
    • Custom webhooks

Add Testing:
───────────

    • Unit tests
    • Integration tests
    • Visual regression tests
    • Performance tests
    • Accessibility tests

Add Quality Checks:
──────────────────

    • Code coverage
    • Bundle size limits
    • Performance budgets
    • Lighthouse CI
    • SonarQube

Add Environments:
────────────────

    • Staging environment
    • QA environment
    • Development environment
    • Canary deployments

Add Automation:
──────────────

    • Semantic versioning
    • Changelog generation
    • Release notes
    • Git tags
    • NPM publishing
```

---

## Architecture Summary

### Key Principles

1. **Automation First:** Maximum automation with minimal manual intervention
2. **Fail Fast:** Quick feedback on errors
3. **Security by Default:** Built-in security scanning and secret management
4. **Developer Experience:** Clear feedback, fast execution, helpful errors
5. **Extensibility:** Easy to add new features and integrations
6. **Reliability:** Rollback capability, health checks, monitoring

### Architecture Highlights

- ✅ 4 comprehensive workflows
- ✅ Multi-level caching (60-70% faster)
- ✅ Parallel job execution
- ✅ Conditional execution
- ✅ Preview deployments per PR
- ✅ Automatic rollback capability
- ✅ Comprehensive error handling
- ✅ Security scanning built-in
- ✅ Auto-labeling and validation
- ✅ Extensible notification system

---

**Document:** WORKFLOW_ARCHITECTURE.md
**Version:** 1.0.0
**Last Updated:** 2025-10-17
