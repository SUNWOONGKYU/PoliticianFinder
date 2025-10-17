# Monitoring & Testing Quick Reference

Quick commands and configurations for Phase 3 monitoring and testing.

## Running Tests

```bash
# Run all Phase 3 tests
npm run test:phase3

# Individual test suites
npm run test:notifications      # P3T1: Notification system
npm run test:bookmarks          # P3T2: Bookmark system
npm run test:comments           # P3T3: Comment system

# With UI (recommended for debugging)
npm run test:e2e:ui

# Generate and view report
npm run test:e2e:report
```

## Health Check

```bash
# Local development
curl http://localhost:3000/api/health

# Production
curl https://your-domain.com/api/health

# Simple ping
curl -I https://your-domain.com/api/health
```

## Analytics Tracking

```typescript
import { analytics } from '@/lib/monitoring/analytics';

// User actions
analytics.userSignUp()
analytics.userLogin()
analytics.userLogout()

// Content interactions
analytics.politicianView(politicianId)
analytics.ratingSubmit(politicianId, rating)
analytics.commentSubmit(politicianId)
analytics.replySubmit(commentId)
analytics.likeAction('comment', commentId)
analytics.bookmarkToggle(politicianId, 'add')

// Notifications
analytics.notificationClick(notificationType)
analytics.notificationMarkRead(count)

// Search & filter
analytics.search(query, resultsCount)
analytics.filterApply(filters)
analytics.sortChange(sortBy, sortOrder)

// Errors
analytics.formError('commentForm', 'validation')
analytics.apiError('/api/comments', 400)

// Performance
analytics.pageLoadTime(duration)
analytics.apiResponseTime('/api/politicians', duration)
```

## Error Tracking

```typescript
import { captureError, captureMessage, addBreadcrumb } from '@/lib/monitoring/sentry';

// Capture errors
try {
  // code
} catch (error) {
  captureError(error, {
    tags: { component: 'CommentForm' },
    level: 'error',
    extra: { userId: '123', action: 'submit' }
  });
}

// Capture messages
captureMessage('User completed onboarding', 'info', {
  userId: '123',
  timestamp: Date.now()
});

// Add breadcrumbs for debugging
addBreadcrumb('User clicked submit', 'ui.click', 'info', {
  buttonId: 'submit-comment',
  formData: { length: 100 }
});
```

## User Context

```typescript
import { setUserContext, clearUserContext } from '@/lib/monitoring/sentry';

// On login
setUserContext({
  id: user.id,
  username: user.username,
  email: user.email
});

// On logout
clearUserContext();
```

## Performance Monitoring

```typescript
import { performanceMonitor } from '@/lib/monitoring/analytics';

// Measure operation
performanceMonitor.start('fetch-politicians');
const data = await fetchPoliticians();
const duration = performanceMonitor.end('fetch-politicians');

console.log(`Operation took ${duration}ms`);
```

## Environment Variables

```env
# Testing
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_id

# Error Tracking
NEXT_PUBLIC_SENTRY_DSN=your_dsn
SENTRY_AUTH_TOKEN=your_token

# Health Check
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## Monitoring URLs

```
Vercel Analytics:  https://vercel.com/[org]/politician-finder/analytics
Sentry Dashboard:  https://sentry.io/organizations/[org]/issues/
Uptime Monitor:    https://stats.uptimerobot.com/[page]
Health Check:      https://your-domain.com/api/health
```

## CI/CD Workflow

```bash
# Trigger manually
gh workflow run phase3-tests.yml

# View workflow runs
gh run list --workflow=phase3-tests.yml

# Download test artifacts
gh run download [run-id]
```

## Common Issues

### Tests failing locally
```bash
rm -rf test-results playwright-report node_modules
npm install
npx playwright install --with-deps
npm run test:e2e
```

### Health check returning 503
- Check Supabase credentials
- Verify database connection
- Review Supabase dashboard

### Sentry not capturing errors
- Verify DSN is correct
- Check Sentry project settings
- Ensure errors occur in client components

### Analytics not showing data
- Wait 5-10 minutes after event
- Check Analytics is enabled in Vercel
- Verify tracking code is in production build

## Quick Setup Checklist

- [ ] Install test dependencies: `npm install`
- [ ] Install Playwright browsers: `npx playwright install`
- [ ] Add environment variables to `.env.local`
- [ ] Run tests locally: `npm run test:phase3`
- [ ] Deploy to Vercel
- [ ] Enable Vercel Analytics in dashboard
- [ ] Configure Sentry (run wizard)
- [ ] Setup UptimeRobot monitor
- [ ] Add GitHub secrets for CI
- [ ] Verify health check works
- [ ] Test analytics tracking
- [ ] Verify error capture

## Support

- Test Issues: See `PHASE3_TESTING.md`
- DevOps Setup: See `DEVOPS_SETUP.md`
- Full Report: See `PHASE3_TEST_DEVOPS_REPORT.md`
